import pandas as pd
import random

class MealEngine:
    def __init__(self):
        # 1. Load ALL 5 datasets into memory
        self.base_df = pd.read_csv("data/sl_base_staples.csv")
        self.proteins_df = pd.read_csv("data/sl_proteins_curries.csv")
        self.veggies_df = pd.read_csv("data/sl_vegetables_greens.csv")
        self.dairy_df = pd.read_csv("data/sl_dairy_crunch.csv")
        self.fruits_df = pd.read_csv("data/sl_fruits_sweets.csv")

    def _filter_allergies(self, df, allergy_list):
        """Removes any row where the 'Allergies' column matches the child's allergies."""
        if not allergy_list:
            return df
        
        # Keep rows where the allergy string DOES NOT contain the user's allergies
        mask = df['Allergies'].apply(
            lambda x: not any(allergy.lower() in str(x).lower() for allergy in allergy_list)
        )
        return df[mask]

    def _filter_by_time(self, df, meal_type):
        """Keeps items appropriate for Breakfast, Lunch, Snack, etc."""
        return df[df['Ideal_Meal_Time'].str.contains(meal_type, na=False, case=False)]

    def generate_meal(self, meal_type, allergies):
        """Builds a complete, 5-component balanced plate."""
        
        # 1. Select the Base (Carbs/Energy)
        safe_bases = self._filter_by_time(self._filter_allergies(self.base_df, allergies), meal_type)
        if safe_bases.empty:
            return {"error": f"No valid base found for {meal_type}."}
        selected_base = safe_bases.sample(1).iloc[0]

        # 2. Select the Protein (Growth)
        safe_proteins = self._filter_by_time(self._filter_allergies(self.proteins_df, allergies), meal_type)
        selected_protein = safe_proteins.sample(1).iloc[0] if not safe_proteins.empty else None

        # 3. Select 1 Vegetable (Immunity)
        safe_veggies = self._filter_by_time(self._filter_allergies(self.veggies_df, allergies), meal_type)
        selected_veg = safe_veggies.sample(1).iloc[0] if not safe_veggies.empty else None

        # 4. Select Dairy/Crunch (The "Fixer" / Calorie Booster)
        safe_dairy = self._filter_by_time(self._filter_allergies(self.dairy_df, allergies), meal_type)
        selected_dairy = safe_dairy.sample(1).iloc[0] if not safe_dairy.empty else None

        # 5. Select Fruit/Sweet (The "Reward" / Micronutrients)
        safe_fruits = self._filter_by_time(self._filter_allergies(self.fruits_df, allergies), meal_type)
        selected_fruit = safe_fruits.sample(1).iloc[0] if not safe_fruits.empty else None

        # Calculate Total Calories from all 5 components
        total_cals = int(selected_base.get('Calories (kcal)', 0))
        components = {
            "base": selected_base['Item Name'],
            "protein": "None",
            "vegetable": "None",
            "dairy_or_crunch": "None",
            "fruit_or_sweet": "None"
        }

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