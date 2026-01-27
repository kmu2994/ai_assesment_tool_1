"""
Exam Management API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import os
import uuid

from app.db.database import get_db
from app.db.models import User, Exam, Question, Submission, Answer
from app.agents.orchestrator import orchestrator
from app.core.config import settings
from .auth import get_current_user, require_role
from .schemas import ExamCreate, ExamResponse, QuestionCreate, QuestionResponse, AnswerSubmit, GradingResult

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.post("/create", response_model=ExamResponse)
async def create_exam(
    exam_data: ExamCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(["teacher", "admin"]))
):
    """Create a new exam (Teacher/Admin only)."""
    exam = Exam(
        title=exam_data.title,
        description=exam_data.description,
        created_by=user.id,
        is_adaptive=exam_data.is_adaptive,
        duration_minutes=exam_data.duration_minutes,
        total_marks=exam_data.total_marks,
        passing_score=exam_data.passing_score,
        total_questions=len(exam_data.questions)
    )
    db.add(exam)
    await db.flush()
    
    for q in exam_data.questions:
        question = Question(
            exam_id=exam.id,
            question_text=q.question_text,
            question_type=q.question_type,
            difficulty=q.difficulty,
            points=q.points,
            options=q.options,
            correct_answer=q.correct_answer,
            model_answer=q.model_answer
        )
        db.add(question)
    
    await db.commit()
    await db.refresh(exam)
    return exam

@router.get("/available", response_model=List[ExamResponse])
async def list_available_exams(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """List all active exams available for students."""
    result = await db.execute(select(Exam).where(Exam.is_active == True))
    return result.scalars().all()

@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Get exam details."""
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.post("/{exam_id}/start")
async def start_exam(exam_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Start an exam session."""
    result = await db.execute(select(Exam).options(selectinload(Exam.questions)).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    submission = Submission(user_id=user.id, exam_id=exam_id, status="in_progress", current_ability=0.5)
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    
    questions = [{"id": q.id, "difficulty": q.difficulty, "question_text": q.question_text, 
                  "question_type": q.question_type, "options": q.options, "points": q.points} for q in exam.questions]
    
    session_info = await orchestrator.start_exam_session(user.id, exam_id, questions, exam.is_adaptive)
    
    return {"submission_id": submission.id, "exam": exam, "first_question": session_info.get("first_question"),
            "total_questions": len(questions), "duration_minutes": exam.duration_minutes}

@router.post("/{submission_id}/answer", response_model=GradingResult)
async def submit_answer(
    submission_id: int,
    answer_data: AnswerSubmit,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Submit an answer for grading."""
    result = await db.execute(select(Submission).where(Submission.id == submission_id, Submission.user_id == user.id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    result = await db.execute(select(Question).where(Question.id == answer_data.question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    question_dict = {"question_type": question.question_type, "correct_answer": question.correct_answer,
                     "model_answer": question.model_answer, "points": question.points}
    
    grading = await orchestrator.process_answer(question_dict, answer_data.answer or "")
    
    answer = Answer(
        submission_id=submission_id, question_id=answer_data.question_id,
        student_answer=answer_data.answer, is_correct=grading.get("is_correct", False),
        score=grading.get("score", 0), feedback=grading.get("feedback", "")
    )
    db.add(answer)
    
    # Update submission ability and find next question if adaptive
    next_question = None
    exam_complete = False
    
    result = await db.execute(select(Exam).options(selectinload(Exam.questions)).where(Exam.id == submission.exam_id))
    exam = result.scalar_one()
    
    if exam.is_adaptive:
        # Get all answered questions for this submission
        result = await db.execute(select(Answer.question_id).where(Answer.submission_id == submission_id))
        answered_ids = [r[0] for r in result.all()]
        
        # Calculate next question using orchestrator
        questions_list = [{"id": q.id, "difficulty": q.difficulty, "question_text": q.question_text, 
                           "question_type": q.question_type, "options": q.options, "points": q.points} for q in exam.questions]
        
        adaptive_data = await orchestrator.get_next_question(
            questions=questions_list,
            current_ability=submission.current_ability,
            answered_ids=answered_ids,
            last_answer_correct=grading.get("is_correct", False),
            last_difficulty=question.difficulty
        )
        
        submission.current_ability = adaptive_data["current_ability"]
        next_question = adaptive_data["next_question"]
        exam_complete = adaptive_data["exam_complete"]
        
        # Check if we hit the total questions limit
        if len(answered_ids) >= exam.total_questions:
            exam_complete = True
            next_question = None
    else:
        # Sequential Flow: Get all answered questions
        result = await db.execute(select(Answer.question_id).where(Answer.submission_id == submission_id))
        answered_ids = [r[0] for r in result.all()]
        
        # Sort questions by ID and find the next one
        sorted_questions = sorted(exam.questions, key=lambda x: x.id)
        current_q_index = -1
        for i, q in enumerate(sorted_questions):
            if q.id == answer_data.question_id:
                current_q_index = i
                break
        
        if current_q_index != -1 and current_q_index + 1 < len(sorted_questions):
            nq = sorted_questions[current_q_index + 1]
            next_question = {"id": nq.id, "difficulty": nq.difficulty, "question_text": nq.question_text,
                             "question_type": nq.question_type, "options": nq.options, "points": nq.points}
        else:
            exam_complete = True

    await db.commit()
    
    return {
        **grading,
        "next_question": next_question,
        "exam_complete": exam_complete
    }

@router.post("/{submission_id}/finish")
async def finish_exam(submission_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Finish exam and get final results."""
    from datetime import datetime
    
    result = await db.execute(select(Submission).options(selectinload(Submission.answers)).where(
        Submission.id == submission_id, Submission.user_id == user.id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    answers = [{"score": a.score, "is_correct": a.is_correct, "max_points": 1.0} for a in submission.answers]
    final_result = await orchestrator.finish_exam(submission_id, answers)
    
    submission.status = "graded"
    submission.total_score = final_result["total_score"]
    submission.percentage = final_result["percentage"]
    submission.submitted_at = datetime.utcnow()
    await db.commit()
    
    return final_result

@router.delete("/{exam_id}")
async def delete_exam(
    exam_id: int, 
    db: AsyncSession = Depends(get_db), 
    user: User = Depends(require_role(["teacher", "admin"]))
):
    """Delete an exam (Teacher/Admin only). Teachers can only delete their own exams."""
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # Check permission: Admins can delete anything, teachers only their own
    if user.role != "admin" and exam.created_by != user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own exams")
        
    await db.delete(exam)
    await db.commit()
    return {"message": "Exam deleted successfully"}
