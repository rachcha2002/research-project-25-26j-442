from pydantic import BaseModel
from typing import List, Optional
from typing import Literal

# --- Initial Onboarding State ---
class HealthData(BaseModel):
    age_months: int
    weight_kg: float
    height_cm: float
    gender: str          # "Male" or "Female"
    activity_level: str  # "Light", "Moderate", or "Active"
    medical_conditions: List[str] = []
    medications: List[str] = []
    daily_calorie_target: Optional[int] = None # Calculated based on health data if not provided

class DietaryPreferences(BaseModel):
    diet_type: str = "Standard" # e.g., Veg, Non-Veg
    allergies: List[str] = []
    budget_level: str = "Medium"

class Lifestyle(BaseModel):
    meals_per_day: int = 5

class BehavioralSeeds(BaseModel):
    disliked_ingredients: List[str] = []
    liked_ingredients: List[str] = []
    recent_items: List[str] = []

class ClinicalConstraints(BaseModel):
    boost: List[str] = []
    avoid: List[str] = []
    texture_mod: str = "normal"

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
    new_meal: bool = False


class BehavioralMealsListResponse(BaseModel):
    child_id: str
    meals: List[str] = []


class RemoveBehavioralItemsRequest(BaseModel):
    child_id: str
    list_type: Literal["accepted", "rejected"]
    items: List[str]