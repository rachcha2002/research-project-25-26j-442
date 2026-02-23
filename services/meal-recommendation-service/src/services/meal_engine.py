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

    def _filter_by_time(self, df, meal_type):
        return df[df['Ideal_Meal_Time'].str.contains(meal_type, na=False, case=False)]

    def generate_meal(self, meal_type, allergies):
        safe_bases = self._filter_by_time(self._filter_allergies(self.base_df, allergies), meal_type)
        if safe_bases.empty:
            return None
            
        selected_base = safe_bases.sample(1).iloc[0]
        safe_proteins = self._filter_by_time(self._filter_allergies(self.proteins_df, allergies), meal_type)
        selected_protein = safe_proteins.sample(1).iloc[0] if not safe_proteins.empty else None
        safe_veggies = self._filter_by_time(self._filter_allergies(self.veggies_df, allergies), meal_type)
        selected_veg = safe_veggies.sample(1).iloc[0] if not safe_veggies.empty else None
        safe_dairy = self._filter_by_time(self._filter_allergies(self.dairy_df, allergies), meal_type)
        selected_dairy = safe_dairy.sample(1).iloc[0] if not safe_dairy.empty else None
        safe_fruits = self._filter_by_time(self._filter_allergies(self.fruits_df, allergies), meal_type)
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

    def generate_daily_plan(self, allergies, target_calories):
        """Assembles a full day of meals and compares against the calorie target."""
        
        # Define the structure of a Sri Lankan child's day
        schedule = ["Breakfast", "Snack", "Lunch", "Tea Time", "Dinner"]
        daily_plan = {}
        daily_total_calories = 0

        for meal_time in schedule:
            meal = self.generate_meal(meal_time, allergies)
            if meal:
                daily_plan[meal_time] = meal
                daily_total_calories += meal["total_calories"]

        # Calculate how well the ML did against the target
        calorie_difference = daily_total_calories - target_calories
        
        return {
            "meals": daily_plan,
            "metrics": {
                "target_calories": target_calories,
                "achieved_calories": daily_total_calories,
                "difference": calorie_difference,
                "status": "Target Met" if abs(calorie_difference) <= 150 else "Requires Adjustment"
            }
        }