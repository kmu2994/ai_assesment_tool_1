"""
Pydantic Schemas for API Request/Response
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: UserRole = UserRole.STUDENT
    accessibility_mode: bool = False

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: str
    accessibility_mode: bool
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "mcq"
    difficulty: float = Field(0.5, ge=0.0, le=1.0)
    points: float = 1.0
    options: Optional[Dict[str, str]] = None
    correct_answer: Optional[str] = None
    model_answer: Optional[str] = None

class QuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: str
    difficulty: float
    points: float
    options: Optional[Dict[str, str]]
    class Config:
        from_attributes = True

class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_adaptive: bool = True
    duration_minutes: int = 60
    total_marks: float = 100.0
    passing_score: float = 40.0
    questions: List[QuestionCreate] = []

class ExamResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    is_adaptive: bool
    duration_minutes: int
    total_marks: float
    passing_score: float
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    question_id: int
    answer: Optional[str] = None

class SubmissionResponse(BaseModel):
    id: int
    exam_id: int
    status: str
    total_score: float
    percentage: float
    class Config:
        from_attributes = True

class GradingResult(BaseModel):
    success: bool
    is_correct: bool
    score: float
    feedback: str
    similarity: Optional[float] = None
    next_question: Optional[QuestionResponse] = None
    exam_complete: bool = False
