from pydantic import BaseModel
from typing import List, Optional

# --- Initial Onboarding State ---
class HealthData(BaseModel):
    age_months: int
    weight_kg: float
    height_cm: float
    gender: str          # "Male" or "Female"
    activity_level: str  # "Light", "Moderate", or "Active"
    medical_conditions: List[str] = []
    medications: List[str] = []

class DietaryPreferences(BaseModel):
    diet_type: str = "Standard" # e.g., Veg, Non-Veg
    allergies: List[str] = []
    budget_level: str = "Medium"

class Lifestyle(BaseModel):
    meals_per_day: int = 5

class BehavioralSeeds(BaseModel):
    disliked_ingredients: List[str] = []
    liked_ingredients: List[str] = []

# --- The Main API Request ---
class MealGenerationRequest(BaseModel):
    child_id: str
    health_data: HealthData
    preferences: DietaryPreferences
    lifestyle: Lifestyle
    behavioral_state: BehavioralSeeds # Supplied dynamically by MongoDB

# --- The Feedback Request ---
class MealFeedback(BaseModel):
    child_id: str
    meal_type: str
    action: str # "accept" or "reject"
    actioned_items: List[str]