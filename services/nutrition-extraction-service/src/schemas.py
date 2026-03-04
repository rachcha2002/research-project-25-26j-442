from pydantic import BaseModel
from typing import List, Optional

class ChildMedicalProfile(BaseModel):
    allergies: List[str] = []
    medical_conditions: List[str] = []
    medications: List[str] = []

class TextScanRequest(BaseModel):
    food_query: str
    child_profile: ChildMedicalProfile

class ClinicalSafetyResponse(BaseModel):
    food_identified: str
    detection_confidence: Optional[float] = None
    safety_status: str
    clinical_reasoning: str