from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from src.models.meal_preferences_schema import MealPreferenceCreateRequest, MealPreferenceRecord
from src.services.meal_preferences_service import MealPreferencesService


class MealPreferencesController:
    router = APIRouter(prefix="/meal-preferences", tags=["meal-preferences"])


@MealPreferencesController.router.post("/", response_model=MealPreferenceRecord)
async def create_meal_preference(payload: MealPreferenceCreateRequest):
    if not payload.parent_id.strip() or not payload.child_id.strip():
        raise HTTPException(status_code=400, detail="parent_id and child_id are required")

    return await MealPreferencesService.insert_preference(payload)


@MealPreferencesController.router.put("/", response_model=MealPreferenceRecord)
async def update_meal_preference(payload: MealPreferenceCreateRequest):
    if not payload.parent_id.strip() or not payload.child_id.strip():
        raise HTTPException(status_code=400, detail="parent_id and child_id are required")

    updated = await MealPreferencesService.update_preference(payload)

    if updated is None:
        raise HTTPException(status_code=404, detail="Meal preference not found for given parent_id and child_id")

    return updated


@MealPreferencesController.router.get("/", response_model=Optional[MealPreferenceRecord])
async def get_meal_preference(
    parent_id: str = Query(..., alias="parentId"),
    child_id: str = Query(..., alias="childId"),
):
    preference = await MealPreferencesService.get_by_parent_and_child(parent_id, child_id)
    if preference is None:
        return None
    return preference
