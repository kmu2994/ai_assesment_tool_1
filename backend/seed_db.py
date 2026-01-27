"""
Database initialization script with sample data
"""
import asyncio
from app.db.database import init_db, async_session_maker
from app.db.models import User, Exam, Question, Submission
from app.core.security import get_password_hash

async def seed_database():
    """Create initial data for testing."""
    from app.db.database import engine
    from app.db.models import Base
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # await init_db() # Already did it with create_all above
    
    async with async_session_maker() as db:
        # Create admin user
        admin = User(
            username="admin",
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            full_name="System Admin",
            role="admin"
        )
        db.add(admin)
        
        # Create teacher
        teacher = User(
            username="teacher",
            email="teacher@example.com",
            password_hash=get_password_hash("teacher123"),
            full_name="Demo Teacher",
            role="teacher"
        )
        db.add(teacher)
        
        # Create student
        student = User(
            username="student",
            email="student@example.com",
            password_hash=get_password_hash("student123"),
            full_name="Demo Student",
            role="student",
            accessibility_mode=True
        )
        db.add(student)
        
        await db.flush()
        
        # Create sample exam
        exam = Exam(
            title="Introduction to Computer Science",
            description="Basic concepts in computer science and programming",
            created_by=teacher.id,
            is_active=True,
            is_adaptive=True,
            duration_minutes=30,
            total_questions=5,
            passing_score=50
        )
        db.add(exam)
        await db.flush()
        
        # Add MCQ questions
        questions = [
            Question(
                exam_id=exam.id,
                question_text="What does CPU stand for?",
                question_type="mcq",
                difficulty=0.2,
                points=1,
                options={"A": "Central Processing Unit", "B": "Computer Personal Unit", "C": "Central Program Utility", "D": "Computer Processing Unit"},
                correct_answer="A"
            ),
            Question(
                exam_id=exam.id,
                question_text="Which of the following is a programming language?",
                question_type="mcq",
                difficulty=0.3,
                points=1,
                options={"A": "HTML", "B": "Python", "C": "CSS", "D": "SQL"},
                correct_answer="B"
            ),
            Question(
                exam_id=exam.id,
                question_text="What is the binary representation of decimal 10?",
                question_type="mcq",
                difficulty=0.5,
                points=1,
                options={"A": "1010", "B": "1100", "C": "1001", "D": "1110"},
                correct_answer="A"
            ),
            Question(
                exam_id=exam.id,
                question_text="What is an algorithm?",
                question_type="descriptive",
                difficulty=0.4,
                points=2,
                model_answer="An algorithm is a step-by-step procedure or formula for solving a problem. It is a sequence of instructions that defines how to perform a task or reach a solution."
            ),
            Question(
                exam_id=exam.id,
                question_text="Explain the concept of a variable in programming.",
                question_type="descriptive",
                difficulty=0.6,
                points=2,
                model_answer="A variable is a named storage location in computer memory that holds a value. Variables can store different types of data such as numbers, text, or boolean values, and their contents can be changed during program execution."
            )
        ]
        
        for q in questions:
            db.add(q)
        
        await db.flush()

        # Add sample graded submission for the student
        from datetime import datetime
        submission = Submission(
            user_id=student.id,
            exam_id=exam.id,
            status="graded",
            total_score=8.0,
            max_score=10.0,
            percentage=80.0,
            started_at=datetime.utcnow(),
            submitted_at=datetime.utcnow()
        )
        db.add(submission)
        
        await db.commit()
        print("Database seeded with history!")
        print("Users created:")
        print("  - admin / admin123 (Admin)")
        print("  - teacher / teacher123 (Teacher)")
        print("  - student / student123 (Student with accessibility mode)")
        print(f"Sample exam created: {exam.title}")

if __name__ == "__main__":
    asyncio.run(seed_database())
