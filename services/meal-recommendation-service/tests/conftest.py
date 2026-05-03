"""
Shared fixtures for the Pediatric Meal Recommendation Service test suite.

Run all tests from the service root:
    cd services/meal-recommendation-service
    pytest tests/ -v
"""

import os
import pytest
import pandas as pd
from unittest.mock import AsyncMock, MagicMock, patch

# ── Working directory ──────────────────────────────────────────────────────────
SERVICE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@pytest.fixture(scope="session", autouse=True)
def change_dir():
    """Ensure relative CSV / model paths resolve correctly for all tests."""
    original = os.getcwd()
    os.chdir(SERVICE_ROOT)
    yield
    os.chdir(original)


# ── Engine fixtures ────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def real_engine(change_dir):
    """Full MealOptimizerEngine loaded from the real CSV files (once per session)."""
    from src.services.meal_engine import MealOptimizerEngine
    return MealOptimizerEngine()


@pytest.fixture
def engine_stub():
    """Bare engine instance — bypasses __init__ for filter unit tests."""
    from src.services.meal_engine import MealOptimizerEngine
    return object.__new__(MealOptimizerEngine)


# ── Minimal DataFrames ─────────────────────────────────────────────────────────

@pytest.fixture
def base_df():
    return pd.DataFrame({
        "Item Name":      ["White Rice", "White String Hoppers", "Pol Roti", "White Rice Pittu", "Kalu Heenati (Red Rice)", "Premium Grain", "Red Rice (Kekulu)"],
        "Ideal_Meal_Time":["Lunch;Dinner", "Breakfast;Dinner",  "Breakfast;Dinner", "Breakfast;Dinner", "Lunch;Dinner",   "Lunch;Dinner",  "Lunch;Dinner"],
        "State/Texture":  ["Soft Grainy",  "Soft Stringy",       "Chewy Dense",     "Dry Crumbly",      "Chewy Grainy",   "Soft Fluffy",   "Soft Grainy"],
        "Cost":           ["Med",          "Low",                 "Low",             "Med",              "High",           "High",          "Low"],
        "Veg/Non-Veg":    ["Veg",          "Veg",                 "Veg",             "Veg",              "Veg",            "Veg",           "Veg"],
        "Allergies":      ["None",         "None",                "Gluten",          "None",             "None",           "None",          "None"],
        "Calories (kcal)":[130,            120,                   130,               150,                145,              135,             130],
        "Protein (g)":    [2.5,            2.0,                   3.0,               3.0,                3.5,              2.8,             2.5],
        "Carbs (g)":      [28,             26,                    15,                30,                 30,               28,              28],
        "Base_Type_Tag":  ["Rice",         "StringHopper",        "Roti",            "Pittu",            "Rice",           "Rice",          "Rice"],
    })


@pytest.fixture
def protein_df():
    return pd.DataFrame({
        "Item Name":      ["Dhal Curry", "Egg Curry", "Chicken White Curry", "Fish Ambul Thiyal", "Boneless Fish Curry"],
        "Ideal_Meal_Time":["Any",        "Any",       "Lunch;Dinner",        "Lunch;Dinner",       "Any"],
        "Cost":           ["Low",        "Low",       "Med",                 "Med",                "Low"],
        "Veg/Non-Veg":    ["Veg",        "Non-Veg",   "Non-Veg",             "Non-Veg",            "Non-Veg"],
        "Allergies":      ["None",       "Egg",       "None",                "None",               "None"],
        "Bone_Status":    ["NA",         "NA",        "Bone-in",             "Bone-in",            "Boneless"],
        "Calories (kcal)":[120,          150,         200,                   180,                  160],
        "Protein (g)":    [6,            12,          18,                    22,                   20],
        "Carbs (g)":      [18,           5,           3,                     2,                    2],
        "State/Texture":  ["Soft",       "Soft",      "Soft",                "Dry",                "Soft"],
    })


@pytest.fixture
def veggie_df():
    return pd.DataFrame({
        "Item Name":       ["Pumpkin Curry (Kiriata)", "Gotu Kola Mallum", "Cabbage Mallum",
                            "Carrot Sambol (Raw)",      "Green Beans Tempered", "Potato Curry (Kiriata)",
                            "Spinach Kiriata"],
        "Ideal_Meal_Time": ["Lunch;Dinner", "Lunch",  "Lunch",
                            "Lunch",         "Lunch;Dinner", "Lunch;Dinner",
                            "Lunch;Dinner"],
        "Prep_Style":      ["Kirata",        "Steamed/Coconut", "Steamed/Coconut",
                            "Raw/Lemon",     "Tempered",         "Kirata",
                            "Kirata"],
        "Cost":            ["Low", "Low", "Low", "Low", "Low", "Low", "Low"],
        "Allergies":       ["None", "None", "None", "None", "None", "None", "None"],
        "Calories (kcal)": [60,     40,     40,     20,     60,     80,     45],
        "Protein (g)":     [1,      1.5,    1,      0.5,    1.5,    1.5,    2],
        "Carbs (g)":       [8,      3.5,    4,      4,      6,      12,     4],
        "Compatible_Bases":["Any",  "Rice;Roti", "Rice;Roti",
                            "Rice;Roti;Hopper", "Rice;Roti", "Any",
                            "Any"],
    })


@pytest.fixture
def dairy_df():
    return pd.DataFrame({
        "Item Name":      ["Curd",   "Yoghurt", "Cheese Slice"],
        "Ideal_Meal_Time":["Any",    "Any",     "Snack"],
        "Texture":        ["Creamy", "Creamy",  "Firm"],
        "Cost":           ["Low",    "Med",     "High"],
        "Veg/Non-Veg":    ["Veg",    "Veg",     "Veg"],
        "Allergies":      ["Dairy",  "Dairy",   "Dairy"],
        "Calories (kcal)":[70,       80,        100],
        "Protein (g)":    [4,        5,         6],
        "Carbs (g)":      [5,        6,         2],
    })


@pytest.fixture
def fruit_df():
    return pd.DataFrame({
        "Item Name":      ["Banana", "Grapes",         "Apple Slices", "Mango"],
        "Ideal_Meal_Time":["Any",    "Snack",           "Snack",        "Any"],
        "Cost":           ["Low",    "Med",             "Med",          "Low"],
        "Veg/Non-Veg":    ["Veg",    "Veg",             "Veg",          "Veg"],
        "Allergies":      ["None",   "None",            "None",         "None"],
        "Choking_Risk":   ["Low",    "High (Choking)",  "Med",          "High (Seeds)"],
        "Calories (kcal)":[89,       62,                52,             60],
        "Protein (g)":    [1.1,      0.6,               0.3,            0.8],
        "Carbs (g)":      [23,       16,                14,             15],
    })


# ── MongoDB mock helpers ───────────────────────────────────────────────────────

def _make_profile(child_id="test_api", liked=None, disliked=None, recent=None, age=60):
    return {
        "child_id": child_id,
        "age_months": age,
        "behavioral_state": {
            "liked_ingredients":  liked or [],
            "disliked_ingredients": disliked or [],
            "recent_items": recent or [],
        },
    }


def _make_plan_doc(child_id="test_api"):
    return {
        "_id": "mock_plan_id",
        "child_id": child_id,
        "plan": {
            "Breakfast": {"meal_type": "Breakfast", "plate": {
                "base": "Red Rice (Kekulu)", "protein": "Dhal Curry",
                "veggie_1": "Pumpkin Curry (Kiriata)", "veggie_2": "Spinach (Niwithi) Kiriata"
            }, "calories": 385},
            "Lunch": {"meal_type": "Lunch", "plate": {
                "base": "White Rice (Samba)", "protein": "Egg Curry",
                "veggie_1": "Gotu Kola Mallum", "veggie_2": "Carrot Curry (Kiriata)",
                "veggie_3": "Potato Curry (Kiriata)"
            }, "calories": 430},
            "Dinner": {"meal_type": "Dinner", "plate": {
                "base": "Red Rice (Kekulu)", "protein": "Dhal Curry",
                "veggie_1": "Potato Curry (Kiriata)", "veggie_2": "Spinach (Niwithi) Kiriata",
                "veggie_3": "Pumpkin Curry (Kiriata)"
            }, "calories": 390},
        },
        "metrics": {"target_calories": 1100, "achieved_calories": 1205, "optimization_loss_kcal": 105},
        "meal_feedback": {},
    }


def _make_collection_mocks():
    """Return per-collection AsyncMock objects keyed by collection name."""
    profile_doc  = _make_profile()
    plan_doc     = _make_plan_doc()

    profiles_col = AsyncMock()
    profiles_col.find_one = AsyncMock(return_value=profile_doc)
    profiles_col.update_one = AsyncMock(return_value=MagicMock(modified_count=1))

    history_col = AsyncMock()
    history_col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="new_id"))
    history_col.find_one   = AsyncMock(return_value=plan_doc)
    history_col.update_one = AsyncMock(return_value=MagicMock(modified_count=1))

    prefs_col = AsyncMock()
    prefs_col.find_one = AsyncMock(return_value={
        "child_id": "test_api", "parent_id": "parent_001", "budget_level": "Medium"
    })

    return {
        "child_profiles":         profiles_col,
        "generated_plans_history": history_col,
        "meal_preferences":       prefs_col,
    }


# ── FastAPI test client ────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client(change_dir):
    """
    TestClient with mocked MongoDB.  The real ML engine and CSV data are used
    so food-selection behaviour is genuinely exercised.
    """
    from src.main import app
    from src.utils.database import Database
    from src.models.meal_preferences_schema import MealPreferenceRecord

    col_mocks = _make_collection_mocks()

    mock_pref = MagicMock(spec=MealPreferenceRecord)
    mock_pref.budget_level = "Medium"

    with patch.object(Database, "connect_db"), \
         patch.object(Database, "close_db"), \
         patch.object(Database, "ensure_collection", new=AsyncMock(return_value=None)), \
         patch.object(Database, "get_collection", side_effect=lambda name: col_mocks.get(name, AsyncMock())), \
         patch("src.main.get_clinical_constraints",
               return_value='{"boost":[],"avoid":[],"texture_mod":"normal"}'), \
         patch("src.services.meal_preferences_service.MealPreferencesService.get_by_child_id",
               new=AsyncMock(return_value=mock_pref)):
        with patch("fastapi.testclient.TestClient") if False else __import__("contextlib").nullcontext():
            from fastapi.testclient import TestClient
            with TestClient(app) as c:
                yield c
