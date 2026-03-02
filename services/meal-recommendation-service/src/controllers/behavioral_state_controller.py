from fastapi import APIRouter, Query

from src.models.schemas import BehavioralSeeds
from src.services.behavioral_state_service import BehavioralStateService


class BehavioralStateController:
    router = APIRouter(prefix="/behavioral-state", tags=["behavioral-state"])


@BehavioralStateController.router.get("/", response_model=BehavioralSeeds)
async def get_behavioral_state(
    child_id: str = Query(..., alias="childId"),
):
    return await BehavioralStateService.get_behavioral_state_by_child_id(child_id)
