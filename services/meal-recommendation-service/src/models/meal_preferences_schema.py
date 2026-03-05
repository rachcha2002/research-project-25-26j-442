from pydantic import BaseModel
from typing import Optional


class MealPreferenceRecord(BaseModel):
    parent_id: Optional[str] = None
    child_id: Optional[str] = None
    diet_type: Optional[str] = None
    budget_level: Optional[str] = None
    meals_per_day: Optional[int] = None
    activity_level: Optional[str] = None


class MealPreferenceCreateRequest(BaseModel):
    parent_id: str
    child_id: str
    diet_type: Optional[str] = None
    budget_level: Optional[str] = None
    meals_per_day: Optional[int] = None
    activity_level: Optional[str] = None
