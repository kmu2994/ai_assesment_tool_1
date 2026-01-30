"""
Pydantic Schemas for API Request/Response - MongoDB Version
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
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
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    accessibility_mode: bool = False
    
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
    bloom_level: str = "Remembering"
    concept_tags: List[str] = []
    adaptive_variants: List[Dict[str, Any]] = []

class QuestionResponse(BaseModel):
    id: str
    question_text: str
    question_type: str
    difficulty: float
    points: float
    options: Optional[Dict[str, str]] = None
    bloom_level: Optional[str] = None
    concept_tags: List[str] = []
    adaptive_variants: List[Dict[str, Any]] = []
    
    class Config:
        from_attributes = True

class ExamAICreate(BaseModel):
    title: str
    description: Optional[str] = None
    num_questions: int = 10
    total_marks: float = 100.0
    passing_score: float = 40.0
    difficulty_distribution: Dict[str, float] = {"easy": 0.3, "medium": 0.4, "hard": 0.3}
    question_types: List[str] = ["mcq", "descriptive"]
    is_adaptive: bool = True

class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_adaptive: bool = True
    duration_minutes: int = 60
    total_marks: float = 100.0
    passing_score: float = 40.0
    questions: List[QuestionCreate] = []

class ExamResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    is_adaptive: bool = True
    duration_minutes: int = 60
    total_questions: int = 0
    total_marks: float = 100.0
    passing_score: float = 40.0
    is_active: bool = True
    created_at: Optional[datetime] = None
    user_status: Optional[str] = None # New field to track if user took the exam
    
    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    question_id: str
    answer: Optional[str] = None

class SubmissionResponse(BaseModel):
    id: str
    exam_id: str
    status: str
    total_score: float = 0.0
    percentage: float = 0.0
    
    class Config:
        from_attributes = True

class GradingResult(BaseModel):
    success: bool = True
    is_correct: bool = False
    score: float = 0.0
    feedback: str = ""
    similarity: Optional[float] = None
    plagiarism_detected: bool = False
    next_question: Optional[Dict[str, Any]] = None
    exam_complete: bool = False

class AnswerReview(BaseModel):
    answer_id: str
    modified_score: float
    teacher_remarks: Optional[str] = None

class SubmissionReview(BaseModel):
    submission_id: str
    teacher_remarks: Optional[str] = None
    answer_reviews: List[AnswerReview] = []
    is_finalized: bool = True
