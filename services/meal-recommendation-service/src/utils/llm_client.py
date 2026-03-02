import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def get_clinical_constraints(medications: list, health_conditions: list):
    try:
        # The new SDK initializes the client this way
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        prompt = f"""
        Act as a Pediatric Nutritionist for a child aged 2-6 in Sri Lanka.
        Health Conditions: {health_conditions}
        Medications: {medications}
        Action: Provide nutritional constraints based on the meds and conditions.
        Return ONLY a JSON object with this exact structure, nothing else:
        {{"boost": ["nutrient1"], "avoid": ["nutrient2"], "texture_mod": "soft"}}
        """
        
        # Using the standard flash model
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f'{{"error": "{str(e)}" }}'