class PediatricHealthCalculator:
    @staticmethod
    def calculate_eer(age_months: int, weight_kg: float, height_cm: float, gender: str, activity_level: str) -> int:
        """
        Calculates the Estimated Energy Requirement (EER) using Institute of Medicine (IOM) formulas.
        """
        age_years = age_months / 12.0
        height_m = height_cm / 100.0
        
        # Determine Physical Activity (PA) Coefficient
        # Simplified mapping for research purposes
        pa = 1.0 # Sedentary default
        if activity_level.lower() == "active":
            pa = 1.26 if gender.lower() == "male" else 1.31
        elif activity_level.lower() == "very active":
            pa = 1.42 if gender.lower() == "male" else 1.56

        # IOM Equations
        if gender.lower() == "male":
            eer = 88.5 - (61.9 * age_years) + pa * ((26.7 * weight_kg) + (903 * height_m)) + 20
        else:
            eer = 135.3 - (30.8 * age_years) + pa * ((10.0 * weight_kg) + (934 * height_m)) + 20
            
        return int(round(eer))