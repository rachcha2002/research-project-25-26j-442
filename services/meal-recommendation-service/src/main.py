from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import asyncio
import json
import numpy as np
from src.services.health_calculator import PediatricHealthCalculator
from src.utils.database import Database
from src.models.schemas import MealGenerationRequest, MealFeedback, BehavioralSeeds, ClinicalConstraints
from src.services.meal_engine import MealOptimizerEngine
from src.utils.llm_client import get_clinical_constraints
from src.controllers.meal_preferences_controller import MealPreferencesController
from src.controllers.generated_plans_controller import GeneratedPlansController
from src.controllers.behavioral_state_controller import BehavioralStateController
from src.services.generated_plans_service import GeneratedPlansService
from src.services.meal_preferences_service import MealPreferencesService

# Global engine instance so it only loads the CSVs once at startup
engine = None

def _to_native_types(value):
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, dict):
        return {k: _to_native_types(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_to_native_types(v) for v in value]
    if isinstance(value, tuple):
        return tuple(_to_native_types(v) for v in value)
    return value


def _normalize_meal_key(plan: dict, raw_meal_type: str):
    if raw_meal_type in plan:
        return raw_meal_type

    normalized_input = ''.join(raw_meal_type.lower().split())
    for key in plan.keys():
        if ''.join(str(key).lower().split()) == normalized_input:
            return key

    return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB and spin up the ML engine
    Database.connect_db()
    await Database.ensure_collection("meal_preferences")
    meal_prefs_col = Database.get_collection("meal_preferences")
    global engine
    engine = MealOptimizerEngine()
    print("ML Engine Initialized and Ready.")
    yield
    # Shutdown
    Database.close_db()

app = FastAPI(title="Pediatric ML Nutrition API", lifespan=lifespan)
app.include_router(MealPreferencesController.router)
app.include_router(GeneratedPlansController.router)
app.include_router(BehavioralStateController.router)

# MANDATORY FOR REACT NATIVE: CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-plan")
async def generate_plan(request: MealGenerationRequest):
    """
    Core Research Endpoint: Generates a mathematically optimized daily plan.
    """
    calculated_target = PediatricHealthCalculator.calculate_eer(
        age_months=request.health_data.age_months,
        weight_kg=request.health_data.weight_kg,
        height_cm=request.health_data.height_cm,
        gender=request.health_data.gender, # Ensure 'gender' is in your HealthData schema!
        activity_level=request.health_data.activity_level
    )

    request.health_data.daily_calorie_target = calculated_target

    profiles_col = Database.get_collection("child_profiles")
    
    # 1. Fetch ML Memory from Database
    profile = await profiles_col.find_one({"child_id": request.child_id})
    
    if profile and "behavioral_state" in profile:
        # Override the request with the true historical ML data
        request.behavioral_state = BehavioralSeeds(**profile["behavioral_state"])
    else:
        # First time user: initialize empty arrays
        request.behavioral_state = BehavioralSeeds(disliked_ingredients=[], liked_ingredients=[])

    # Persist age_months so replacement-meal generation can apply the same bone safety rule
    await profiles_col.update_one(
        {"child_id": request.child_id},
        {"$set": {"age_months": request.health_data.age_months}},
        upsert=True,
    )

    # 2. Gemini LLM: derive clinical constraints from medications and conditions
    clinical = ClinicalConstraints()
    if request.health_data.medical_conditions or request.health_data.medications:
        try:
            raw = await asyncio.to_thread(
                get_clinical_constraints,
                request.health_data.medications,
                request.health_data.medical_conditions,
            )
            parsed = json.loads(raw)
            clinical = ClinicalConstraints(**parsed)
        except Exception:
            clinical = ClinicalConstraints()  # silent fallback — never block plan generation

    # 3. Run the ML Stochastic Optimizer
    try:
        optimized_result = engine.generate_optimized_plan(request, clinical_constraints=clinical)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

    optimized_result = _to_native_types(optimized_result)

    # 4. Log the generated plan for your research evaluation
    history_col = Database.get_collection("generated_plans_history")
    await history_col.insert_one({
        "child_id": request.child_id,
        "metrics": optimized_result["research_metrics"],
        "plan": optimized_result["daily_plan"],
        "meal_feedback": {},
        "created_at": datetime.now(timezone.utc),
    })

    # 5. Update rolling variety window (last 30 items ≈ 2 days)
    new_items = [
        item
        for meal_data in optimized_result["daily_plan"].values()
        for item in meal_data["plate"].values()
    ]
    updated_recent = (request.behavioral_state.recent_items + new_items)[-30:]
    await profiles_col.update_one(
        {"child_id": request.child_id},
        {"$set": {"behavioral_state.recent_items": updated_recent}},
        upsert=True,
    )

    return {"message": "Plan generated successfully", "data": optimized_result}


@app.post("/meal-feedback")
async def process_feedback(feedback: MealFeedback):
    """
    The Reinforcement Loop: Updates the User Profile Vector weights.
    """
    profiles_col = Database.get_collection("child_profiles")
    profile = await profiles_col.find_one({"child_id": feedback.child_id})
    
    if not profile:
        # Initialize if not exists
        profile = {
            "child_id": feedback.child_id, 
            "behavioral_state": {"disliked_ingredients": [], "liked_ingredients": []}
        }

    state = profile.get("behavioral_state", {})
    state.setdefault("liked_ingredients", [])
    state.setdefault("disliked_ingredients", [])
    state.setdefault("recent_items", [])

    # ML Weight Updating
    for item in feedback.actioned_items:
        if feedback.action == "accept":
            if item not in state["liked_ingredients"]:
                state["liked_ingredients"].append(item)
                # If they like it now, remove from dislikes
                if item in state["disliked_ingredients"]:
                    state["disliked_ingredients"].remove(item)
                    
        elif feedback.action == "reject":
            if item not in state["disliked_ingredients"]:
                state["disliked_ingredients"].append(item)
                # If they hate it now, remove from likes
                if item in state["liked_ingredients"]:
                    state["liked_ingredients"].remove(item)

    # Save the updated ML matrix state back to MongoDB
    profile["behavioral_state"] = state
    await profiles_col.update_one(
        {"child_id": feedback.child_id},
        {"$set": profile},
        upsert=True
    )

    latest_plan_document = await GeneratedPlansService.get_latest_today_plan_document_by_child_id(
        feedback.child_id
    )

    current_plan = latest_plan_document.get("plan", {}) if latest_plan_document else {}
    meal_key = _normalize_meal_key(current_plan, feedback.meal_type) if current_plan else None

    if latest_plan_document and meal_key:
        await GeneratedPlansService.update_meal_feedback_in_today_plan(
            document_id=latest_plan_document["_id"],
            meal_key=meal_key,
            status="accepted" if feedback.action == "accept" else "rejected",
            actioned_items=feedback.actioned_items,
            new_meal=feedback.new_meal,
        )

    if feedback.action == "reject" and feedback.new_meal:
        if not latest_plan_document or "plan" not in latest_plan_document:
            raise HTTPException(status_code=404, detail="No generated meal plan found for today")

        if not meal_key:
            raise HTTPException(status_code=404, detail="Requested meal type not found in today's plan")

        old_meal = current_plan.get(meal_key, {})
        target_meal_calories = float(old_meal.get("calories", 0) or 0)

        preferences = await MealPreferencesService.get_by_child_id(feedback.child_id)
        budget_level = preferences.budget_level if preferences and preferences.budget_level else "Medium"
        allergies = []
        age_months = profile.get("age_months", 72) if profile else 72
        recent_items = state.get("recent_items", [])

        replacement = engine.generate_replacement_meal(
            meal_type=meal_key,
            target_calories=target_meal_calories,
            allergies=allergies,
            budget_level=budget_level,
            dislikes=state.get("disliked_ingredients", []),
            likes=state.get("liked_ingredients", []),
            age_months=age_months,
            recent_items=recent_items,
        )

        if not replacement:
            raise HTTPException(status_code=500, detail="Failed to generate replacement meal")

        new_meal = _to_native_types(replacement["meal"])
        updated_plan = {**current_plan, meal_key: new_meal}

        existing_metrics = latest_plan_document.get("metrics", {}) or {}
        target_daily_calories = float(existing_metrics.get("target_calories", 0) or 0)
        achieved_daily_calories = sum(
            float((meal or {}).get("calories", 0) or 0) for meal in updated_plan.values()
        )

        updated_metrics = {
            **existing_metrics,
            "achieved_calories": round(achieved_daily_calories, 2),
            "optimization_loss_kcal": round(abs(achieved_daily_calories - target_daily_calories), 2),
        }

        await GeneratedPlansService.update_meal_in_today_plan(
            document_id=latest_plan_document["_id"],
            meal_key=meal_key,
            meal_data=new_meal,
            updated_metrics=updated_metrics,
        )

        await GeneratedPlansService.update_meal_feedback_in_today_plan(
            document_id=latest_plan_document["_id"],
            meal_key=meal_key,
            status="rejected",
            actioned_items=feedback.actioned_items,
            new_meal=feedback.new_meal,
        )

        await GeneratedPlansService.clear_meal_feedback_in_today_plan(
            document_id=latest_plan_document["_id"],
            meal_key=meal_key,
        )

        refreshed_plan_document = await GeneratedPlansService.get_latest_today_plan_document_by_child_id(
            feedback.child_id
        )

        return {
            "message": f"Feedback processed and only '{meal_key}' regenerated.",
            "meal_type": meal_key,
            "updated_meal": new_meal,
            "updated_plan": updated_plan,
            "meal_feedback": refreshed_plan_document.get("meal_feedback", {}) if refreshed_plan_document else {},
            "current_state": state,
        }

    return {
        "message": f"ML Profile updated. {len(feedback.actioned_items)} items logged as {feedback.action}.",
        "meal_feedback": latest_plan_document.get("meal_feedback", {}) if latest_plan_document else {},
        "current_state": state
    }