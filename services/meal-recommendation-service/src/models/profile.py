from pydantic import BaseModel
from typing import List

class HealthData(BaseModel):
    bmi: float
    status: str
    conditions: List[str]
    medicines: List[str]
    daily_calorie_target: int  # Added this field

class Preferences(BaseModel):
    diet: str
    allergies: List[str]

class MealRequest(BaseModel):
    child_id: str
    health_data: HealthData
    preferences: Preferences