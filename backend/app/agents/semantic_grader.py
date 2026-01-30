import logging
import re
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SemanticGradingAgent:
    """
    Agent responsible for grading descriptive answers.
    MOCKED: Uses word overlap instead of heavy Sentence-BERT for immediate project demonstration.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        # Mock model loading
        if not hasattr(self, '_initialized'):
            logger.info("Semantic grading (Mocked Mode) initialized using word overlap.")
            self._initialized = True
    
    def _get_overlap(self, student_text: str, model_text: str) -> Dict[str, Any]:
        """Calculate recall-based keyword overlap."""
        if not student_text or not model_text:
            return {"similarity": 0.0, "keywords_matched": []}
        
        # Filter out common stop words for better keyword matching
        stop_words = {'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'with', 'of'}
        
        student_words = set(re.findall(r'\w+', student_text.lower()))
        model_words = set(re.findall(r'\w+', model_text.lower()))
        
        # Keywords are model words that aren't stop words
        keywords = model_words - stop_words
        
        if not keywords:
            # If model answer is very short (like one word), just compare directly
            intersection = student_words.intersection(model_words)
            similarity = len(intersection) / len(model_words) if model_words else 0.0
            return {"similarity": similarity, "keywords_matched": list(intersection)}
            
        intersection = student_words.intersection(keywords)
        
        # Calculate Recall (how many model keywords did the student cover?)
        # This is better for "Key Points" than Jaccard similarity
        similarity = len(intersection) / len(keywords)
        
        return {
            "similarity": similarity,
            "keywords_matched": list(intersection)
        }

    def grade_answer(self, student_answer: str, model_answer: str, max_points: float = 1.0) -> Dict[str, Any]:
        """
        Grade a descriptive answer by matching against model answer keywords.
        """
        if not student_answer or not student_answer.strip():
            return {
                "score": 0.0,
                "similarity": 0.0,
                "percentage": 0,
                "feedback": "No answer provided.",
                "grade": "F"
            }
        
        if not model_answer or not model_answer.strip():
            return {
                "score": 0.0,
                "similarity": 0.0,
                "percentage": 0,
                "feedback": "No reference answer available for comparison.",
                "grade": "N/A"
            }
        
        try:
            # Analysis
            analysis = self._get_overlap(student_answer, model_answer)
            similarity = analysis["similarity"]
            matched_keywords = analysis["keywords_matched"]
            
            # Grade based on keyword coverage
            if similarity >= 0.85:
                percentage = 100
                grade = "A+"
                feedback = f"Excellent coverage of key concepts! You matched several key points including: {', '.join(matched_keywords[:3])}."
            elif similarity >= 0.65:
                percentage = 85
                grade = "A"
                feedback = "Great job! You identified most of the critical points requested."
            elif similarity >= 0.45:
                percentage = 70
                grade = "B"
                feedback = "Good response. You've hit the main concepts, though some depth could be added."
            elif similarity >= 0.25:
                percentage = 50
                grade = "C"
                feedback = "Partial understanding. You mentioned some relevant terms, but missed core details."
            elif similarity >= 0.1:
                percentage = 25
                grade = "D"
                feedback = "Basic effort. Only 1-2 keywords were identified. Review the topic again."
            else:
                percentage = 0
                grade = "F"
                feedback = "Your answer does not address the required key points for this question."
            
            # Calculate actual score
            score = (percentage / 100) * max_points
            
            return {
                "score": round(score, 2),
                "similarity": round(similarity, 4),
                "percentage": percentage,
                "feedback": feedback,
                "grade": grade,
                "matched_count": len(matched_keywords)
            }
            
        except Exception as e:
            logger.error(f"Grading error: {e}")
            return {
                "score": 0.0,
                "similarity": 0.0,
                "percentage": 0,
                "feedback": f"Error during grading: {str(e)}",
                "grade": "Error"
            }
    
    def batch_grade(self, answers: list) -> list:
        """Grade multiple answers in batch."""
        results = []
        for answer in answers:
            result = self.grade_answer(
                student_answer=answer.get('student_answer', ''),
                model_answer=answer.get('model_answer', ''),
                max_points=answer.get('max_points', 1.0)
            )
            results.append(result)
        return results


# Singleton instance
grading_agent = SemanticGradingAgent()
