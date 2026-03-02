from src.models.schemas import BehavioralSeeds
from src.utils.database import Database


class BehavioralStateService:
    COLLECTION_NAME = "child_profiles"

    @staticmethod
    async def get_behavioral_state_by_child_id(child_id: str) -> BehavioralSeeds:
        collection = Database.get_collection(BehavioralStateService.COLLECTION_NAME)
        profile = await collection.find_one({"child_id": child_id})

        if not profile or "behavioral_state" not in profile:
            return BehavioralSeeds(disliked_ingredients=[], liked_ingredients=[])

        return BehavioralSeeds(**profile["behavioral_state"])
