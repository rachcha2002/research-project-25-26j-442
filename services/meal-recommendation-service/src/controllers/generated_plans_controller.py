from fastapi import APIRouter, HTTPException, Query

from src.services.generated_plans_service import GeneratedPlansService


class GeneratedPlansController:
    router = APIRouter(prefix="/generated-plans", tags=["generated-plans"])


@GeneratedPlansController.router.get("/today")
async def get_today_generated_plan(
    child_id: str = Query(..., alias="childId"),
):
    plan = await GeneratedPlansService.get_latest_today_plan_by_child_id(child_id)

    if plan is None:
        raise HTTPException(status_code=404, detail="No plan found for today")

    return plan
