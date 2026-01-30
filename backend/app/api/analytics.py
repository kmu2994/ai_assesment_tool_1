"""
Analytics and Dashboard API Routes - MongoDB Version
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from beanie import PydanticObjectId

from app.db.models import User, Exam, Submission, Answer, UserRole
from app.agents.analytics import analytics_agent
from .auth import get_current_user, require_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/student/me")
async def get_my_analytics(user: User = Depends(get_current_user)):
    """Get current student's performance analytics and history."""
    submissions = await Submission.find(
        Submission.user_id == user.id,
        Submission.status == "graded"
    ).sort(-Submission.submitted_at).to_list()
    
    submission_data = [{"percentage": s.percentage, "total_score": s.total_score} for s in submissions]
    analytics = analytics_agent.calculate_student_performance(submission_data)
    
    # Get exam details for each submission
    history = []
    for s in submissions:
        exam = await Exam.get(s.exam_id)
        history.append({
            "id": str(s.id),
            "exam_title": exam.title if exam else "Unknown Exam",
            "percentage": s.percentage,
            "submitted_at": s.submitted_at
        })
    
    return {
        "user": user.username, 
        "analytics": analytics,
        "history": history
    }

@router.get("/exam/{exam_id}")
async def get_exam_analytics(
    exam_id: str,
    user: User = Depends(require_role(["teacher", "admin"]))
):
    """Get exam performance analytics (Teacher/Admin only)."""
    exam = await Exam.get(PydanticObjectId(exam_id))
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    submissions = await Submission.find(
        Submission.exam_id == exam.id,
        Submission.status == "graded"
    ).to_list()
    
    submission_data = [{"percentage": s.percentage} for s in submissions]
    exam_data = {"passing_score": exam.passing_score}
    
    analytics = analytics_agent.analyze_exam_performance(exam_data, submission_data)
    return {"exam": exam.title, "analytics": analytics}

@router.get("/dashboard/teacher")
async def teacher_dashboard(user: User = Depends(require_role(["teacher", "admin"]))):
    """Get teacher dashboard overview."""
    exams = await Exam.find(Exam.created_by == user.id).to_list()
    exam_ids = [e.id for e in exams]
    
    # Get all submissions for teacher's exams
    submissions = await Submission.find(
        {"exam_id": {"$in": exam_ids}, "status": "graded"}
    ).sort(-Submission.submitted_at).to_list()
    
    # Get student and exam details for each submission
    student_submissions = []
    for s in submissions:
        student = await User.get(s.user_id)
        exam = await Exam.get(s.exam_id)
        student_submissions.append({
            "id": str(s.id),
            "student_name": student.full_name if student else "Unknown",
            "student_username": student.username if student else "",
            "exam_title": exam.title if exam else "Unknown",
            "percentage": s.percentage,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None
        })
    
    return {
        "total_exams_created": len(exams),
        "total_submissions": len(submissions),
        "exams": [{"id": str(e.id), "title": e.title, "is_active": e.is_active} for e in exams],
        "student_submissions": student_submissions
    }

@router.get("/dashboard/admin")
async def admin_dashboard(user: User = Depends(require_role(["admin"]))):
    """Get admin dashboard overview."""
    users = await User.find_all().to_list()
    exams = await Exam.find_all().to_list()
    submissions = await Submission.find_all().to_list()
    
    return {
        "total_users": len(users),
        "total_exams": len(exams),
        "total_submissions": len(submissions),
        "users_by_role": {
            "students": len([u for u in users if u.role == UserRole.STUDENT]),
            "teachers": len([u for u in users if u.role == UserRole.TEACHER]),
            "admins": len([u for u in users if u.role == UserRole.ADMIN])
        }
    }
