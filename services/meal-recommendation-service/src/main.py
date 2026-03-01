from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import numpy as np
from src.services.health_calculator import PediatricHealthCalculator
from src.utils.database import Database
from src.models.schemas import MealGenerationRequest, MealFeedback, BehavioralSeeds
from src.services.meal_engine import MealOptimizerEngine
from src.controllers.meal_preferences_controller import MealPreferencesController
from src.controllers.generated_plans_controller import GeneratedPlansController

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

    # 2. Run the ML Stochastic Optimizer
    try:
        optimized_result = engine.generate_optimized_plan(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

    optimized_result = _to_native_types(optimized_result)

    # 3. Log the generated plan for your research evaluation
    history_col = Database.get_collection("generated_plans_history")
    await history_col.insert_one({
        "child_id": request.child_id,
        "metrics": optimized_result["research_metrics"],
        "plan": optimized_result["daily_plan"],
        "created_at": datetime.now(timezone.utc),
    })

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

    state = profile.get("behavioral_state", {"disliked_ingredients": [], "liked_ingredients": []})

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

    return {
        "message": f"ML Profile updated. {len(feedback.actioned_items)} items logged as {feedback.action}.",
        "current_state": state
    }