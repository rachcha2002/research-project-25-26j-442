from fastapi import FastAPI
from contextlib import asynccontextmanager
from src.utils.database import Database
from src.models.profile import MealRequest
from src.services.meal_engine import MealEngine
from src.utils.llm_client import get_clinical_constraints

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
    # 1. Call Gemini to get medical constraints
    clinical_advice = get_clinical_constraints(
        request.health_data.medicines, 
        request.health_data.conditions
    )
    
    # 2. Build the meals using Pandas
    breakfast = engine.generate_meal("Breakfast", request.preferences.allergies)
    lunch = engine.generate_meal("Lunch", request.preferences.allergies)
    
    # 3. Save a record to MongoDB (Behavioral tracking prep)
    collection = Database.get_collection("generated_plans")
    plan_record = {
        "child_id": request.child_id,
        "clinical_advice_received": clinical_advice,
        "plan": {"breakfast": breakfast, "lunch": lunch}
    }
    await collection.insert_one(plan_record)
    
    # Remove the MongoDB ObjectId before returning to the user
    plan_record.pop("_id", None) 
    return {"message": "Plan generated and saved!", "data": plan_record}