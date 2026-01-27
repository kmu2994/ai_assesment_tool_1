"""
Analytics and Dashboard API Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.db.database import get_db
from app.db.models import User, Exam, Submission, Answer
from app.agents.analytics import analytics_agent
from .auth import get_current_user, require_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/student/me")
async def get_my_analytics(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Get current student's performance analytics and history."""
    result = await db.execute(
        select(Submission)
        .options(selectinload(Submission.exam))
        .where(Submission.user_id == user.id, Submission.status == "graded")
        .order_by(Submission.submitted_at.desc())
    )
    submissions = result.scalars().all()
    
    submission_data = [{"percentage": s.percentage, "total_score": s.total_score} for s in submissions]
    analytics = analytics_agent.calculate_student_performance(submission_data)
    
    history = [
        {
            "id": s.id,
            "exam_title": s.exam.title if s.exam else "Unknown Exam",
            "percentage": s.percentage,
            "submitted_at": s.submitted_at
        }
        for s in submissions
    ]
    
    return {
        "user": user.username, 
        "analytics": analytics,
        "history": history
    }

@router.get("/exam/{exam_id}")
async def get_exam_analytics(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(["teacher", "admin"]))
):
    """Get exam performance analytics (Teacher/Admin only)."""
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    result = await db.execute(
        select(Submission).where(Submission.exam_id == exam_id, Submission.status == "graded")
    )
    submissions = result.scalars().all()
    
    submission_data = [{"percentage": s.percentage} for s in submissions]
    exam_data = {"passing_score": exam.passing_score}
    
    analytics = analytics_agent.analyze_exam_performance(exam_data, submission_data)
    return {"exam": exam.title, "analytics": analytics}

@router.get("/dashboard/teacher")
async def teacher_dashboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(["teacher", "admin"]))
):
    """Get teacher dashboard overview."""
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(select(Exam).where(Exam.created_by == user.id))
    exams = result.scalars().all()
    exam_ids = [e.id for e in exams]
    
    # Get all submissions for teacher's exams with student info
    result = await db.execute(
        select(Submission)
        .options(selectinload(Submission.user), selectinload(Submission.exam))
        .where(Submission.exam_id.in_(exam_ids), Submission.status == "graded")
        .order_by(Submission.submitted_at.desc())
    )
    submissions = result.scalars().all()
    
    student_submissions = [
        {
            "id": s.id,
            "student_name": s.user.full_name if s.user else "Unknown",
            "student_username": s.user.username if s.user else "",
            "exam_title": s.exam.title if s.exam else "Unknown",
            "percentage": s.percentage,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None
        }
        for s in submissions
    ]
    
    return {
        "total_exams_created": len(exams),
        "total_submissions": len(submissions),
        "exams": [{"id": e.id, "title": e.title, "is_active": e.is_active} for e in exams],
        "student_submissions": student_submissions
    }

@router.get("/dashboard/admin")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(["admin"]))
):
    """Get admin dashboard overview."""
    users_result = await db.execute(select(User))
    users = users_result.scalars().all()
    
    exams_result = await db.execute(select(Exam))
    exams = exams_result.scalars().all()
    
    submissions_result = await db.execute(select(Submission))
    submissions = submissions_result.scalars().all()
    
    return {
        "total_users": len(users),
        "total_exams": len(exams),
        "total_submissions": len(submissions),
        "users_by_role": {
            "students": len([u for u in users if u.role == "student"]),
            "teachers": len([u for u in users if u.role == "teacher"]),
            "admins": len([u for u in users if u.role == "admin"])
        }
    }
