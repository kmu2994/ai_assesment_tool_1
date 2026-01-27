"""
SQLAlchemy Database Models
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    DESCRIPTIVE = "descriptive"

class SubmissionStatus(str, enum.Enum):
    STARTED = "started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"

# ============== USER MODEL ==============
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), default=UserRole.STUDENT.value)
    is_active = Column(Boolean, default=True)
    accessibility_mode = Column(Boolean, default=False)  # For disabled students
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    exams_created = relationship("Exam", back_populates="creator")
    submissions = relationship("Submission", back_populates="student")

# ============== EXAM MODEL ==============
class Exam(Base):
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    is_adaptive = Column(Boolean, default=True)  # Enable adaptive mode
    duration_minutes = Column(Integer, default=60)
    total_questions = Column(Integer, default=20)
    total_marks = Column(Float, default=100.0)
    passing_score = Column(Float, default=40.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="exams_created")
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="exam")

# ============== QUESTION MODEL ==============
class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"))
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20), default=QuestionType.MCQ.value)
    difficulty = Column(Float, default=0.5)  # 0.0 (easy) to 1.0 (hard)
    points = Column(Float, default=1.0)
    
    # For MCQ
    options = Column(JSON)  # {"A": "Option 1", "B": "Option 2", ...}
    correct_answer = Column(String(10))  # e.g., "A" for MCQ
    
    # For Descriptive
    model_answer = Column(Text)  # Reference answer for semantic grading
    
    # Relationships
    exam = relationship("Exam", back_populates="questions")
    answers = relationship("Answer", back_populates="question")

# ============== SUBMISSION MODEL ==============
class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exam_id = Column(Integer, ForeignKey("exams.id"))
    status = Column(String(20), default=SubmissionStatus.STARTED.value)
    current_ability = Column(Float, default=0.5)  # For adaptive exams
    total_score = Column(Float, default=0.0)
    max_score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime)
    
    # Relationships
    student = relationship("User", back_populates="submissions")
    exam = relationship("Exam", back_populates="submissions")
    answers = relationship("Answer", back_populates="submission", cascade="all, delete-orphan")

# ============== ANSWER MODEL ==============
class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    
    # Student's response
    student_answer = Column(Text)  # Text input or MCQ option
    image_path = Column(String(255))  # For handwritten uploads
    extracted_text = Column(Text)  # OCR result
    
    # Grading
    is_correct = Column(Boolean)
    score = Column(Float, default=0.0)
    similarity_score = Column(Float)  # For descriptive answers
    feedback = Column(Text)
    
    answered_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    submission = relationship("Submission", back_populates="answers")
    question = relationship("Question", back_populates="answers")
