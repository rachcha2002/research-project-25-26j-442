from typing import Optional

from src.models.meal_preferences_schema import MealPreferenceCreateRequest, MealPreferenceRecord
from src.utils.database import Database


class MealPreferencesService:
    COLLECTION_NAME = "meal_preferences"

    @staticmethod
    async def insert_preference(payload: MealPreferenceCreateRequest) -> MealPreferenceRecord:
        collection = Database.get_collection(MealPreferencesService.COLLECTION_NAME)
        document = payload.model_dump()
        await collection.insert_one(document)
        return MealPreferenceRecord(**document)

    @staticmethod
    async def get_by_parent_and_child(
        parent_id: str,
        child_id: str,
    ) -> Optional[MealPreferenceRecord]:
        collection = Database.get_collection(MealPreferencesService.COLLECTION_NAME)
        document = await collection.find_one({"parent_id": parent_id, "child_id": child_id})

        if not document:
            return None

        document.pop("_id", None)
        return MealPreferenceRecord(**document)
