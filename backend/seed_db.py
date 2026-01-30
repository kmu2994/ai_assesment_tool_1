"""
MongoDB Database Seeder
Seeds the database with initial demo data
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

# Import models
from app.db.models import User, Exam, Question, Submission, Answer, UserRole

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ai_assessment")


async def seed_database():
    """Seed the database with demo data."""
    print("Connecting to MongoDB...")
    
    client = AsyncIOMotorClient(MONGODB_URL)
    
    await init_beanie(
        database=client[DATABASE_NAME],
        document_models=[User, Exam, Question, Submission, Answer]
    )
    
    print("Connected! Clearing existing data...")
    
    # Clear existing data
    await User.delete_all()
    await Exam.delete_all()
    await Question.delete_all()
    await Submission.delete_all()
    await Answer.delete_all()
    
    print("Creating users...")
    
    # Create Admin
    admin = User(
        username="admin",
        email="admin@example.com",
        password_hash=pwd_context.hash("admin123"),
        full_name="System Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    await admin.insert()
    
    # Create Teacher
    teacher = User(
        username="teacher",
        email="teacher@example.com",
        password_hash=pwd_context.hash("teacher123"),
        full_name="Demo Teacher",
        role=UserRole.TEACHER,
        is_active=True
    )
    await teacher.insert()
    
    # Create Student
    student = User(
        username="student",
        email="student@example.com",
        password_hash=pwd_context.hash("student123"),
        full_name="Demo Student",
        role=UserRole.STUDENT,
        is_active=True,
        accessibility_mode=True
    )
    await student.insert()
    
    print("Creating sample exam...")
    
    # Create Exam
    exam = Exam(
        title="Introduction to Computer Science",
        description="Basic concepts in computer science and programming",
        created_by=teacher.id,
        is_active=True,
        is_adaptive=True,
        duration_minutes=30,
        total_questions=5,
        total_marks=100.0,
        passing_score=50.0
    )
    await exam.insert()
    
    print("Creating questions...")
    
    # Create MCQ Questions
    questions_data = [
        {
            "question_text": "What does CPU stand for?",
            "question_type": "mcq",
            "difficulty": 0.2,
            "points": 1.0,
            "options": {
                "A": "Central Processing Unit",
                "B": "Computer Personal Unit",
                "C": "Central Program Utility",
                "D": "Computer Processing Unit"
            },
            "correct_answer": "A"
        },
        {
            "question_text": "Which of the following is a programming language?",
            "question_type": "mcq",
            "difficulty": 0.3,
            "points": 1.0,
            "options": {
                "A": "HTML",
                "B": "Python",
                "C": "CSS",
                "D": "SQL"
            },
            "correct_answer": "B"
        },
        {
            "question_text": "What is the binary representation of decimal 10?",
            "question_type": "mcq",
            "difficulty": 0.5,
            "points": 1.0,
            "options": {
                "A": "1010",
                "B": "1100",
                "C": "1001",
                "D": "1110"
            },
            "correct_answer": "A"
        },
        {
            "question_text": "What is an algorithm?",
            "question_type": "descriptive",
            "difficulty": 0.4,
            "points": 2.0,
            "model_answer": "An algorithm is a step-by-step procedure or formula for solving a problem. It is a sequence of instructions that defines how to perform a task or reach a solution."
        },
        {
            "question_text": "Explain the concept of a variable in programming.",
            "question_type": "descriptive",
            "difficulty": 0.6,
            "points": 2.0,
            "model_answer": "A variable is a named storage location in computer memory that holds a value. Variables can store different types of data such as numbers, text, or boolean values, and their contents can be changed during program execution."
        }
    ]
    
    for q_data in questions_data:
        question = Question(
            exam_id=exam.id,
            question_text=q_data["question_text"],
            question_type=q_data["question_type"],
            difficulty=q_data["difficulty"],
            points=q_data["points"],
            options=q_data.get("options"),
            correct_answer=q_data.get("correct_answer"),
            model_answer=q_data.get("model_answer")
        )
        await question.insert()
    
    print("Creating sample submission...")
    
    # Create a sample graded submission for history
    submission = Submission(
        user_id=student.id,
        exam_id=exam.id,
        status="graded",
        current_ability=0.5,
        total_score=8.0,
        max_score=10.0,
        percentage=80.0,
        started_at=datetime.now(),
        submitted_at=datetime.now()
    )
    await submission.insert()
    
    print("\n" + "="*50)
    print("[OK] Database seeded successfully!")
    print("="*50)
    print("\nTest Accounts Created:")
    print("  - admin / admin123 (Admin)")
    print("  - teacher / teacher123 (Teacher)")
    print("  - student / student123 (Student with accessibility mode)")
    print(f"\nSample Exam: {exam.title}")
    print(f"Total Questions: {len(questions_data)}")
    print("="*50)
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
