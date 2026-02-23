from pydantic import BaseModel
from typing import List

class HealthData(BaseModel):
    bmi: float
    status: str
    conditions: List[str]
    medicines: List[str]

class Preferences(BaseModel):
    diet: str
    allergies: List[str]

class MealRequest(BaseModel):
    child_id: str
    health_data: HealthData
    preferences: Preferences