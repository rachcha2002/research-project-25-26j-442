import os
import hashlib
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

MODEL_PATH = "models/recommender.joblib"


def _compute_csv_fingerprint(csv_paths: list) -> str:
    """MD5 hash of sorted CSV modification times — changes when any CSV is updated."""
    mtimes = sorted(
        str(os.path.getmtime(p)) for p in csv_paths if os.path.exists(p)
    )
    return hashlib.md5("".join(mtimes).encode()).hexdigest()


class PediatricMLRecommender:
    def __init__(self, all_foods_df: pd.DataFrame, csv_paths: list = None):
        """
        Loads the feature matrix from disk when the CSV fingerprint matches the
        saved one.  Rebuilds and saves to disk whenever CSVs have changed or the
        model file is missing.
        """
        fingerprint = _compute_csv_fingerprint(csv_paths) if csv_paths else None

        if fingerprint and os.path.exists(MODEL_PATH):
            cached = joblib.load(MODEL_PATH)
            if cached.get("csv_fingerprint") == fingerprint:
                self.feature_matrix = cached["feature_matrix"]
                self.item_names     = cached["item_names"]
                self.item_to_idx    = cached["item_to_idx"]
                print("ML Recommender: loaded feature matrix from cache.")
                return

        # Build from scratch
        self._build_feature_matrix(all_foods_df)

        if fingerprint:
            os.makedirs("models", exist_ok=True)
            joblib.dump(
                {
                    "feature_matrix": self.feature_matrix,
                    "item_names":     self.item_names,
                    "item_to_idx":    self.item_to_idx,
                    "csv_fingerprint": fingerprint,
                },
                MODEL_PATH,
            )
            print("ML Recommender: feature matrix trained and saved to cache.")

    def _build_feature_matrix(self, all_foods_df: pd.DataFrame):
        df = all_foods_df.copy()

        # Fill gaps so one-hot encoding and scaling don't break
        df['State/Texture'] = df['State/Texture'].fillna('Standard')
        df['Cost']          = df['Cost'].fillna('Medium')
        df['Veg/Non-Veg']   = df['Veg/Non-Veg'].fillna('Veg')

        # Categorical vectorisation (one-hot)
        cat_matrix = pd.get_dummies(df[['State/Texture', 'Cost', 'Veg/Non-Veg']])

        # Numerical scaling (0-1)
        num_cols = ['Calories (kcal)', 'Protein (g)', 'Carbs (g)']
        df[num_cols] = df[num_cols].fillna(0)
        num_matrix = MinMaxScaler().fit_transform(df[num_cols])

        self.feature_matrix = np.hstack([cat_matrix.values, num_matrix])
        self.item_names     = df['Item Name'].tolist()
        self.item_to_idx    = {name: idx for idx, name in enumerate(self.item_names)}

    def predict_optimal_food(self, safe_candidates_df: pd.DataFrame, liked_history: list, epsilon: float = 0.15):
        """
        RESEARCH ALGORITHM: epsilon-greedy Content-Based Filtering.
        Returns the best food item and its similarity score.
        """
        if safe_candidates_df.empty:
            return None, 0.0

        # Exploration (15% chance OR child has no history yet)
        if np.random.rand() < epsilon or not liked_history:
            return safe_candidates_df.sample(1).iloc[0], 0.0

        # Exploitation: build profile vector from liked items
        liked_indices = [self.item_to_idx[i] for i in liked_history if i in self.item_to_idx]
        if not liked_indices:
            return safe_candidates_df.sample(1).iloc[0], 0.0

        # Centre-of-gravity of the child's taste profile
        user_vector = np.mean(self.feature_matrix[liked_indices], axis=0)

        safe_names   = safe_candidates_df['Item Name'].tolist()
        safe_indices = [self.item_to_idx[n] for n in safe_names if n in self.item_to_idx]
        if not safe_indices:
            return safe_candidates_df.sample(1).iloc[0], 0.0

        candidate_matrix  = self.feature_matrix[safe_indices]
        similarity_scores = cosine_similarity(user_vector.reshape(1, -1), candidate_matrix)

        best_match_idx = np.argmax(similarity_scores)
        best_score     = float(similarity_scores[0, best_match_idx])

        return safe_candidates_df.iloc[best_match_idx], best_score
