"""
Adaptive MCQ Agent
Implements Item Response Theory (IRT) based question selection.
"""
from typing import List, Dict, Any, Optional
import random
import logging

logger = logging.getLogger(__name__)

class AdaptiveMCQAgent:
    """
    Agent responsible for adaptive question selection.
    Uses simplified Item Response Theory to match question difficulty to student ability.
    """
    
    def __init__(self):
        # Learning rate for ability updates
        self.learning_rate = 0.1
        # Initial ability estimate (0.0 to 1.0)
        self.initial_ability = 0.5
    
    def get_next_question(
        self, 
        available_questions: List[Dict], 
        current_ability: float,
        answered_question_ids: List[int] = None
    ) -> Optional[Dict]:
        """
        Select the next question based on student's current ability level.
        Considers AI-generated adaptive variants for better granularity.
        """
        if not available_questions:
            return None
        
        # Filter out already answered questions
        if answered_question_ids:
            available_questions = [
                q for q in available_questions 
                if q.get('id') not in answered_question_ids
            ]
        
        if not available_questions:
            return None
        
        # Find question (or its variant) with difficulty closest to student ability
        best_match = None
        min_distance = float('inf')
        
        for base_question in available_questions:
            # Check the base question difficulty
            base_diff = base_question.get('difficulty', 0.5)
            dist = abs(base_diff - current_ability)
            
            # Check all variants (if any)
            variants = base_question.get('adaptive_variants', [])
            current_best_text = base_question.get('question_text')
            current_best_diff = base_diff
            
            for var in variants:
                var_diff = var.get('difficulty', 0.5)
                var_dist = abs(var_diff - current_ability)
                if var_dist < dist:
                    dist = var_dist
                    current_best_text = var.get('question_text')
                    current_best_diff = var_diff
            
            if dist < min_distance:
                min_distance = dist
                # Construct the selected question object
                best_match = {
                    **base_question,
                    "question_text": current_best_text,
                    "difficulty": current_best_diff
                }
        
        logger.info(f"Adaptive Select: Difficulty {best_match.get('difficulty')} (Ability: {current_ability})")
        return best_match
    
    def update_ability(
        self, 
        current_ability: float, 
        question_difficulty: float, 
        is_correct: bool
    ) -> float:
        """
        Update student's ability estimate based on their answer.
        
        Args:
            current_ability: Current ability estimate
            question_difficulty: Difficulty of the answered question
            is_correct: Whether the answer was correct
            
        Returns:
            Updated ability estimate
        """
        # More sophisticated update considering question difficulty
        if is_correct:
            # Getting a hard question right boosts ability more
            boost = self.learning_rate * (0.5 + question_difficulty * 0.5)
            new_ability = current_ability + boost
        else:
            # Getting an easy question wrong decreases ability more
            penalty = self.learning_rate * (1.0 - question_difficulty * 0.5)
            new_ability = current_ability - penalty
        
        # Clamp between 0.1 and 1.0
        new_ability = max(0.1, min(1.0, new_ability))
        
        logger.info(f"Ability updated: {current_ability:.2f} -> {new_ability:.2f} (correct={is_correct})")
        return round(new_ability, 3)
    
    def calculate_final_ability(self, answers: List[Dict]) -> float:
        """
        Calculate final ability estimate from all answers.
        
        Args:
            answers: List of answer dicts with 'difficulty' and 'is_correct'
            
        Returns:
            Final ability estimate
        """
        if not answers:
            return self.initial_ability
        
        ability = self.initial_ability
        for answer in answers:
            ability = self.update_ability(
                current_ability=ability,
                question_difficulty=answer.get('difficulty', 0.5),
                is_correct=answer.get('is_correct', False)
            )
        
        return ability
    
    def get_difficulty_distribution(self, target_count: int = 20) -> Dict[str, int]:
        """
        Get recommended difficulty distribution for exam creation.
        
        Args:
            target_count: Total number of questions
            
        Returns:
            Dictionary with difficulty levels and counts
        """
        return {
            "easy": int(target_count * 0.3),      # 30% easy (0.0-0.3)
            "medium": int(target_count * 0.4),    # 40% medium (0.3-0.7)
            "hard": int(target_count * 0.3)       # 30% hard (0.7-1.0)
        }


# Singleton instance
adaptive_agent = AdaptiveMCQAgent()
