import logging
import json
from typing import Dict, Any
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

class SemanticGradingAgent:
    """
    Agent responsible for grading descriptive answers using NVIDIA NIM.
    Matches student answers against model answers with semantic depth.
    """
    
    def __init__(self):
        self.api_key = settings.NVIDIA_API_KEY
        self.base_url = "https://integrate.api.nvidia.com/v1"
        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url) if self.api_key else None
        self.model = settings.NVIDIA_LLM_MODEL
        logger.info(f"NVIDIA Semantic Grader initialized: {'Configured' if self.client else 'Mock Mode'}")

    def grade_answer(self, student_answer: str, model_answer: str, max_points: float = 1.0) -> Dict[str, Any]:
        """
        Grade a descriptive answer using NVIDIA NIM.
        """
        if not student_answer or not student_answer.strip():
            return {"score": 0.0, "percentage": 0, "feedback": "No answer provided.", "grade": "F"}
        
        if not self.client:
            # Fallback to simple matching if no API key
            return self._mock_grade(student_answer, model_answer, max_points)

        prompt = f"""
        Compare the student's answer to the model answer and provide a grade.
        
        Model Answer: {model_answer}
        Student's Answer: {student_answer}
        
        Criteria:
        - Check for semantic similarity and key concept coverage.
        - Ignore minor grammatical errors.
        - Return a JSON object with:
            - score (float out of {max_points})
            - percentage (int 0-100)
            - feedback (string explaining the score)
            - grade (A+, A, B, C, D, or F)
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={ "type": "json_object" }
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"NVIDIA Grading Error: {e}")
            return self._mock_grade(student_answer, model_answer, max_points)

    def _mock_grade(self, student_answer: str, model_answer: str, max_points: float) -> Dict[str, Any]:
        """Simple keyword-based fallback grading."""
        student_words = set(student_answer.lower().split())
        model_words = set(model_answer.lower().split())
        overlap = len(student_words.intersection(model_words))
        ratio = overlap / len(model_words) if model_words else 0
        
        percentage = int(ratio * 100)
        score = round(ratio * max_points, 2)
        
        return {
            "score": score,
            "percentage": percentage,
            "feedback": "Graded via fallback keyword matching.",
            "grade": "C" if ratio > 0.4 else "F"
        }

grading_agent = SemanticGradingAgent()
