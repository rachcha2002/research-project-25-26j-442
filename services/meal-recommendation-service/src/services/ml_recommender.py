import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

class PediatricMLRecommender:
    def __init__(self, all_foods_df: pd.DataFrame):
        """Initializes the ML Matrix when the server starts."""
        self.df = all_foods_df.copy()
        
        # 1. Clean data to prevent math errors
        self.df['State/Texture'] = self.df['State/Texture'].fillna('Standard')
        self.df['Cost'] = self.df['Cost'].fillna('Medium')
        self.df['Veg/Non-Veg'] = self.df['Veg/Non-Veg'].fillna('Veg')
        
        # 2. Categorical Vectorization (One-Hot Encoding)
        self.cat_matrix = pd.get_dummies(self.df[['State/Texture', 'Cost', 'Veg/Non-Veg']])
        
        # 3. Numerical Scaling (Normalizing macros to a 0-1 scale)
        scaler = MinMaxScaler()
        num_cols = ['Calories (kcal)', 'Protein (g)', 'Carbs (g)']
        self.df[num_cols] = self.df[num_cols].fillna(0)
        self.num_matrix = scaler.fit_transform(self.df[num_cols])
        
        # 4. The Final Feature Space
        self.feature_matrix = np.hstack([self.cat_matrix.values, self.num_matrix])
        
        # Lookup dictionaries
        self.item_names = self.df['Item Name'].tolist()
        self.item_to_idx = {name: idx for idx, name in enumerate(self.item_names)}

    def predict_optimal_food(self, safe_candidates_df: pd.DataFrame, liked_history: list, epsilon: float = 0.15):
        """
        RESEARCH ALGORITHM: epsilon-greedy Content-Based Filtering.
        Returns the best food item and its similarity score (for your graphs).
        """
        if safe_candidates_df.empty:
            return None, 0.0

        # Exploration (15% chance OR if the child has zero history)
        if np.random.rand() < epsilon or not liked_history:
            random_choice = safe_candidates_df.sample(1).iloc
            return random_choice, 0.0 # Score is 0 because it was a random exploration

        # Exploitation (85% chance): Build the Profile Vector
        liked_indices = [self.item_to_idx[i] for i in liked_history if i in self.item_to_idx]
        
        # Fallback if history items aren't in the current DB
        if not liked_indices:
            return safe_candidates_df.sample(1).iloc, 0.0
            
        # Calculate the "Center of Gravity" of their tastes
        user_vector = np.mean(self.feature_matrix[liked_indices], axis=0)
        
        # Filter the matrix to only include the current safe candidates
        safe_names = safe_candidates_df['Item Name'].tolist()
        safe_indices = [self.item_to_idx[name] for name in safe_names if name in self.item_to_idx]
        candidate_matrix = self.feature_matrix[safe_indices]
        
        # Calculate Cosine Similarity
        similarity_scores = cosine_similarity(user_vector.reshape(1, -1), candidate_matrix)
        
        # Pick the mathematical winner
        best_match_idx = np.argmax(similarity_scores)
        best_score = float(similarity_scores[best_match_idx])
        
        return safe_candidates_df.iloc[best_match_idx], best_score