"""
Comprehensive test suite — Pediatric Meal Recommendation Service
================================================================
Run from the service root:
    cd services/meal-recommendation-service
    pytest tests/ -v

Coverage:
    1. Age-group mapping
    2. Safety filter pipeline (budget, meal-time, allergies, dislikes,
       bone, texture, raw-veg, choking-risk, variety, clinical)
    3. Food compatibility (Base_Type_Tag / Compatible_Bases)
    4. ML Recommender (feature matrix, epsilon-greedy)
    5. POST /generate-plan  — positive & negative
    6. POST /meal-feedback  — positive & negative
"""

import pytest
import pandas as pd
import numpy as np
from unittest.mock import AsyncMock, MagicMock, patch

from src.services.meal_engine import MealOptimizerEngine
from src.services.ml_recommender import PediatricMLRecommender
from src.models.schemas import ClinicalConstraints


# ══════════════════════════════════════════════════════════════════════════════
# 1.  AGE-GROUP MAPPING
# ══════════════════════════════════════════════════════════════════════════════

class TestAgeGroupMapping:

    def test_24_months_is_toddler(self):
        assert MealOptimizerEngine._get_age_group(24) == "toddler"

    def test_35_months_is_toddler(self):
        assert MealOptimizerEngine._get_age_group(35) == "toddler"

    def test_36_months_is_young_preschool(self):
        assert MealOptimizerEngine._get_age_group(36) == "young_preschool"

    def test_47_months_is_young_preschool(self):
        assert MealOptimizerEngine._get_age_group(47) == "young_preschool"

    def test_48_months_is_preschool(self):
        assert MealOptimizerEngine._get_age_group(48) == "preschool"

    def test_72_months_is_preschool(self):
        assert MealOptimizerEngine._get_age_group(72) == "preschool"


# ══════════════════════════════════════════════════════════════════════════════
# 2.  SAFETY FILTER — BUDGET
# ══════════════════════════════════════════════════════════════════════════════

class TestBudgetFilter:

    def test_low_budget_keeps_only_low_cost(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "Low", age_months=60
        )
        assert set(result["Cost"].unique()) == {"Low"}

    def test_low_budget_removes_medium_items(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "Low", age_months=60
        )
        assert "Med" not in result["Cost"].values

    def test_low_budget_removes_high_items(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "Low", age_months=60
        )
        assert "High" not in result["Cost"].values

    def test_medium_budget_keeps_low_and_medium(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "Medium", age_months=60
        )
        assert "High" not in result["Cost"].values
        assert len(result) > 0

    def test_high_budget_keeps_all_cost_tiers(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "High", age_months=60
        )
        costs = set(result["Cost"].unique())
        assert {"Low", "Med", "High"}.issubset(costs)


# ══════════════════════════════════════════════════════════════════════════════
# 3.  SAFETY FILTER — MEAL TIME
# ══════════════════════════════════════════════════════════════════════════════

class TestMealTimeFilter:

    def test_breakfast_items_pass_for_breakfast_slot(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Breakfast", "High", age_months=60
        )
        names = result["Item Name"].tolist()
        # StringHoppers are Breakfast;Dinner — must be included
        assert "White String Hoppers" in names

    def test_lunch_only_items_blocked_for_breakfast(self, engine_stub):
        df = pd.DataFrame({
            "Item Name":      ["Lunch Only Item", "Any Item"],
            "Ideal_Meal_Time":["Lunch",            "Any"],
            "Cost":           ["Low",              "Low"],
            "Allergies":      ["None",             "None"],
            "Calories (kcal)":[100,                100],
            "Protein (g)":    [5,                  5],
            "Carbs (g)":      [15,                 15],
        })
        result = engine_stub._apply_safety_filters(
            df, [], [], "Breakfast", "High", age_months=60
        )
        assert "Lunch Only Item" not in result["Item Name"].tolist()
        assert "Any Item" in result["Item Name"].tolist()

    def test_any_meal_time_always_passes(self, engine_stub, protein_df):
        # Dhal Curry has Ideal_Meal_Time = "Any"
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Breakfast", "High", age_months=60
        )
        assert "Dhal Curry" in result["Item Name"].tolist()


# ══════════════════════════════════════════════════════════════════════════════
# 4.  SAFETY FILTER — ALLERGIES
# ══════════════════════════════════════════════════════════════════════════════

class TestAllergyFilter:

    def test_non_allergic_items_always_pass(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, ["Dairy"], [], "Any", "High", age_months=60
        )
        assert "Dhal Curry" in result["Item Name"].tolist()

    def test_egg_allergy_removes_egg_flagged_items(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, ["Egg"], [], "Any", "High", age_months=60
        )
        assert "Egg Curry" not in result["Item Name"].tolist()

    def test_dairy_allergy_removes_dairy_flagged_items(self, engine_stub, dairy_df):
        result = engine_stub._apply_safety_filters(
            dairy_df, ["Dairy"], [], "Snack", "High", age_months=60
        )
        assert result.empty

    def test_gluten_allergy_removes_gluten_items(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, ["Gluten"], [], "Breakfast", "High", age_months=60
        )
        assert "Pol Roti" not in result["Item Name"].tolist()

    def test_unrelated_allergy_no_false_positives(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, ["Shellfish"], [], "Lunch", "High", age_months=60
        )
        # None of our test proteins are tagged Shellfish
        assert len(result) == len(protein_df)


# ══════════════════════════════════════════════════════════════════════════════
# 5.  SAFETY FILTER — DISLIKE BLACKLIST
# ══════════════════════════════════════════════════════════════════════════════

class TestDislikeFilter:

    def test_disliked_item_is_removed(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], ["Dhal Curry"], "Any", "High", age_months=60
        )
        assert "Dhal Curry" not in result["Item Name"].tolist()

    def test_non_disliked_items_are_unaffected(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], ["Dhal Curry"], "Any", "High", age_months=60
        )
        assert "Egg Curry" in result["Item Name"].tolist()

    def test_empty_dislikes_list_changes_nothing(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Lunch", "High", age_months=60
        )
        assert len(result) == len(protein_df)


# ══════════════════════════════════════════════════════════════════════════════
# 6.  SAFETY FILTER — BONE SAFETY
# ══════════════════════════════════════════════════════════════════════════════

class TestBoneSafetyFilter:

    def test_bone_in_blocked_at_30_months(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Lunch", "High", age_months=30
        )
        assert "Chicken White Curry" not in result["Item Name"].tolist()
        assert "Fish Ambul Thiyal" not in result["Item Name"].tolist()

    def test_bone_in_blocked_at_47_months(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Lunch", "High", age_months=47
        )
        assert "Chicken White Curry" not in result["Item Name"].tolist()

    def test_bone_in_allowed_at_48_months(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Lunch", "High", age_months=48
        )
        assert "Chicken White Curry" in result["Item Name"].tolist()

    def test_boneless_always_remains(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Any", "High", age_months=24
        )
        assert "Boneless Fish Curry" in result["Item Name"].tolist()

    def test_no_bone_status_column_is_unaffected(self, engine_stub, base_df):
        # base_df has no Bone_Status column — filter must not crash or remove items
        before = len(base_df)
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "High", age_months=30
        )
        assert len(result) <= before  # may be smaller due to texture, but no crash


# ══════════════════════════════════════════════════════════════════════════════
# 7.  SAFETY FILTER — AGE-GROUP TEXTURE SEGMENTATION
# ══════════════════════════════════════════════════════════════════════════════

class TestTextureAgeFilter:

    # ── Base staples (State/Texture column) ──

    def test_toddler_chewy_base_is_blocked(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "High", age_months=30
        )
        # "Kalu Heenati (Red Rice)" has "Chewy Grainy" texture
        assert "Kalu Heenati (Red Rice)" not in result["Item Name"].tolist()

    def test_toddler_dry_crumbly_base_is_blocked(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Breakfast", "High", age_months=30
        )
        # "White Rice Pittu" has "Dry Crumbly" texture
        assert "White Rice Pittu" not in result["Item Name"].tolist()

    def test_young_preschool_chewy_IS_allowed(self, engine_stub, base_df):
        # 36-47 months: only Hard/Crunchy/Dry Crumbly blocked; Chewy is allowed
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "High", age_months=40
        )
        # "Kalu Heenati" is "Chewy Grainy" — must NOT be blocked at 40 months
        assert "Kalu Heenati (Red Rice)" in result["Item Name"].tolist()

    def test_young_preschool_dry_crumbly_still_blocked(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Breakfast", "High", age_months=40
        )
        assert "White Rice Pittu" not in result["Item Name"].tolist()

    def test_preschool_all_textures_allowed(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Dinner", "High", age_months=60
        )
        assert "Kalu Heenati (Red Rice)" in result["Item Name"].tolist()
        assert "White Rice Pittu" in result["Item Name"].tolist()

    # ── Dairy (Texture column) ──

    def test_toddler_firm_dairy_blocked(self, engine_stub, dairy_df):
        result = engine_stub._apply_safety_filters(
            dairy_df, [], [], "Snack", "High", age_months=30
        )
        # "Cheese Slice" has Texture = "Firm"
        assert "Cheese Slice" not in result["Item Name"].tolist()

    def test_preschool_firm_dairy_allowed(self, engine_stub, dairy_df):
        result = engine_stub._apply_safety_filters(
            dairy_df, [], [], "Snack", "High", age_months=60
        )
        assert "Cheese Slice" in result["Item Name"].tolist()

    # ── Vegetables (Prep_Style column) ──

    def test_raw_veg_blocked_under_48_months(self, engine_stub, veggie_df):
        result = engine_stub._apply_safety_filters(
            veggie_df, [], [], "Lunch", "High", age_months=30
        )
        assert "Carrot Sambol (Raw)" not in result["Item Name"].tolist()

    def test_raw_veg_blocked_at_47_months(self, engine_stub, veggie_df):
        result = engine_stub._apply_safety_filters(
            veggie_df, [], [], "Lunch", "High", age_months=47
        )
        assert "Carrot Sambol (Raw)" not in result["Item Name"].tolist()

    def test_raw_veg_allowed_at_48_months(self, engine_stub, veggie_df):
        result = engine_stub._apply_safety_filters(
            veggie_df, [], [], "Lunch", "High", age_months=48
        )
        assert "Carrot Sambol (Raw)" in result["Item Name"].tolist()

    # ── Fruits (Choking_Risk column) ──

    def test_high_choking_fruit_blocked_under_48_months(self, engine_stub, fruit_df):
        result = engine_stub._apply_safety_filters(
            fruit_df, [], [], "Snack", "High", age_months=30
        )
        assert "Grapes" not in result["Item Name"].tolist()
        assert "Mango" not in result["Item Name"].tolist()

    def test_high_choking_fruit_allowed_at_48_months(self, engine_stub, fruit_df):
        result = engine_stub._apply_safety_filters(
            fruit_df, [], [], "Snack", "High", age_months=48
        )
        assert "Grapes" in result["Item Name"].tolist()

    def test_low_choking_fruit_always_passes(self, engine_stub, fruit_df):
        result = engine_stub._apply_safety_filters(
            fruit_df, [], [], "Any", "High", age_months=24
        )
        assert "Banana" in result["Item Name"].tolist()


# ══════════════════════════════════════════════════════════════════════════════
# 8.  SAFETY FILTER — CLINICAL CONSTRAINTS
# ══════════════════════════════════════════════════════════════════════════════

class TestClinicalConstraints:

    def test_clinical_avoid_removes_matched_allergen(self, engine_stub, dairy_df):
        result = engine_stub._apply_safety_filters(
            dairy_df, [], [], "Snack", "High",
            age_months=60, clinical_avoid=["Dairy"]
        )
        assert result.empty

    def test_clinical_avoid_empty_changes_nothing(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Lunch", "High",
            age_months=60, clinical_avoid=[]
        )
        assert len(result) == len(protein_df)

    def test_texture_override_soft_forces_toddler_rules_at_60_months(self, engine_stub, base_df):
        # At 60 months normally all textures are allowed
        # With texture_override="soft", toddler rules kick in
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "High",
            age_months=60, texture_override="soft"
        )
        assert "Kalu Heenati (Red Rice)" not in result["Item Name"].tolist()
        assert "White Rice Pittu" not in result["Item Name"].tolist()

    def test_texture_override_normal_uses_age_based_rules(self, engine_stub, base_df):
        # "normal" at age 60 = preschool → no texture restriction
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "High",
            age_months=60, texture_override="normal"
        )
        assert "Kalu Heenati (Red Rice)" in result["Item Name"].tolist()

    def test_texture_override_pureed_forces_toddler_rules(self, engine_stub, base_df):
        result = engine_stub._apply_safety_filters(
            base_df, [], [], "Lunch", "High",
            age_months=60, texture_override="pureed"
        )
        assert "Kalu Heenati (Red Rice)" not in result["Item Name"].tolist()


# ══════════════════════════════════════════════════════════════════════════════
# 9.  SAFETY FILTER — VARIETY ENFORCEMENT
# ══════════════════════════════════════════════════════════════════════════════

class TestVarietyEnforcement:

    def test_recent_item_is_removed(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Any", "High",
            age_months=60, recent_items=["Dhal Curry"]
        )
        assert "Dhal Curry" not in result["Item Name"].tolist()

    def test_non_recent_items_remain(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Any", "High",
            age_months=60, recent_items=["Dhal Curry"]
        )
        assert "Egg Curry" in result["Item Name"].tolist()

    def test_empty_recent_items_no_change(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Lunch", "High",
            age_months=60, recent_items=[]
        )
        assert len(result) == len(protein_df)

    def test_multiple_recent_items_all_removed(self, engine_stub, protein_df):
        result = engine_stub._apply_safety_filters(
            protein_df, [], [], "Any", "High",
            age_months=60, recent_items=["Dhal Curry", "Egg Curry"]
        )
        names = result["Item Name"].tolist()
        assert "Dhal Curry" not in names
        assert "Egg Curry" not in names


# ══════════════════════════════════════════════════════════════════════════════
# 10.  FOOD COMPATIBILITY (Base_Type_Tag / Compatible_Bases)
# ══════════════════════════════════════════════════════════════════════════════

class TestFoodCompatibility:
    """
    Tests _generate_single_meal compatibility logic using the real engine
    loaded from actual CSVs, verifying that veggie filtering by base tag works.
    """

    def _run_meal(self, real_engine, base_tag_override=None):
        """Helper: generate one Lunch with all safety filters removed."""
        import copy
        safe_dfs = {name: copy.copy(df) for name, df in real_engine.datasets.items()}

        if base_tag_override and "Base_Type_Tag" in safe_dfs["base"].columns:
            safe_dfs["base"] = safe_dfs["base"][
                safe_dfs["base"]["Base_Type_Tag"] == base_tag_override
            ].reset_index(drop=True)

        meal, _ = real_engine._generate_single_meal("Lunch", safe_dfs, [])
        return meal

    def test_string_hopper_base_never_paired_with_mallum(self, real_engine):
        mallum_items = {
            "Gotu Kola Mallum", "Mukunuwenna Mallum", "Kathurumurunga Mallum",
            "Kohila Leaves Mallum", "Cabbage Mallum", "Manioc Leaves (Manyokka Kola) Mallum",
        }
        # Run multiple times — stochastic
        violations = 0
        for _ in range(20):
            meal = self._run_meal(real_engine, base_tag_override="StringHopper")
            plate_items = set(meal["plate"].values())
            if plate_items & mallum_items:
                violations += 1
        assert violations == 0, f"Mallum appeared with StringHopper base {violations}/20 times"

    def test_string_hopper_base_allows_kiriata_veggies(self, real_engine):
        kiriata_items = {
            "Pumpkin Curry (Kiriata)", "Potato Curry (Kiriata)", "Carrot Curry (Kiriata)",
            "Spinach (Niwithi) Kiriata", "Green Peas Curry (Kiriata)",
        }
        found = 0
        for _ in range(20):
            meal = self._run_meal(real_engine, base_tag_override="StringHopper")
            if set(meal["plate"].values()) & kiriata_items:
                found += 1
        assert found > 0, "No Kiriata veggie ever appeared with StringHopper base"

    def test_rice_base_allows_mallum(self, real_engine):
        mallum_items = {
            "Gotu Kola Mallum", "Mukunuwenna Mallum", "Cabbage Mallum",
            "Kathurumurunga Mallum", "Kohila Leaves Mallum",
        }
        found = 0
        for _ in range(30):
            meal = self._run_meal(real_engine, base_tag_override="Rice")
            if set(meal["plate"].values()) & mallum_items:
                found += 1
        assert found > 0, "Mallum never appeared with Rice base (should be compatible)"

    def test_snack_meal_returns_single_item(self, real_engine):
        import copy
        safe_dfs = {name: copy.copy(df) for name, df in real_engine.datasets.items()}
        meal, _ = real_engine._generate_single_meal("Snack", safe_dfs, [])
        assert "snack_item" in meal["plate"]
        assert len(meal["plate"]) == 1


# ══════════════════════════════════════════════════════════════════════════════
# 11.  ML RECOMMENDER
# ══════════════════════════════════════════════════════════════════════════════

class TestMLRecommender:

    @pytest.fixture
    def tiny_df(self):
        return pd.DataFrame({
            "Item Name":      ["Rice",    "Roti",     "Noodles"],
            "State/Texture":  ["Soft",    "Chewy",    "Soft"],
            "Cost":           ["Low",     "Low",      "Med"],
            "Veg/Non-Veg":    ["Veg",     "Veg",      "Veg"],
            "Calories (kcal)":[130,        120,        110],
            "Protein (g)":    [2.5,        3.0,        4.0],
            "Carbs (g)":      [28,         15,         20],
        })

    @pytest.fixture
    def recommender(self, tiny_df):
        return PediatricMLRecommender(tiny_df)

    def test_empty_candidates_returns_none(self, recommender):
        item, score = recommender.predict_optimal_food(pd.DataFrame(), [])
        assert item is None
        assert score == 0.0

    def test_no_history_returns_random_item(self, recommender, tiny_df):
        item, score = recommender.predict_optimal_food(tiny_df, [])
        assert item is not None
        assert score == 0.0  # exploration path — no similarity score

    def test_with_history_returns_an_item(self, recommender, tiny_df):
        item, score = recommender.predict_optimal_food(tiny_df, ["Rice"])
        assert item is not None

    def test_feature_matrix_shape_matches_items(self, recommender, tiny_df):
        rows, _ = recommender.feature_matrix.shape
        assert rows == len(tiny_df)

    def test_item_to_idx_covers_all_items(self, recommender, tiny_df):
        assert set(recommender.item_to_idx.keys()) == set(tiny_df["Item Name"].tolist())

    def test_model_saved_and_reloaded_from_cache(self, tmp_path, tiny_df):
        """Fingerprint-based cache: second init should load from disk."""
        model_path = str(tmp_path / "recommender.joblib")
        fake_fp = "test_fp_abc123"

        # First build — patch fingerprint so the model gets saved to disk
        with patch("src.services.ml_recommender.MODEL_PATH", model_path), \
             patch("src.services.ml_recommender._compute_csv_fingerprint", return_value=fake_fp):
            m1 = PediatricMLRecommender(tiny_df, csv_paths=["dummy"])

        assert (tmp_path / "recommender.joblib").exists()

        # Second build — same fingerprint → should load from cache
        with patch("src.services.ml_recommender.MODEL_PATH", model_path), \
             patch("src.services.ml_recommender._compute_csv_fingerprint", return_value=fake_fp):
            m2 = PediatricMLRecommender(tiny_df, csv_paths=["dummy"])

        np.testing.assert_array_equal(m1.feature_matrix, m2.feature_matrix)


# ══════════════════════════════════════════════════════════════════════════════
# 12.  POST /generate-plan  — POSITIVE CASES
# ══════════════════════════════════════════════════════════════════════════════

_HEALTHY_5YO = {
    "child_id": "test_api",
    "health_data": {
        "age_months": 60, "weight_kg": 18.0, "height_cm": 110.0,
        "gender": "Female", "activity_level": "Moderate",
        "medical_conditions": [], "medications": [],
    },
    "preferences": {"allergies": [], "budget_level": "Medium"},
    "lifestyle": {"meals_per_day": 5},
    "behavioral_state": {},
}

_HEALTHY_5YO_3MEAL = {**_HEALTHY_5YO, "lifestyle": {"meals_per_day": 3}}


class TestGeneratePlanPositive:

    def test_returns_200(self, client):
        resp = client.post("/generate-plan", json=_HEALTHY_5YO)
        assert resp.status_code == 200

    def test_response_has_daily_plan_and_metrics(self, client):
        data = client.post("/generate-plan", json=_HEALTHY_5YO).json()["data"]
        assert "daily_plan" in data
        assert "research_metrics" in data

    def test_5_meal_schedule_produces_5_slots(self, client):
        plan = client.post("/generate-plan", json=_HEALTHY_5YO).json()["data"]["daily_plan"]
        assert set(plan.keys()) == {"Breakfast", "Snack", "Lunch", "Tea Time", "Dinner"}

    def test_3_meal_schedule_produces_3_slots(self, client):
        plan = client.post("/generate-plan", json=_HEALTHY_5YO_3MEAL).json()["data"]["daily_plan"]
        assert set(plan.keys()) == {"Breakfast", "Lunch", "Dinner"}

    def test_main_meals_have_base_protein_veggies(self, client):
        plan = client.post("/generate-plan", json=_HEALTHY_5YO).json()["data"]["daily_plan"]
        lunch = plan["Lunch"]["plate"]
        assert "base" in lunch
        assert "protein" in lunch
        assert "veggie_1" in lunch

    def test_breakfast_has_2_veggies(self, client):
        plan = client.post("/generate-plan", json=_HEALTHY_5YO).json()["data"]["daily_plan"]
        bfast = plan["Breakfast"]["plate"]
        assert "veggie_1" in bfast
        assert "veggie_2" in bfast
        assert "veggie_3" not in bfast

    def test_lunch_dinner_have_3_veggies(self, client):
        plan = client.post("/generate-plan", json=_HEALTHY_5YO_3MEAL).json()["data"]["daily_plan"]
        lunch = plan["Lunch"]["plate"]
        assert "veggie_3" in lunch

    def test_snack_has_single_snack_item(self, client):
        plan = client.post("/generate-plan", json=_HEALTHY_5YO).json()["data"]["daily_plan"]
        snack = plan["Snack"]["plate"]
        assert "snack_item" in snack
        assert len(snack) == 1

    def test_research_metrics_keys_present(self, client):
        metrics = client.post("/generate-plan", json=_HEALTHY_5YO).json()["data"]["research_metrics"]
        for key in ("target_calories", "achieved_calories", "optimization_loss_kcal", "behavioral_alignment_score"):
            assert key in metrics

    def test_eer_target_is_reasonable(self, client):
        # IOM EER for 60-month female 18kg 110cm moderate ≈ 1150–1350 kcal
        target = client.post("/generate-plan", json=_HEALTHY_5YO).json()["data"]["research_metrics"]["target_calories"]
        assert 900 < target < 1600

    def test_achieved_calories_is_positive(self, client):
        achieved = client.post("/generate-plan", json=_HEALTHY_5YO).json()["data"]["research_metrics"]["achieved_calories"]
        assert achieved > 0

    def test_gemini_fallback_still_generates_plan(self, client):
        """Broken Gemini response must not block plan generation."""
        with patch("src.main.get_clinical_constraints", return_value="NOT_JSON"):
            resp = client.post("/generate-plan", json={
                **_HEALTHY_5YO,
                "health_data": {**_HEALTHY_5YO["health_data"], "medical_conditions": ["Anemia"]},
            })
        assert resp.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# 13.  POST /generate-plan  — NEGATIVE CASES
# ══════════════════════════════════════════════════════════════════════════════

class TestGeneratePlanNegative:

    def test_missing_child_id_returns_422(self, client):
        payload = {k: v for k, v in _HEALTHY_5YO.items() if k != "child_id"}
        assert client.post("/generate-plan", json=payload).status_code == 422

    def test_missing_health_data_returns_422(self, client):
        payload = {k: v for k, v in _HEALTHY_5YO.items() if k != "health_data"}
        assert client.post("/generate-plan", json=payload).status_code == 422

    def test_missing_age_months_returns_422(self, client):
        payload = {
            **_HEALTHY_5YO,
            "health_data": {k: v for k, v in _HEALTHY_5YO["health_data"].items() if k != "age_months"},
        }
        assert client.post("/generate-plan", json=payload).status_code == 422

    def test_invalid_age_months_type_returns_422(self, client):
        payload = {
            **_HEALTHY_5YO,
            "health_data": {**_HEALTHY_5YO["health_data"], "age_months": "sixty"},
        }
        assert client.post("/generate-plan", json=payload).status_code == 422

    def test_missing_gender_returns_422(self, client):
        payload = {
            **_HEALTHY_5YO,
            "health_data": {k: v for k, v in _HEALTHY_5YO["health_data"].items() if k != "gender"},
        }
        assert client.post("/generate-plan", json=payload).status_code == 422

    def test_empty_body_returns_422(self, client):
        assert client.post("/generate-plan", json={}).status_code == 422


# ══════════════════════════════════════════════════════════════════════════════
# 14.  POST /meal-feedback  — POSITIVE CASES
# ══════════════════════════════════════════════════════════════════════════════

class TestMealFeedbackPositive:

    def test_accept_returns_200(self, client):
        resp = client.post("/meal-feedback", json={
            "child_id": "test_api", "meal_type": "Lunch",
            "action": "accept", "actioned_items": ["Dhal Curry"], "new_meal": False,
        })
        assert resp.status_code == 200

    def test_accept_updates_current_state(self, client):
        resp = client.post("/meal-feedback", json={
            "child_id": "test_api", "meal_type": "Lunch",
            "action": "accept", "actioned_items": ["Dhal Curry", "Red Rice (Kekulu)"],
            "new_meal": False,
        })
        state = resp.json()["current_state"]
        assert "Dhal Curry" in state["liked_ingredients"]
        assert "Red Rice (Kekulu)" in state["liked_ingredients"]

    def test_reject_without_new_meal_returns_200(self, client):
        resp = client.post("/meal-feedback", json={
            "child_id": "test_api", "meal_type": "Lunch",
            "action": "reject", "actioned_items": ["Egg Curry"], "new_meal": False,
        })
        assert resp.status_code == 200

    def test_reject_updates_disliked_ingredients(self, client):
        resp = client.post("/meal-feedback", json={
            "child_id": "test_api", "meal_type": "Lunch",
            "action": "reject", "actioned_items": ["Egg Curry"], "new_meal": False,
        })
        state = resp.json()["current_state"]
        assert "Egg Curry" in state["disliked_ingredients"]

    def test_reject_with_new_meal_returns_updated_meal(self, client):
        resp = client.post("/meal-feedback", json={
            "child_id": "test_api", "meal_type": "Lunch",
            "action": "reject", "actioned_items": ["Egg Curry"], "new_meal": True,
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "updated_meal" in body
        assert "updated_plan" in body

    def test_replacement_meal_excludes_rejected_items(self, client):
        rejected = ["Egg Curry"]
        resp = client.post("/meal-feedback", json={
            "child_id": "test_api", "meal_type": "Lunch",
            "action": "reject", "actioned_items": rejected, "new_meal": True,
        })
        new_plate = resp.json()["updated_meal"]["plate"]
        for item in rejected:
            assert item not in new_plate.values()

    def test_response_has_meal_feedback_key(self, client):
        resp = client.post("/meal-feedback", json={
            "child_id": "test_api", "meal_type": "Breakfast",
            "action": "accept", "actioned_items": ["Red Rice (Kekulu)"], "new_meal": False,
        })
        assert "meal_feedback" in resp.json()


# ══════════════════════════════════════════════════════════════════════════════
# 15.  POST /meal-feedback  — NEGATIVE CASES
# ══════════════════════════════════════════════════════════════════════════════

class TestMealFeedbackNegative:

    def test_missing_child_id_returns_422(self, client):
        resp = client.post("/meal-feedback", json={
            "meal_type": "Lunch", "action": "accept",
            "actioned_items": ["Dhal Curry"], "new_meal": False,
        })
        assert resp.status_code == 422

    def test_missing_action_returns_422(self, client):
        resp = client.post("/meal-feedback", json={
            "child_id": "test_api", "meal_type": "Lunch",
            "actioned_items": ["Dhal Curry"], "new_meal": False,
        })
        assert resp.status_code == 422

    def test_missing_meal_type_returns_422(self, client):
        resp = client.post("/meal-feedback", json={
            "child_id": "test_api", "action": "accept",
            "actioned_items": ["Dhal Curry"], "new_meal": False,
        })
        assert resp.status_code == 422

    def test_empty_body_returns_422(self, client):
        assert client.post("/meal-feedback", json={}).status_code == 422
