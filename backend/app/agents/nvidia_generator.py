import json
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

class NVIDIAExamGenerator:
    """
    Agent responsible for generating exam questions using NVIDIA NIM APIs.
    """
    
    def __init__(self):
        self.api_key = settings.NVIDIA_API_KEY
        self.base_url = "https://integrate.api.nvidia.com/v1"
        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url) if self.api_key else None
        self.model = settings.NVIDIA_LLM_MODEL

    def is_configured(self) -> bool:
        return self.client is not None

    async def generate_exam(
        self,
        study_material: str,
        num_questions: int,
        difficulty_distribution: Dict[str, float], # e.g., {"easy": 0.3, "medium": 0.4, "hard": 0.3}
        question_types: List[str], # e.g., ["mcq", "short", "long"]
        exam_title: str,
        instructions: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generates a full set of questions using NVIDIA LLM.
        """
        if not self.is_configured():
            logger.warning("NVIDIA API Key not set. Using mock generation.")
            return self._mock_generate(num_questions)

        instruction_block = f"\n        ADDITIONAL INSTRUCTIONS:\n        {instructions}\n" if instructions else ""

        prompt = f"""
        You are an expert academic examiner. Based ONLY on the provided study material, generate an exam titled '{exam_title}'.
        {instruction_block}
        STUDY MATERIAL:
        {study_material[:50000]} # Analyzes up to 50k characters for comprehensive coverage
        
        REQUIREMENTS:
        - Total Number of Questions: {num_questions}
        - Difficulty Distribution: {json.dumps(difficulty_distribution)}
        - Question Types: {", ".join(question_types)}
        - Extract concepts ONLY from the notes.
        - Each question must have:
            1. difficulty (0.0 to 1.0)
            2. type (mcq, descriptive)
            3. bloom_level (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating)
            4. points
            5. options (if MCQ)
            6. correct_answer (if MCQ) or model_answer (if descriptive)
            7. concept_tags (list of topics from the material)
        
        OUTPUT FORMAT:
        Return ONLY a JSON list of question objects. Ensure it is valid JSON.
        
        Example MCQ:
        {{
            "question_text": "What is the primary function of...?",
            "question_type": "mcq",
            "difficulty": 0.4,
            "points": 5,
            "bloom_level": "Remembering",
            "options": {{"A": "Choice 1", "B": "Choice 2", "C": "Choice 3", "D": "Choice 4"}},
            "correct_answer": "B",
            "concept_tags": ["Topic A"]
        }}

        Example Descriptive:
        {{
            "question_text": "Explain the process of...",
            "question_type": "descriptive",
            "difficulty": 0.7,
            "points": 10,
            "bloom_level": "Analyzing",
            "model_answer": "The process involves step 1, step 2, and step 3... [detailed key points]",
            "concept_tags": ["Topic B"]
        }}
        """

        try:
            logger.info(f"Sending {len(study_material)} chars to NVIDIA NIM for analysis...")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional assessment generator who outputs strict JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                top_p=0.7,
                max_tokens=4000
            )
            
            content = response.choices[0].message.content
            # Strip markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            try:
                questions = json.loads(content)
            except json.JSONDecodeError as je:
                logger.error(f"NVIDIA API returned invalid JSON: {content}")
                raise ValueError(f"AI response was not valid JSON. Please try again or simplify the material.")
            
            import asyncio
            
            logger.info(f"Generating parallel adaptive variants for {len(questions)} questions...")
            
            # Generate adaptive variants for each question in parallel
            async def attach_variants(q):
                q['adaptive_variants'] = await self.generate_adaptive_variants(q, study_material)
                return q

            questions = await asyncio.gather(*(attach_variants(q) for q in questions))
            
            logger.info("NVIDIA Generation complete!")
            return questions

        except Exception as e:
            logger.error(f"NVIDIA logic error: {str(e)}")
            # For preview/orchestration, we want to know what failed
            raise e

    async def generate_adaptive_variants(self, original_question: Dict[str, Any], material: str) -> List[Dict[str, Any]]:
        """
        Generates easier and harder variants of a question for adaptive testing.
        """
        prompt = f"""
        Original Question: {original_question['question_text']}
        Difficulty: {original_question['difficulty']}
        Concepts: {", ".join(original_question.get('concept_tags', []))}
        
        Based on the study material, generate 2 variants:
        1. An EASIER version (difficulty around 0.2)
        2. A HARDER version (difficulty around 0.8)
        
        Return ONLY a JSON list of 2 objects with keys: question_text, difficulty, options (if MCQ), correct_answer (if MCQ), model_answer (if descriptive).
        """
        
        try:
            # We use a smaller token limit for variants
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1000
            )
            content = response.choices[0].message.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            return json.loads(content)
        except:
            return []

    def _mock_generate(self, count: int) -> List[Dict[str, Any]]:
        mock_questions = []
        for i in range(count):
            mock_questions.append({
                "question_text": f"Mock Question {i+1} from Study Material (NVIDIA API not configured)",
                "question_type": "mcq",
                "difficulty": 0.5,
                "points": 1,
                "bloom_level": "Remembering",
                "options": {"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"},
                "correct_answer": "A",
                "concept_tags": ["General"],
                "adaptive_variants": []
            })
        return mock_questions

# Singleton instance
nvidia_gen = NVIDIAExamGenerator()
