"""
Exam Management API Routes - MongoDB Version
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from beanie import PydanticObjectId
from datetime import datetime
import os

from app.db.models import User, Exam, Question, Submission, Answer
from app.agents.orchestrator import orchestrator
from app.core.config import settings
from .auth import get_current_user, require_role
from .schemas import ExamCreate, ExamResponse, QuestionCreate, QuestionResponse, AnswerSubmit, GradingResult, SubmissionReview

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.post("/create", response_model=ExamResponse)
async def create_exam(
    exam_data: ExamCreate,
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
    await exam.insert()
    
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
        await question.insert()
    
    return ExamResponse(
        id=str(exam.id),
        title=exam.title,
        description=exam.description,
        is_adaptive=exam.is_adaptive,
        duration_minutes=exam.duration_minutes,
        total_questions=exam.total_questions,
        total_marks=exam.total_marks,
        passing_score=exam.passing_score
    )

@router.get("/available", response_model=List[ExamResponse])
async def list_available_exams(user: User = Depends(get_current_user)):
    """List all active exams available for students."""
    exams = await Exam.find(Exam.is_active == True).to_list()
    return [
        ExamResponse(
            id=str(e.id),
            title=e.title,
            description=e.description,
            is_adaptive=e.is_adaptive,
            duration_minutes=e.duration_minutes,
            total_questions=e.total_questions,
            total_marks=e.total_marks,
            passing_score=e.passing_score
        ) for e in exams
    ]

@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: str, user: User = Depends(get_current_user)):
    """Get exam details."""
    exam = await Exam.get(PydanticObjectId(exam_id))
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return ExamResponse(
        id=str(exam.id),
        title=exam.title,
        description=exam.description,
        is_adaptive=exam.is_adaptive,
        duration_minutes=exam.duration_minutes,
        total_questions=exam.total_questions,
        total_marks=exam.total_marks,
        passing_score=exam.passing_score
    )

@router.post("/{exam_id}/start")
async def start_exam(exam_id: str, user: User = Depends(get_current_user)):
    """Start an exam session."""
    exam = await Exam.get(PydanticObjectId(exam_id))
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get questions for this exam
    questions_docs = await Question.find(Question.exam_id == exam.id).to_list()
    
    submission = Submission(
        user_id=user.id,
        exam_id=exam.id,
        status="in_progress",
        current_ability=0.5
    )
    await submission.insert()
    
    questions = [{"id": str(q.id), "difficulty": q.difficulty, "question_text": q.question_text, 
                  "question_type": q.question_type, "options": q.options, "points": q.points} for q in questions_docs]
    
    session_info = await orchestrator.start_exam_session(str(user.id), str(exam.id), questions, exam.is_adaptive)
    
    return {
        "submission_id": str(submission.id),
        "exam": {
            "id": str(exam.id),
            "title": exam.title,
            "description": exam.description,
            "is_adaptive": exam.is_adaptive,
            "duration_minutes": exam.duration_minutes,
            "total_questions": exam.total_questions
        },
        "first_question": session_info.get("first_question"),
        "total_questions": len(questions),
        "duration_minutes": exam.duration_minutes
    }

@router.post("/{submission_id}/answer", response_model=GradingResult)
async def submit_answer(
    submission_id: str,
    answer_data: AnswerSubmit,
    user: User = Depends(get_current_user)
):
    """Submit an answer for grading."""
    submission = await Submission.get(PydanticObjectId(submission_id))
    if not submission or submission.user_id != user.id:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    question = await Question.get(PydanticObjectId(answer_data.question_id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    question_dict = {
        "question_type": question.question_type,
        "correct_answer": question.correct_answer,
        "model_answer": question.model_answer,
        "points": question.points
    }
    
    grading = await orchestrator.process_answer(question_dict, answer_data.answer or "")
    
    answer = Answer(
        submission_id=submission.id,
        question_id=question.id,
        student_answer=answer_data.answer,
        is_correct=grading.get("is_correct", False),
        score=grading.get("score", 0),
        feedback=grading.get("feedback", "")
    )
    await answer.insert()
    
    # Update submission ability and find next question
    next_question = None
    exam_complete = False
    
    exam = await Exam.get(submission.exam_id)
    questions_docs = await Question.find(Question.exam_id == exam.id).to_list()
    
    # Get all answered questions for this submission
    answered_docs = await Answer.find(Answer.submission_id == submission.id).to_list()
    answered_ids = [str(a.question_id) for a in answered_docs]
    
    if exam.is_adaptive:
        questions_list = [{"id": str(q.id), "difficulty": q.difficulty, "question_text": q.question_text, 
                          "question_type": q.question_type, "options": q.options, "points": q.points} for q in questions_docs]
        
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
        
        if len(answered_ids) >= exam.total_questions:
            exam_complete = True
            next_question = None
    else:
        # Sequential Flow
        sorted_questions = sorted(questions_docs, key=lambda x: x.id)
        current_q_index = -1
        for i, q in enumerate(sorted_questions):
            if str(q.id) == answer_data.question_id:
                current_q_index = i
                break
        
        if current_q_index != -1 and current_q_index + 1 < len(sorted_questions):
            nq = sorted_questions[current_q_index + 1]
            next_question = {"id": str(nq.id), "difficulty": nq.difficulty, "question_text": nq.question_text,
                            "question_type": nq.question_type, "options": nq.options, "points": nq.points}
        else:
            exam_complete = True
    
    await submission.save()
    
    return {
        **grading,
        "next_question": next_question,
        "exam_complete": exam_complete
    }

@router.post("/{submission_id}/finish")
async def finish_exam(submission_id: str, user: User = Depends(get_current_user)):
    """Finish exam and get final results."""
    submission = await Submission.get(PydanticObjectId(submission_id))
    if not submission or submission.user_id != user.id:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    answers_docs = await Answer.find(Answer.submission_id == submission.id).to_list()
    answers = [{"score": a.score, "is_correct": a.is_correct, "max_points": 1.0} for a in answers_docs]
    
    final_result = await orchestrator.finish_exam(str(submission.id), answers)
    
    submission.status = "graded"
    submission.total_score = final_result["total_score"]
    submission.percentage = final_result["percentage"]
    submission.submitted_at = datetime.utcnow()
    await submission.save()
    
    return final_result

@router.post("/{submission_id}/upload-answer", response_model=GradingResult)
async def upload_answer(
    submission_id: str,
    question_id: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """Upload an image/PDF answer sheet for AI analysis."""
    submission = await Submission.get(PydanticObjectId(submission_id))
    if not submission or submission.user_id != user.id:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    question = await Question.get(PydanticObjectId(question_id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Read file bytes
    content = await file.read()
    
    # Save file to disk
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{submission_id}_{question_id}_{datetime.utcnow().timestamp()}{file_ext}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Processing through orchestrator (OCR + Grading)
    question_dict = {
        "question_type": question.question_type,
        "correct_answer": question.correct_answer,
        "model_answer": question.model_answer,
        "points": question.points
    }
    
    grading = await orchestrator.process_answer(
        question=question_dict,
        student_answer="", 
        image_bytes=content
    )
    
    # Store Answer
    answer = Answer(
        submission_id=submission.id,
        question_id=question.id,
        student_answer=grading.get("extracted_text", ""),
        extracted_text=grading.get("extracted_text", ""),
        image_path=file_path,
        is_correct=grading.get("is_correct", False),
        score=grading.get("score", 0),
        original_ai_score=grading.get("score", 0),
        feedback=grading.get("feedback", ""),
    )
    await answer.insert()
    
    # Check if exam is complete (Sequential Flow)
    exam = await Exam.get(submission.exam_id)
    questions_docs = await Question.find(Question.exam_id == exam.id).to_list()
    answered_docs = await Answer.find(Answer.submission_id == submission.id).to_list()
    answered_ids = [str(a.question_id) for a in answered_docs]
    
    exam_complete = len(answered_ids) >= exam.total_questions
    next_question = None
    
    if not exam_complete:
        sorted_qs = sorted(questions_docs, key=lambda x: x.id)
        current_idx = -1
        for i, q in enumerate(sorted_qs):
            if str(q.id) == question_id:
                current_idx = i
                break
        if current_idx != -1 and current_idx + 1 < len(sorted_qs):
            nq = sorted_qs[current_idx + 1]
            next_question = {"id": str(nq.id), "difficulty": nq.difficulty, "question_text": nq.question_text,
                            "question_type": nq.question_type, "options": nq.options, "points": nq.points}
        else:
            exam_complete = True

    return {
        **grading,
        "next_question": next_question,
        "exam_complete": exam_complete
    }

@router.get("/submission/{submission_id}")
async def get_submission(
    submission_id: str,
    user: User = Depends(get_current_user)
):
    """Get full details of a submission including answers for review."""
    submission = await Submission.get(PydanticObjectId(submission_id))
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Permission check: Own submission or Teacher/Admin
    if user.role.value == "student" and submission.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only view your own entries")

    exam = await Exam.get(submission.exam_id)
    answers_docs = await Answer.find(Answer.submission_id == submission.id).to_list()
    
    # Get associated questions
    results = []
    for ans in answers_docs:
        q = await Question.get(ans.question_id)
        results.append({
            "answer_id": str(ans.id),
            "question_text": q.question_text if q else "Question deleted",
            "student_answer": ans.student_answer,
            "extracted_text": ans.extracted_text,
            "model_answer": q.model_answer if q else None,
            "ai_score": ans.original_ai_score,
            "current_score": ans.score,
            "max_points": q.points if q else 1.0,
            "feedback": ans.feedback,
            "teacher_remarks": ans.teacher_remarks,
            "plagiarism_detected": ans.plagiarism_detected,
            "image_url": f"/api/{ans.image_path.replace('\\', '/')}" if ans.image_path else None
        })
        
    return {
        "submission_id": str(submission.id),
        "exam_title": exam.title if exam else "Exam deleted",
        "student_id": str(submission.user_id),
        "status": submission.status,
        "total_score": submission.total_score,
        "max_score": submission.max_score,
        "percentage": submission.percentage,
        "is_finalized": submission.is_finalized,
        "teacher_remarks": submission.teacher_remarks,
        "answers": results
    }

@router.post("/review")
async def review_submission(
    review_data: SubmissionReview,
    user: User = Depends(require_role(["teacher", "admin"]))
):
    """Teacher review endpoint: Modify scores, add remarks, and finalize results."""
    submission = await Submission.get(PydanticObjectId(review_data.submission_id))
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    total_score = 0
    max_score = 0
    for ar in review_data.answer_reviews:
        answer = await Answer.get(PydanticObjectId(ar.answer_id))
        if answer:
            answer.score = ar.modified_score
            answer.teacher_remarks = ar.teacher_remarks
            await answer.save()
            total_score += answer.score
            
            # Recalculate max score if needed
            q = await Question.get(answer.question_id)
            if q:
                max_score += q.points
        
    submission.total_score = total_score
    if max_score > 0:
        submission.max_score = max_score
        submission.percentage = (submission.total_score / submission.max_score) * 100
        
    submission.teacher_remarks = review_data.teacher_remarks
    submission.is_finalized = review_data.is_finalized
    submission.status = "graded" if review_data.is_finalized else "reviewing"
        
    await submission.save()
    return {"message": "Submission reviewed successfully", "final_score": submission.total_score}

@router.delete("/{exam_id}")
async def delete_exam(
    exam_id: str, 
    user: User = Depends(require_role(["teacher", "admin"]))
):
    """Delete an exam (Teacher/Admin only). Teachers can only delete their own exams."""
    exam = await Exam.get(PydanticObjectId(exam_id))
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # Check permission: Admins can delete anything, teachers only their own
    if user.role.value != "admin" and exam.created_by != user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own exams")
    
    # Delete associated questions
    await Question.find(Question.exam_id == exam.id).delete()
    
    await exam.delete()
    return {"message": "Exam deleted successfully"}

