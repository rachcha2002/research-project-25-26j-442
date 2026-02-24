from fastapi import FastAPI
from contextlib import asynccontextmanager
from src.utils.database import Database
from src.models.profile import MealRequest
from src.services.meal_engine import MealEngine
from src.utils.llm_client import get_clinical_constraints
import json
from src.models.profile import MealFeedback

# Initialize Engine globally
engine = MealEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Database.connect_db()
    yield
    Database.close_db()

app = FastAPI(lifespan=lifespan, title="Pediatric Nutrition API")

@app.get("/")
def read_root():
    return {"status": "Nutrition Microservice is Running Successfully!"}

@app.post("/generate-plan")
async def generate_plan(request: MealRequest):

    profiles_collection = Database.get_collection("nutrition_profiles")
    profile = await profiles_collection.find_one({"child_id": request.child_id})

    dislikes = profile.get("disliked_ingredients", []) if profile else []
    # 1. Call Gemini to get medical constraints
    clinical_advice_raw = get_clinical_constraints(
        request.health_data.medicines,
        request.health_data.conditions
    )
    
    # Clean the LLM output to ensure it's valid JSON
    clinical_advice_raw = clinical_advice_raw.replace("```json", "").replace("```", "").strip()
    try:
        clinical_advice = json.loads(clinical_advice_raw)
    except:
        clinical_advice = {"error": "Failed to parse LLM advice"}
    
    # 2. Build the FULL DAILY PLAN using Pandas
    full_day_plan = engine.generate_daily_plan(
        request.preferences.allergies,
        request.health_data.daily_calorie_target,
        dislikes
    )
    
    # 3. Save a record to MongoDB
    collection = Database.get_collection("generated_plans")
    plan_record = {
        "child_id": request.child_id,
        "clinical_advice": clinical_advice,
        "daily_plan": full_day_plan
    }
    
    await collection.insert_one(plan_record)
    plan_record.pop("_id", None) 
    
    return {
        "message": "24-Hour Plan generated and saved!", 
        "data": plan_record
    }

@app.post("/meal-feedback")
async def process_feedback(feedback: MealFeedback):
    profiles_collection = Database.get_collection("nutrition_profiles")
    
    # 1. Fetch or initialize the child's profile
    profile = await profiles_collection.find_one({"child_id": feedback.child_id})
    if not profile:
        profile = {"child_id": feedback.child_id, "disliked_ingredients": [], "liked_ingredients": []}
    
    # 2. Apply Behavioral Logic (The ML aspect)
    if feedback.action == "reject":
        # Add rejected items to the blacklist so they aren't suggested again soon
        for item in feedback.rejected_items:
            if item not in profile.get("disliked_ingredients", []):
                profile.setdefault("disliked_ingredients", []).append(item)
                
    elif feedback.action == "accept":
        # We can track what works well!
        pass # We will keep it simple for now, but you can expand this to boost weights
        
    # 3. Save the updated profile back to MongoDB
    await profiles_collection.update_one(
        {"child_id": feedback.child_id},
        {"$set": profile},
        upsert=True
    )
    
    return {
        "message": f"Feedback processed. System learned from {feedback.action}.",
        "updated_dislikes": profile.get("disliked_ingredients", [])
    }