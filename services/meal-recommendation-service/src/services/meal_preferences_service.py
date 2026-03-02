from typing import Optional
from datetime import datetime, timezone

from src.models.meal_preferences_schema import MealPreferenceCreateRequest, MealPreferenceRecord
from src.utils.database import Database


class MealPreferencesService:
    COLLECTION_NAME = "meal_preferences"

    @staticmethod
    async def insert_preference(payload: MealPreferenceCreateRequest) -> MealPreferenceRecord:
        collection = Database.get_collection(MealPreferencesService.COLLECTION_NAME)
        document = payload.model_dump()
        document["created_at"] = datetime.now(timezone.utc)
        document["updated_at"] = datetime.now(timezone.utc)
        await collection.insert_one(document)
        document.pop("created_at", None)
        document.pop("updated_at", None)
        return MealPreferenceRecord(**document)

    @staticmethod
    async def update_preference(payload: MealPreferenceCreateRequest) -> Optional[MealPreferenceRecord]:
        collection = Database.get_collection(MealPreferencesService.COLLECTION_NAME)

        update_fields = payload.model_dump()
        update_fields["updated_at"] = datetime.now(timezone.utc)

        result = await collection.update_one(
            {
                "parent_id": payload.parent_id,
                "child_id": payload.child_id,
            },
            {"$set": update_fields},
        )

        if result.matched_count == 0:
            return None

        updated_document = await collection.find_one(
            {
                "parent_id": payload.parent_id,
                "child_id": payload.child_id,
            }
        )

        if not updated_document:
            return None

        updated_document.pop("_id", None)
        updated_document.pop("created_at", None)
        updated_document.pop("updated_at", None)
        return MealPreferenceRecord(**updated_document)

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

    @staticmethod
    async def get_by_child_id(child_id: str) -> Optional[MealPreferenceRecord]:
        collection = Database.get_collection(MealPreferencesService.COLLECTION_NAME)
        document = await collection.find_one({"child_id": child_id}, sort=[("_id", -1)])

        if not document:
            return None

        document.pop("_id", None)
        return MealPreferenceRecord(**document)
