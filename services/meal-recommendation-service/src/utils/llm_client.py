import os
import re
from google import genai
from dotenv import load_dotenv

load_dotenv()

def _strip_markdown_fences(text: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` wrappers that Gemini sometimes adds."""
    text = text.strip()
    text = re.sub(r'^```[a-z]*\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    return text.strip()

def get_clinical_constraints(medications: list, health_conditions: list):
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        prompt = f"""
        Act as a Pediatric Nutritionist for a child aged 2-6 in Sri Lanka.
        Health Conditions: {health_conditions}
        Medications: {medications}
        Action: Provide nutritional constraints based on the meds and conditions.
        Return ONLY a JSON object with this exact structure, nothing else:
        {{"boost": ["nutrient1"], "avoid": ["nutrient2"], "texture_mod": "soft"}}
        """
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return _strip_markdown_fences(response.text)
    except Exception as e:
        return f'{{"error": "{str(e)}" }}'