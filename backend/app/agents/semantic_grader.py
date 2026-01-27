# from sentence_transformers import SentenceTransformer, util
import logging
import re

logger = logging.getLogger(__name__)

class SemanticGradingAgent:
    """
    Agent responsible for grading descriptive answers.
    MOCKED: Uses word overlap instead of heavy Sentence-BERT for immediate project demonstration.
    """
    
    _instance = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        # Mock model loading
        logger.info("Semantic grading (Mocked Mode) initialized.")
    
    @property
    def model(self):
        return None
    
    def _get_overlap(self, text1: str, text2: str) -> float:
        words1 = set(re.findall(r'\w+', text1.lower()))
        words2 = set(re.findall(r'\w+', text2.lower()))
        if not words1 or not words2: return 0.0
        intersection = words1.intersection(words2)
        return len(intersection) / max(len(words1), len(words2))

    def grade_answer(self, student_answer: str, model_answer: str, max_points: float = 1.0) -> Dict[str, Any]:
        # Handle empty answers
        if not student_answer or not student_answer.strip():
            return {
                "score": 0.0,
                "similarity": 0.0,
                "percentage": 0,
                "feedback": "No answer provided.",
                "grade": "F"
            }
        
        # Simple word overlap similarity
        similarity = self._get_overlap(student_answer, model_answer)
        # Boost similarity slightly for mock purposes to be more generous
        similarity = min(1.0, similarity * 1.5)
        """
        Grade a descriptive answer by comparing semantic similarity.
        
        Args:
            student_answer: The student's response text
            model_answer: The reference/correct answer
            max_points: Maximum points for this question
            
        Returns:
            Dictionary containing score, similarity, and feedback
        """
        # Handle empty answers
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
                "feedback": "No model answer available for comparison.",
                "grade": "N/A"
            }
        
        try:
            # Encode both answers
            embeddings = self.model.encode([student_answer, model_answer], convert_to_tensor=True)
            
            # Calculate cosine similarity
            similarity = util.cos_sim(embeddings[0], embeddings[1]).item()
            
            # Normalize negative similarity to 0
            similarity = max(0.0, similarity)
            
            # Grade based on similarity thresholds
            if similarity >= 0.85:
                percentage = 100
                grade = "A+"
                feedback = "Excellent! Your answer demonstrates complete understanding."
            elif similarity >= 0.75:
                percentage = 90
                grade = "A"
                feedback = "Great answer! Very close to the expected response."
            elif similarity >= 0.65:
                percentage = 80
                grade = "B"
                feedback = "Good understanding. Minor details may be missing."
            elif similarity >= 0.55:
                percentage = 65
                grade = "C"
                feedback = "Satisfactory. Some key concepts are present."
            elif similarity >= 0.45:
                percentage = 50
                grade = "D"
                feedback = "Partial understanding. Important concepts are missing."
            elif similarity >= 0.35:
                percentage = 30
                grade = "E"
                feedback = "Weak answer. Related but not accurate enough."
            else:
                percentage = 0
                grade = "F"
                feedback = "Answer does not match expected response."
            
            # Calculate actual score
            score = (percentage / 100) * max_points
            
            return {
                "score": round(score, 2),
                "similarity": round(similarity, 4),
                "percentage": percentage,
                "feedback": feedback,
                "grade": grade
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
        """
        Grade multiple answers in batch for efficiency.
        
        Args:
            answers: List of dicts with 'student_answer', 'model_answer', 'max_points'
            
        Returns:
            List of grading results
        """
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
