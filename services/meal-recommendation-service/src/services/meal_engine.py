import random
import pandas as pd
from src.models.schemas import MealGenerationRequest
from src.services.ml_recommender import PediatricMLRecommender

class MealOptimizerEngine:
    # Canonical paths used for both loading data and computing the cache fingerprint
    _CSV_PATHS = {
        "base":    "data/sl_base_staples.csv",
        "protein": "data/sl_proteins_curries.csv",
        "veggie":  "data/sl_vegetables_greens.csv",
        "dairy":   "data/sl_dairy_crunch.csv",
        "fruit":   "data/sl_fruits_sweets.csv",
    }

    # Per-group texture/prep keywords to EXCLUDE from food candidates.
    # Each dataset carries a different column name:
    #   Base staples  → State/Texture
    #   Dairy/crunch  → Texture
    #   Vegetables    → Prep_Style  (Raw items are too hard for under-48-month children)
    #   Fruits        → Choking_Risk (any value containing "High" is excluded under 48 months)
    _AGE_TEXTURE_EXCLUSIONS = {
        "toddler": {
            # 24-35 months: only soft / mashed / puree / watery textures allowed
            "texture_keywords": ["Chewy", "Crunchy", "Hard", "Crispy", "Stringy", "Dry Crumbly", "Firm"],
            "prep_keywords":    ["Raw"],
        },
        "young_preschool": {
            # 36-47 months: soft-chewy is OK; hard/crunchy/raw still excluded
            "texture_keywords": ["Hard", "Crunchy", "Dry Crumbly"],
            "prep_keywords":    ["Raw"],
        },
        "preschool": {
            # 48+ months: no texture restrictions
            "texture_keywords": [],
            "prep_keywords":    [],
        },
    }

    # Veggie count range (min, max) per base type — reflects Sri Lankan eating culture.
    # Stochastic: actual count is random.randint(min, max) per iteration.
    _BASE_VEGGIE_COUNTS = {
        "Rice":         (2, 3),  # Full meal: 2-3 side dishes
        "MilkRice":     (0, 0),  # Kiribath: only Lunu Miris or Banana (not a veggie)
        "StringHopper": (0, 1),  # Kiri Hodi is the protein; 0-1 sambol-style side
        "Hopper":       (0, 1),  # Appa: eaten alone or with sambol/Kiri Hodi only
        "Pittu":        (0, 1),  # Coconut milk + one curry; no mallum
        "Roti":         (0, 1),  # Dhal or sambol only; not a full rice-style spread
        "Bread":        (0, 0),  # Spread handled by protein/dairy (butter, dhal, jam)
        "Noodles":      (1, 2),  # Stir-fry elements mixed in
        "RootCrop":     (0, 0),  # Standalone boiled root (coconut from dairy)
        "Porridge":     (0, 0),  # Standalone kanda/congee
        "Legume":       (0, 0),  # Standalone boiled legume snack
        "Snack":        (0, 0),  # Self-contained snack item
    }

    @staticmethod
    def _get_age_group(age_months: int) -> str:
        if age_months < 36:
            return "toddler"
        elif age_months < 48:
            return "young_preschool"
        return "preschool"

    def __init__(self):
        """Loads datasets into memory and initializes the ML Recommender."""
        self.datasets = {
            name: pd.read_csv(path)
            for name, path in self._CSV_PATHS.items()
        }

        all_foods = pd.concat(self.datasets.values(), ignore_index=True)
        self.ml_model = PediatricMLRecommender(
            all_foods,
            csv_paths=list(self._CSV_PATHS.values()),
        )

    def _apply_safety_filters(self, df: pd.DataFrame, allergies: list, dislikes: list, meal_type: str, budget_level: str, age_months: int = 72, recent_items: list = [], clinical_avoid: list = [], texture_override: str = None) -> pd.DataFrame:
        """PHASE 2: Absolute mathematical elimination of allergens and blacklisted items."""
        safe_df = df.copy()

        if not safe_df.empty and 'Cost' in safe_df.columns:
            if budget_level == "Low":
                allowed_costs = ["Low"]
            elif budget_level == "Medium":
                allowed_costs = ["Low", "Med"]
            else:
                allowed_costs = ["Low", "Med", "High"]

        safe_df = safe_df[safe_df['Cost'].isin(allowed_costs)]

        if not safe_df.empty and 'Ideal_Meal_Time' in safe_df.columns:
            safe_df = safe_df[safe_df['Ideal_Meal_Time'].str.contains(meal_type, case=False, na=False) |
                            safe_df['Ideal_Meal_Time'].str.contains("Any", case=False, na=False)]

        # 1. Eliminate Allergies
        if not safe_df.empty and allergies:
            pattern = '|'.join(allergies)
            safe_df = safe_df[~safe_df['Allergies'].str.contains(pattern, case=False, na=False)]

        # 2. Eliminate Behavioral Dislikes (Blacklist)
        if not safe_df.empty and dislikes:
            safe_df = safe_df[~safe_df['Item Name'].isin(dislikes)]

        # 2b. Clinical avoidances from Gemini LLM (matched against Allergies column)
        if not safe_df.empty and clinical_avoid:
            pattern = '|'.join(clinical_avoid)
            safe_df = safe_df[~safe_df['Allergies'].str.contains(pattern, case=False, na=False)]

        # 3. Bone safety filter (only the protein dataset carries a Bone_Status column)
        # < 36 months : no bone-in at all
        # 36-47 months: also no bone-in; small boneless fish (sprats, whitebait) are
        #               already Boneless in the CSV so they remain naturally available
        # >= 48 months : no restriction
        if not safe_df.empty and 'Bone_Status' in safe_df.columns and age_months < 48:
            safe_df = safe_df[safe_df['Bone_Status'] != 'Bone-in']

        # 4. Age-group texture segmentation (clinical texture_mod overrides age-based group)
        if texture_override in ("soft", "pureed"):
            age_group = "toddler"  # Maximum texture restriction for medical conditions
        else:
            age_group = self._get_age_group(age_months)
        exclusions = self._AGE_TEXTURE_EXCLUSIONS[age_group]

        # 4a. Base staples — filter by State/Texture column
        if not safe_df.empty and 'State/Texture' in safe_df.columns and exclusions["texture_keywords"]:
            pattern = '|'.join(exclusions["texture_keywords"])
            safe_df = safe_df[~safe_df['State/Texture'].str.contains(pattern, case=False, na=False)]

        # 4b. Dairy/crunch — filter by Texture column
        if not safe_df.empty and 'Texture' in safe_df.columns and exclusions["texture_keywords"]:
            pattern = '|'.join(exclusions["texture_keywords"])
            safe_df = safe_df[~safe_df['Texture'].str.contains(pattern, case=False, na=False)]

        # 4c. Vegetables — filter by Prep_Style column (raw veg is too hard under 48 months)
        if not safe_df.empty and 'Prep_Style' in safe_df.columns and exclusions["prep_keywords"]:
            pattern = '|'.join(exclusions["prep_keywords"])
            safe_df = safe_df[~safe_df['Prep_Style'].str.contains(pattern, case=False, na=False)]

        # 4d. Fruits — filter by Choking_Risk column (any "High" value excluded under 48 months)
        if not safe_df.empty and 'Choking_Risk' in safe_df.columns and age_months < 48:
            safe_df = safe_df[~safe_df['Choking_Risk'].str.contains("High", case=False, na=False)]

        # 5. Variety enforcement: exclude items served in the rolling recent window (~2 days)
        if not safe_df.empty and recent_items:
            safe_df = safe_df[~safe_df['Item Name'].isin(recent_items)]

        return safe_df.reset_index(drop=True)

    def _generate_single_meal(self, meal_type: str, safe_dfs: dict, liked_history: list):
        """Builds a single plate using the ML model."""
        plate = {}
        total_meal_cals = 0
        total_score = 0
        items_count = 0

        # SNACK LOGIC: Only Dairy or Fruits
        if meal_type in ["Snack", "Tea Time"]:
            combined_snacks = pd.concat([safe_dfs["dairy"], safe_dfs["fruit"]], ignore_index=True)
            item, score = self.ml_model.predict_optimal_food(combined_snacks, liked_history)
            if item is not None:
                plate["snack_item"] = item['Item Name']
                total_meal_cals += item['Calories (kcal)']
                total_score += score
                items_count += 1
                
        # MAIN MEAL LOGIC: Base + Protein + Veg
        else:
            # 1. Base is mandatory for Breakfast / Lunch / Dinner — abort if unavailable
            base_item, base_score = self.ml_model.predict_optimal_food(safe_dfs["base"], liked_history)
            if base_item is None:
                return {"meal_type": meal_type, "plate": {}, "calories": 0}, 0

            plate["base"] = base_item['Item Name']
            total_meal_cals += base_item['Calories (kcal)']
            total_score += base_score
            items_count += 1
            base_tag = base_item.get('Base_Type_Tag') if 'Base_Type_Tag' in safe_dfs["base"].columns else None

            # 2. Select protein independently
            protein_item, protein_score = self.ml_model.predict_optimal_food(safe_dfs["protein"], liked_history)
            if protein_item is not None:
                plate["protein"] = protein_item['Item Name']
                total_meal_cals += protein_item['Calories (kcal)']
                total_score += protein_score
                items_count += 1

            # 3. Filter veggies by base compatibility, with fallback to full pool
            available_veggies = safe_dfs["veggie"].copy()
            if base_tag and 'Compatible_Bases' in available_veggies.columns:
                compatible = available_veggies[
                    available_veggies['Compatible_Bases'].str.contains('Any', case=False, na=False) |
                    available_veggies['Compatible_Bases'].str.contains(base_tag, case=False, na=False)
                ]
                if not compatible.empty:
                    available_veggies = compatible

            if base_tag and base_tag in self._BASE_VEGGIE_COUNTS:
                min_v, max_v = self._BASE_VEGGIE_COUNTS[base_tag]
            elif meal_type == "Breakfast":
                min_v, max_v = (1, 2)
            else:
                min_v, max_v = (2, 3)
            veg_count = random.randint(min_v, max_v)

            for i in range(veg_count):
                if available_veggies.empty: break

                veg_item, veg_score = self.ml_model.predict_optimal_food(available_veggies, liked_history)
                if veg_item is not None:
                    plate[f'veggie_{i+1}'] = veg_item['Item Name']
                    total_meal_cals += veg_item['Calories (kcal)']
                    total_score += veg_score
                    items_count += 1
                    available_veggies = available_veggies[available_veggies['Item Name'] != veg_item['Item Name']]
                else:
                    break
        avg_score = (total_score / items_count) if items_count > 0 else 0
        return {"meal_type": meal_type, "plate": plate, "calories": total_meal_cals}, avg_score

    def generate_optimized_plan(self, request: MealGenerationRequest, clinical_constraints=None):
        """PHASE 3: Stochastic Optimization Loop for Caloric Balancing."""
        target_cal = request.health_data.daily_calorie_target
        allergies = request.preferences.allergies
        dislikes = request.behavioral_state.disliked_ingredients
        likes = request.behavioral_state.liked_ingredients
        recent_items = request.behavioral_state.recent_items
        clinical_avoid = clinical_constraints.avoid if clinical_constraints else []
        texture_override = clinical_constraints.texture_mod if clinical_constraints else None
        
        # Determine Schedule
        if request.lifestyle.meals_per_day == 3:
            schedule = ["Breakfast", "Lunch", "Dinner"]
        else:
            schedule = ["Breakfast", "Snack", "Lunch", "Tea Time", "Dinner"]

        best_plan = {}
        min_loss = float('inf')
        best_similarity_score = 0
        final_calories = 0

        # STOCHASTIC LOOP: Run 15 iterations to find the best caloric match
        for _ in range(15):
            current_day = {}
            current_day_cals = 0
            day_similarity_sum = 0
            
            for meal_time in schedule:

                # Pre-filter all datasets for safety to save processing time in the loop
                safe_dfs = {
                    name: self._apply_safety_filters(df, allergies, dislikes, meal_time, request.preferences.budget_level, request.health_data.age_months, recent_items, clinical_avoid, texture_override)
                    for name, df in self.datasets.items()
                }
                meal_data, meal_score = self._generate_single_meal(meal_time, safe_dfs, likes)
                if meal_data["plate"]: # Only add if items were found
                    current_day[meal_time] = meal_data
                    current_day_cals += meal_data["calories"]
                    day_similarity_sum += meal_score
                    
            # Calculate Loss (Absolute variance from target)
            loss = abs(current_day_cals - target_cal)
            
            if loss < min_loss:
                min_loss = loss
                best_plan = current_day
                final_calories = current_day_cals
                best_similarity_score = day_similarity_sum / len(schedule)

        # Output payload formatted for your Research Evaluation Chapter
        return {
            "daily_plan": best_plan,
            "research_metrics": {
                "target_calories": target_cal,
                "achieved_calories": round(final_calories, 2),
                "optimization_loss_kcal": round(min_loss, 2),
                "behavioral_alignment_score": f"{round(best_similarity_score * 100, 2)}%"
            }
        }

    def generate_replacement_meal(
        self,
        meal_type: str,
        target_calories: float,
        allergies: list,
        budget_level: str,
        dislikes: list,
        likes: list,
        age_months: int = 72,
        recent_items: list = [],
    ):
        best_meal = None
        best_loss = float('inf')
        best_score = 0

        for _ in range(15):
            safe_dfs = {
                name: self._apply_safety_filters(df, allergies, dislikes, meal_type, budget_level, age_months, recent_items)
                for name, df in self.datasets.items()
            }

            meal_data, meal_score = self._generate_single_meal(meal_type, safe_dfs, likes)
            if not meal_data["plate"]:
                continue

            loss = abs(meal_data["calories"] - target_calories)
            if loss < best_loss:
                best_loss = loss
                best_meal = meal_data
                best_score = meal_score

        if best_meal is None:
            return None

        return {
            "meal": best_meal,
            "calorie_loss": round(best_loss, 2),
            "similarity_score": round(best_score, 4),
        }