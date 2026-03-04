import os
import json
import io
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv
from src.schemas import ChildMedicalProfile

load_dotenv()

class GeminiClinicalService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("❌ ERROR: GEMINI_API_KEY missing in .env")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def _clean_json_response(self, response_text: str) -> dict:
        """Helper to safely parse Gemini's strict JSON output."""
        clean_json = response_text.strip().replace('\n', ' ').replace('\r', '').replace('\t', ' ')
        return json.loads(clean_json)

    # ==========================================
    # SCENARIO 3: TEXT ONLY
    # ==========================================
    async def evaluate_safety_text(self, food_query: str, profile: ChildMedicalProfile) -> dict:
        prompt = f"""
        Role: Strict Clinical Data Analyzer.
        Task: Evaluate if the following food item(s) or meal combination is safe: '{food_query}'.
        
        1. Identify all individual food items mentioned in the query.
        2. Strictly cross-reference the ingredients of ALL identified items against:
           - Allergies: {profile.allergies}
           - Conditions: {profile.medical_conditions}
           - Medications: {profile.medications}

        CRITICAL RULES:
        - If ANY single food item in the combination conflicts with the medical profile, the overall safety_status MUST be "Warning" or "Danger".
        - ONLY evaluate safety based on exact conflicts with the provided profile arrays.
        - DO NOT give general health advice.
        - If the arrays are empty, or there are no direct conflicts for any item, output "Safe".

        Constraint: Respond ONLY with a valid JSON object.
        JSON Structure: {{"verified_food": "A clean list of the identified foods", "safety_status": "Safe"|"Warning"|"Danger", "clinical_reasoning": "text"}}
        """
        try:
            response = await self.model.generate_content_async(
                prompt, generation_config={"response_mime_type": "application/json"}
            )
            return self._clean_json_response(response.text)
        except Exception as e:
            print(f"\n❌ GEMINI TEXT CRASH: {str(e)}\n")
            return {"verified_food": food_query, "safety_status": "Warning", "clinical_reasoning": "LLM check failed."}

    # ==========================================
    # SCENARIOS 1 & 2: IMAGE ONLY -OR- IMAGE + TEXT
    # ==========================================
    async def evaluate_safety_vision(self, yolo_guess: str, profile: ChildMedicalProfile, image_bytes: bytes, user_text_hint: str = None) -> dict:
        
        # If the user typed a hint (Scenario 2), we tell Gemini to consider it!
        hint_context = f"The user also added this text note: '{user_text_hint}'." if user_text_hint else "The user did not provide any text hints."

        prompt = f"""
        Role: Strict Clinical Data Analyzer.
        Task: You are provided with an image of a food item. A local edge model guessed '{yolo_guess}'. 
        {hint_context}
        
        1. Analyze the image (and the user's note if provided) to determine what the food ACTUALLY is. 
        2. Strictly cross-reference the ingredients of this actual food against:
           - Allergies: {profile.allergies}
           - Conditions: {profile.medical_conditions}
           - Medications: {profile.medications}

        CRITICAL RULES:
        - ONLY evaluate safety based on exact conflicts with the provided profile arrays.
        - DO NOT give general health advice.
        - If the arrays are empty, or there are no direct conflicts, output "Safe".

        Constraint: Respond ONLY with a valid JSON object.
        JSON Structure: {{"verified_food": "Actual name of the food", "safety_status": "Safe"|"Warning"|"Danger", "clinical_reasoning": "text"}}
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            response = await self.model.generate_content_async(
                [prompt, img], generation_config={"response_mime_type": "application/json"}
            )
            return self._clean_json_response(response.text)
        except Exception as e:
            print(f"\n❌ GEMINI VISION CRASH: {str(e)}\n")
            return {"verified_food": yolo_guess, "safety_status": "Warning", "clinical_reasoning": "LLM check failed."}