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

    @staticmethod
    async def get_rejected_meals_by_child_id(child_id: str) -> list[str]:
        state = await BehavioralStateService.get_behavioral_state_by_child_id(child_id)
        return state.disliked_ingredients

    @staticmethod
    async def get_accepted_meals_by_child_id(child_id: str) -> list[str]:
        state = await BehavioralStateService.get_behavioral_state_by_child_id(child_id)
        return state.liked_ingredients

    @staticmethod
    async def remove_items_from_behavioral_list(
        child_id: str,
        list_type: str,
        items: list[str],
    ) -> BehavioralSeeds:
        collection = Database.get_collection(BehavioralStateService.COLLECTION_NAME)
        profile = await collection.find_one({"child_id": child_id})

        if not profile:
            profile = {
                "child_id": child_id,
                "behavioral_state": {
                    "disliked_ingredients": [],
                    "liked_ingredients": [],
                },
            }

        state = profile.get(
            "behavioral_state",
            {"disliked_ingredients": [], "liked_ingredients": []},
        )

        target_key = "liked_ingredients" if list_type == "accepted" else "disliked_ingredients"
        current_items = state.get(target_key, [])
        items_to_remove = set(items)
        state[target_key] = [entry for entry in current_items if entry not in items_to_remove]

        profile["behavioral_state"] = state
        await collection.update_one(
            {"child_id": child_id},
            {"$set": profile},
            upsert=True,
        )

        return BehavioralSeeds(**state)
