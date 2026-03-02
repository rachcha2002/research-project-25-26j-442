from fastapi import APIRouter, Query

from src.models.schemas import (
    BehavioralMealsListResponse,
    BehavioralSeeds,
    RemoveBehavioralItemsRequest,
)
from src.services.behavioral_state_service import BehavioralStateService


class BehavioralStateController:
    router = APIRouter(prefix="/behavioral-state", tags=["behavioral-state"])


@BehavioralStateController.router.get("/", response_model=BehavioralSeeds)
async def get_behavioral_state(
    child_id: str = Query(..., alias="childId"),
):
    return await BehavioralStateService.get_behavioral_state_by_child_id(child_id)


@BehavioralStateController.router.get("/rejected", response_model=BehavioralMealsListResponse)
async def get_rejected_meals_list(
    child_id: str = Query(..., alias="childId"),
):
    meals = await BehavioralStateService.get_rejected_meals_by_child_id(child_id)
    return BehavioralMealsListResponse(child_id=child_id, meals=meals)


@BehavioralStateController.router.get("/accepted", response_model=BehavioralMealsListResponse)
async def get_accepted_meals_list(
    child_id: str = Query(..., alias="childId"),
):
    meals = await BehavioralStateService.get_accepted_meals_by_child_id(child_id)
    return BehavioralMealsListResponse(child_id=child_id, meals=meals)


@BehavioralStateController.router.post("/remove-items", response_model=BehavioralMealsListResponse)
async def remove_items_from_behavioral_list(
    payload: RemoveBehavioralItemsRequest,
):
    updated_state = await BehavioralStateService.remove_items_from_behavioral_list(
        child_id=payload.child_id,
        list_type=payload.list_type,
        items=payload.items,
    )

    target_meals = (
        updated_state.liked_ingredients
        if payload.list_type == "accepted"
        else updated_state.disliked_ingredients
    )

    return BehavioralMealsListResponse(child_id=payload.child_id, meals=target_meals)
