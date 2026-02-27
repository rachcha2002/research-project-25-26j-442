import pandas as pd
from src.models.schemas import MealGenerationRequest
from src.services.ml_recommender import PediatricMLRecommender

class MealOptimizerEngine:
    def __init__(self):
        """Loads datasets into memory and initializes the ML Recommender."""
        self.datasets = {
            "base": pd.read_csv("data/sl_base_staples.csv"),
            "protein": pd.read_csv("data/sl_proteins_curries.csv"),
            "veggie": pd.read_csv("data/sl_vegetables_greens.csv"),
            "dairy": pd.read_csv("data/sl_dairy_crunch.csv"),
            "fruit": pd.read_csv("data/sl_fruits_sweets.csv")
        }
        
        # Combine all datasets to train the ML Feature Matrix
        all_foods = pd.concat(self.datasets.values(), ignore_index=True)
        self.ml_model = PediatricMLRecommender(all_foods)

    def _apply_safety_filters(self, df: pd.DataFrame, allergies: list, dislikes: list,meal_type: str, budget_level: str) -> pd.DataFrame:
        """PHASE 2: Absolute mathematical elimination of allergens and blacklisted items."""
        safe_df = df.copy()

        if not safe_df.empty and 'Cost' in safe_df.columns:
            if budget_level == "Low":
                allowed_costs = ["Low"]
            elif budget_level == "Medium":
                allowed_costs = ["Low", "Medium"]
            else:
                allowed_costs = ["Low", "Medium", "High"]
            
        safe_df = safe_df[safe_df['Cost'].isin(allowed_costs)]

        if not safe_df.empty and 'Ideal_Meal_Time' in safe_df.columns:
            safe_df = safe_df[safe_df['Ideal_Meal_Time'].str.contains(meal_type, case=False, na=False) | 
                            safe_df['Ideal_Meal_Time'].str.contains("Any", case=False, na=False)]
        
        # 1. Eliminate Allergies (Assuming your CSV has an 'Allergies' column)
        if not safe_df.empty and allergies:
            # Create a regex pattern to find any matching allergy in the column
            pattern = '|'.join(allergies)
            safe_df = safe_df[~safe_df['Allergies'].str.contains(pattern, case=False, na=False)]
            
        # 2. Eliminate Behavioral Dislikes (Blacklist)
        if not safe_df.empty and dislikes:
            safe_df = safe_df[~safe_df['Item Name'].isin(dislikes)]
            
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
            for category in ["base", "protein"]:
                item, score = self.ml_model.predict_optimal_food(safe_dfs[category], liked_history)
                if item is not None:
                    plate[category] = item['Item Name']
                    total_meal_cals += item['Calories (kcal)']
                    total_score += score
                    items_count += 1
            veg_count = 2 if meal_type == "Breakfast" else 3

            available_veggies = safe_dfs["veggie"].copy()
            for i in range(veg_count):
                if available_veggies.empty: break
                
                veg_item, veg_score = self.ml_model.predict_optimal_food(available_veggies, liked_history)
                if veg_item is not None:
                    plate[f'veggie_{i+1}'] = veg_item['Item Name']
                    total_meal_cals += veg_item['Calories (kcal)']
                    total_score += veg_score
                    items_count += 1
                    # Remove the selected veggie to avoid duplicates
                    available_veggies = available_veggies[available_veggies['Item Name'] != veg_item['Item Name']]
                else:
                    break
        avg_score = (total_score / items_count) if items_count > 0 else 0
        return {"meal_type": meal_type, "plate": plate, "calories": total_meal_cals}, avg_score

    def generate_optimized_plan(self, request: MealGenerationRequest):
        """PHASE 3: Stochastic Optimization Loop for Caloric Balancing."""
        target_cal = request.health_data.daily_calorie_target
        allergies = request.preferences.allergies
        dislikes = request.behavioral_state.disliked_ingredients
        likes = request.behavioral_state.liked_ingredients
        
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
                    name: self._apply_safety_filters(df, allergies, dislikes, meal_time,request.preferences.budget_level)
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