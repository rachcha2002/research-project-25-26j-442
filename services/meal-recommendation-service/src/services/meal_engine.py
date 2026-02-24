import pandas as pd
import random

class MealEngine:
    def __init__(self):
        self.base_df = pd.read_csv("data/sl_base_staples.csv")
        self.proteins_df = pd.read_csv("data/sl_proteins_curries.csv")
        self.veggies_df = pd.read_csv("data/sl_vegetables_greens.csv")
        self.dairy_df = pd.read_csv("data/sl_dairy_crunch.csv")
        self.fruits_df = pd.read_csv("data/sl_fruits_sweets.csv")

    def _filter_allergies(self, df, allergy_list):
        if not allergy_list:
            return df
        mask = df['Allergies'].apply(
            lambda x: not any(allergy.lower() in str(x).lower() for allergy in allergy_list)
        )
        return df[mask]

    def _filter_dislikes(self, df, disliked_list):
        """Removes items the child has explicitly rejected in the past."""
        if not disliked_list:
            return df
        # Keep rows where the 'Item Name' is NOT in the disliked list
        mask = ~df['Item Name'].isin(disliked_list)
        return df[mask]

    def _filter_by_time(self, df, meal_type):
        return df[df['Ideal_Meal_Time'].str.contains(meal_type, na=False, case=False)]

    def generate_meal(self, meal_type, allergies, dislikes=[]):
        safe_bases = self._filter_by_time(self._filter_dislikes(self._filter_allergies(self.base_df, allergies), dislikes), meal_type)
        if safe_bases.empty:
            return None
            
        selected_base = safe_bases.sample(1).iloc[0]
        safe_proteins = self._filter_by_time(self._filter_dislikes(self._filter_allergies(self.proteins_df, allergies), dislikes), meal_type)
        selected_protein = safe_proteins.sample(1).iloc[0] if not safe_proteins.empty else None
        safe_veggies = self._filter_by_time(self._filter_dislikes(self._filter_allergies(self.veggies_df, allergies), dislikes), meal_type)
        selected_veg = safe_veggies.sample(1).iloc[0] if not safe_veggies.empty else None
        safe_dairy = self._filter_by_time(self._filter_dislikes(self._filter_allergies(self.dairy_df, allergies), dislikes), meal_type)
        selected_dairy = safe_dairy.sample(1).iloc[0] if not safe_dairy.empty else None
        safe_fruits = self._filter_by_time(self._filter_dislikes(self._filter_allergies(self.fruits_df, allergies), dislikes), meal_type)
        selected_fruit = safe_fruits.sample(1).iloc[0] if not safe_fruits.empty else None

        total_cals = int(selected_base.get('Calories (kcal)', 0))
        components = {"base": selected_base['Item Name']}

        if selected_protein is not None:
            total_cals += int(selected_protein.get('Calories (kcal)', 0))
            components["protein"] = selected_protein['Item Name']
        if selected_veg is not None:
            total_cals += int(selected_veg.get('Calories (kcal)', 0))
            components["vegetable"] = selected_veg['Item Name']
        if selected_dairy is not None:
            total_cals += int(selected_dairy.get('Calories (kcal)', 0))
            components["dairy_or_crunch"] = selected_dairy['Item Name']
        if selected_fruit is not None:
            total_cals += int(selected_fruit.get('Calories (kcal)', 0))
            components["fruit_or_sweet"] = selected_fruit['Item Name']

        return {
            "meal_type": meal_type,
            "plate": components,
            "total_calories": total_cals
        }

    def generate_daily_plan(self, allergies, target_calories, dislikes=None):
        """Assembles a full day of meals using Stochastic Optimization to hit calorie targets."""
        if dislikes is None:
            dislikes = []
            
        schedule = ["Breakfast", "Snack", "Lunch", "Tea Time", "Dinner"]
        
        best_plan = {}
        best_difference = float('inf') # Start with an infinitely bad score
        best_total_calories = 0
        iterations_run = 0
        
        # ---------------------------------------------------------
        # ML Concept: Stochastic Optimization (Loss Minimization)
        # Generate up to 15 candidate days and pick the best one.
        # ---------------------------------------------------------
        for i in range(15):
            iterations_run = i + 1
            current_plan = {}
            current_total = 0
            
            for meal_time in schedule:
                # Generate a single meal
                meal = self.generate_meal(meal_time, allergies, dislikes)
                if meal and "error" not in meal:
                    current_plan[meal_time] = meal
                    current_total += meal["total_calories"]
            
            # Calculate the "Loss" (How far off are we from the target?)
            loss = abs(current_total - target_calories)
            
            # If this candidate is better than our previous best, save it!
            if loss < best_difference:
                best_difference = loss
                best_plan = current_plan
                best_total_calories = current_total
                
            # Early Stopping: If we hit within 40 kcal of the target, it's perfect. Stop computing.
            if best_difference <= 40:
                break
                
        # Calculate the final signed difference (+ means surplus, - means deficit)
        final_difference = best_total_calories - target_calories
        
        return {
            "meals": best_plan,
            "metrics": {
                "target_calories": target_calories,
                "achieved_calories": best_total_calories,
                "difference": final_difference,
                "optimization_iterations": iterations_run,
                "status": "Highly Optimized" if abs(final_difference) <= 75 else "Best Possible Match"
            }
        }