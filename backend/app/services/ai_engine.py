import logging
import random
from typing import List, Dict, Any, Tuple
import numpy as np
import cv2
import pytesseract
from sentence_transformers import SentenceTransformer, util

# Configuration
# Point this to your tesseract executable if on Windows, e.g., r"C:\Program Files\Tesseract-OCR\tesseract.exe"
# pytesseract.pytesseract.tesseract_cmd = 'tesseract'

class AIEngine:
    def __init__(self):
        print("Loading AI Models... (This might take a moment)")
        # Load SBERT model for semantic similarity
        # 'all-MiniLM-L6-v2' is optimized for speed/performance on CPU
        self.model = SentenceTransformer('all-MiniLM-L6-v2') 
        print("AI Models Loaded.")

    def grade_descriptive_answer(self, student_answer: str, reference_answer: str) -> Dict[str, Any]:
        """
        Grades a descriptive answer by comparing semantic similarity 
        with the reference answer using SBERT.
        """
        if not student_answer or not student_answer.strip():
            return {"score": 0, "feedback": "No answer provided.", "similarity": 0.0}

        # Compute embeddings
        embeddings1 = self.model.encode(student_answer, convert_to_tensor=True)
        embeddings2 = self.model.encode(reference_answer, convert_to_tensor=True)

        # Compute cosine similarity
        cosine_scores = util.cos_sim(embeddings1, embeddings2)
        similarity = float(cosine_scores[0][0])

        # Grading logic
        # Apply a sigmoid-like curve or thresholding to convert raw similarity to score
        score_percent = 0
        feedback = "Needs Improvement"

        if similarity > 0.85:
            score_percent = 100
            feedback = "Excellent! Meaning matches perfectly."
        elif similarity > 0.70:
            score_percent = 85
            feedback = "Good semantic match."
        elif similarity > 0.50:
            score_percent = 60
            feedback = "Partially correct. Key concepts might be missing."
        elif similarity > 0.30:
            score_percent = 30
            feedback = "Weak answer. Related but not accurate."
        else:
            score_percent = 0
            feedback = "Irrelevant answer."

        return {
            "score": score_percent,
            "raw_similarity": round(similarity, 4),
            "feedback": feedback
        }

    def process_handwritten_image(self, image_path: str) -> str:
        """
        Uses OpenCV to preprocess and Tesseract to extract text from a handwritten image.
        """
        try:
            # 1. Read Image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Image not found")

            # 2. Preprocessing
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Remove noise using Gaussian Blur
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Adaptive Thresholding to behave like a scanner (binarization)
            thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                           cv2.THRESH_BINARY, 11, 2)
            
            # 3. OCR Extraction
            # custom_config = r'--oem 3 --psm 6' # Default config
            text = pytesseract.image_to_string(thresh, lang='eng')
            
            return text.strip()
        except Exception as e:
            logging.error(f"OCR Failed: {e}")
            return ""

class AdaptiveExamEngine:
    def __init__(self):
        pass

    def get_next_question(self, 
                          current_student_ability: float, 
                          available_questions: List[Dict]) -> Dict:
        """
        Selects the next question based on Item Response Theory (IRT) logic.
        We want a question whose difficulty is closest to the student's current ability.
        """
        best_question = None
        min_diff = float('inf')

        for question in available_questions:
            diff = question.get('difficulty', 0.5)
            # Find question with difficulty closest to student ability
            distance = abs(diff - current_student_ability)
            if distance < min_diff:
                min_diff = distance
                best_question = question
        
        return best_question

    def update_student_ability(self, 
                               current_ability: float, 
                               question_difficulty: float, 
                               is_correct: bool) -> float:
        """
        Updates the student's estimated ability based on their answer.
        Simple heuristic update rule.
        """
        learning_rate = 0.1
        
        if is_correct:
            # If they got a hard question right, ability goes up significantly
            # If they got an easy question right, ability goes up slightly
            # We simplify this to just increasing ability.
            new_ability = current_ability + learning_rate
        else:
            # If they got it wrong, capability estimate drops
            new_ability = current_ability - learning_rate
        
        # Clamp between 0.0 and 1.0 (or whatever range we use)
        return max(0.1, min(1.0, new_ability))

# Example usage block
if __name__ == "__main__":
    ai = AIEngine()
    
    # Test Grading
    ref = "Photosynthesis is the process used by plants to convert light energy into chemical energy."
    stu = "Plants use sunlight to make food energy."
    
    result = ai.grade_descriptive_answer(stu, ref)
    print(f"Grading Result: {result}")

    # Test Adaptive Logic
    adaptive = AdaptiveExamEngine()
    ability = 0.5
    pool = [
        {"id": 1, "difficulty": 0.3},
        {"id": 2, "difficulty": 0.5},
        {"id": 3, "difficulty": 0.8}
    ]
    
    # 1. Start exam
    q1 = adaptive.get_next_question(ability, pool)
    print(f"Selected Question Difficulty: {q1['difficulty']}")
    
    # 2. Student answers CORRECTLY
    ability = adaptive.update_student_ability(ability, q1['difficulty'], True)
    print(f"New Ability Estimate: {ability}")
    
    # 3. Next question should be harder
    q2 = adaptive.get_next_question(ability, pool)
    print(f"Next Question Difficulty: {q2['difficulty']}")
