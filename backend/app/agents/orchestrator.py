"""
Exam Orchestrator Agent
Central controller for exam flow, delegating to specialized agents.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from .semantic_grader import grading_agent
from .adaptive_engine import adaptive_agent
from .ocr_processor import ocr_agent
from .analytics import analytics_agent

logger = logging.getLogger(__name__)

class ExamOrchestrator:
    """
    The main orchestrator that coordinates all agents during an exam.
    Manages exam lifecycle: start -> questions -> answers -> grading -> results.
    """
    
    def __init__(self):
        self.grader = grading_agent
        self.adaptive = adaptive_agent
        self.ocr = ocr_agent
        self.analytics = analytics_agent
    
    async def start_exam_session(
        self, 
        student_id: int, 
        exam_id: int,
        questions: List[Dict],
        is_adaptive: bool = True
    ) -> Dict[str, Any]:
        """
        Initialize a new exam session.
        
        Returns:
            Session info with first question
        """
        # Initial ability estimate
        initial_ability = 0.5
        
        if is_adaptive:
            # Get first question based on medium difficulty
            first_question = self.adaptive.get_next_question(
                available_questions=questions,
                current_ability=initial_ability,
                answered_question_ids=[]
            )
        else:
            # Get first question in the list (sequential)
            sorted_qs = sorted(questions, key=lambda x: x.get('id', 0))
            first_question = sorted_qs[0] if sorted_qs else None
        
        return {
            "session_started": True,
            "current_ability": initial_ability,
            "first_question": first_question,
            "total_questions": len(questions)
        }
    
    async def process_answer(
        self,
        question: Dict,
        student_answer: str,
        image_bytes: Optional[bytes] = None
    ) -> Dict[str, Any]:
        """
        Process a student's answer (text or handwritten).
        
        Args:
            question: The question being answered
            student_answer: Text answer (empty if handwritten)
            image_bytes: Handwritten image bytes (optional)
            
        Returns:
            Grading result
        """
        question_type = question.get('question_type', 'mcq')
        extracted_text = None
        
        # Handle handwritten submission
        if image_bytes:
            logger.info("Processing handwritten answer via OCR...")
            ocr_result = self.ocr.extract_text(image_bytes)
            
            if ocr_result['success']:
                extracted_text = ocr_result['text']
                student_answer = extracted_text
                logger.info(f"OCR extracted: {extracted_text[:100]}...")
            else:
                return {
                    "success": False,
                    "error": "Failed to process handwritten image",
                    "ocr_result": ocr_result,
                    "needs_manual_review": True
                }
        
        # Grade based on question type
        if question_type == 'mcq':
            result = self._grade_mcq(question, student_answer)
        else:
            result = self._grade_descriptive(question, student_answer)
        
        # Add OCR info if applicable
        if extracted_text:
            result['extracted_text'] = extracted_text
        
        return result
    
    def _grade_mcq(self, question: Dict, student_answer: str) -> Dict[str, Any]:
        """Grade an MCQ answer."""
        correct_answer = question.get('correct_answer', '').strip().upper()
        student_answer = student_answer.strip().upper()
        
        is_correct = student_answer == correct_answer
        points = question.get('points', 1.0)
        
        return {
            "success": True,
            "is_correct": is_correct,
            "score": points if is_correct else 0,
            "correct_answer": correct_answer,
            "feedback": "Correct!" if is_correct else f"Incorrect. The correct answer was {correct_answer}."
        }
    
    def _grade_descriptive(self, question: Dict, student_answer: str) -> Dict[str, Any]:
        """Grade a descriptive answer using semantic similarity."""
        model_answer = question.get('model_answer', '')
        points = question.get('points', 1.0)
        
        result = self.grader.grade_answer(
            student_answer=student_answer,
            model_answer=model_answer,
            max_points=points
        )
        
        result['success'] = True
        result['is_correct'] = result['percentage'] >= 50
        
        return result
    
    async def get_next_question(
        self,
        questions: List[Dict],
        current_ability: float,
        answered_ids: List[int],
        last_answer_correct: bool,
        last_difficulty: float = 0.5
    ) -> Dict[str, Any]:
        """
        Get the next adaptive question.
        
        Returns:
            Next question and updated ability
        """
        # Update ability based on last answer
        new_ability = self.adaptive.update_ability(
            current_ability=current_ability,
            question_difficulty=last_difficulty,
            is_correct=last_answer_correct
        )
        
        # Get next question
        next_question = self.adaptive.get_next_question(
            available_questions=questions,
            current_ability=new_ability,
            answered_question_ids=answered_ids
        )
        
        if next_question is None:
            return {
                "exam_complete": True,
                "current_ability": new_ability,
                "next_question": None
            }
        
        return {
            "exam_complete": False,
            "current_ability": new_ability,
            "next_question": next_question
        }
    
    async def finish_exam(
        self,
        submission_id: int,
        answers: List[Dict]
    ) -> Dict[str, Any]:
        """
        Finalize an exam and generate results.
        
        Returns:
            Final results and analytics
        """
        total_score = sum(a.get('score', 0) for a in answers)
        max_score = sum(a.get('max_points', 1) for a in answers)
        percentage = (total_score / max_score * 100) if max_score > 0 else 0
        
        correct_count = sum(1 for a in answers if a.get('is_correct'))
        
        # Generate analytics
        performance = self.analytics.calculate_student_performance([{
            'percentage': percentage
        }])
        
        return {
            "submission_id": submission_id,
            "total_score": round(total_score, 2),
            "max_score": round(max_score, 2),
            "percentage": round(percentage, 2),
            "questions_answered": len(answers),
            "correct_answers": correct_count,
            "grade": self._calculate_grade(percentage),
            "analytics": performance
        }
    
    def _calculate_grade(self, percentage: float) -> str:
        """Convert percentage to letter grade."""
        if percentage >= 90:
            return "A+"
        elif percentage >= 80:
            return "A"
        elif percentage >= 70:
            return "B"
        elif percentage >= 60:
            return "C"
        elif percentage >= 50:
            return "D"
        else:
            return "F"


# Singleton instance
orchestrator = ExamOrchestrator()
