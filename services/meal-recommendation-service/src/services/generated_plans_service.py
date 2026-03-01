from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Optional

from src.utils.database import Database


class GeneratedPlansService:
    COLLECTION_NAME = "generated_plans_history"
    COLOMBO_TZ = ZoneInfo("Asia/Colombo")

    @staticmethod
    async def get_latest_today_plan_by_child_id(child_id: str) -> Optional[dict]:
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

        if not document:
            return None

        return document.get("plan")
