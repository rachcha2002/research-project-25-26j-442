from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Optional

from src.utils.database import Database


class GeneratedPlansService:
    COLLECTION_NAME = "generated_plans_history"
    COLOMBO_TZ = ZoneInfo("Asia/Colombo")

    @staticmethod
    async def get_latest_today_plan_by_child_id(child_id: str) -> Optional[dict]:
        document = await GeneratedPlansService.get_latest_today_plan_document_by_child_id(child_id)

        if not document:
            return None

        return {
            "plan": document.get("plan", {}),
            "meal_feedback": document.get("meal_feedback", {}),
        }

    @staticmethod
    async def get_latest_today_plan_document_by_child_id(child_id: str) -> Optional[dict]:
        collection = Database.get_collection(GeneratedPlansService.COLLECTION_NAME)

        now_colombo = datetime.now(GeneratedPlansService.COLOMBO_TZ)
        start_of_day_colombo = datetime.combine(
            now_colombo.date(),
            time.min,
            tzinfo=GeneratedPlansService.COLOMBO_TZ,
        )
        end_of_day_colombo = start_of_day_colombo + timedelta(days=1)

        start_utc = start_of_day_colombo.astimezone(timezone.utc)
        end_utc = end_of_day_colombo.astimezone(timezone.utc)

        document = await collection.find_one(
            {
                "child_id": child_id,
                "created_at": {"$gte": start_utc, "$lt": end_utc},
            },
            sort=[("created_at", -1)],
        )

        return document

    @staticmethod
    async def update_meal_in_today_plan(
        document_id,
        meal_key: str,
        meal_data: dict,
        updated_metrics: Optional[dict] = None,
    ):
        collection = Database.get_collection(GeneratedPlansService.COLLECTION_NAME)

        update_fields = {
            f"plan.{meal_key}": meal_data,
            "updated_at": datetime.now(timezone.utc),
        }

        if updated_metrics is not None:
            update_fields["metrics"] = updated_metrics

        await collection.update_one(
            {"_id": document_id},
            {"$set": update_fields},
        )

    @staticmethod
    async def update_meal_feedback_in_today_plan(
        document_id,
        meal_key: str,
        status: str,
        actioned_items: list,
        new_meal: bool,
    ):
        collection = Database.get_collection(GeneratedPlansService.COLLECTION_NAME)

        await collection.update_one(
            {"_id": document_id},
            {
                "$set": {
                    f"meal_feedback.{meal_key}": {
                        "status": status,
                        "actioned_items": actioned_items,
                        "new_meal": new_meal,
                        "updated_at": datetime.now(timezone.utc),
                    },
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

    @staticmethod
    async def clear_meal_feedback_in_today_plan(
        document_id,
        meal_key: str,
    ):
        collection = Database.get_collection(GeneratedPlansService.COLLECTION_NAME)

        await collection.update_one(
            {"_id": document_id},
            {
                "$unset": {
                    f"meal_feedback.{meal_key}": "",
                },
                "$set": {
                    "updated_at": datetime.now(timezone.utc),
                },
            },
        )
