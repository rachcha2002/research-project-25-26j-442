"""
Feature preprocessing for PediTrack ML models.

Both models were trained with features normalized to [0, 1] using min-max scaling
over typical pediatric ranges. This module replicates that transformation at
inference time so the raw MongoDB values feed in correctly.
"""

import numpy as np

# ─────────────────────────────────────────────────────────────────────────────
# FEATURE RANGES (min, max) — match training data distributions
# ─────────────────────────────────────────────────────────────────────────────

DNN_FEATURE_RANGES = {
    "height_cm":               (40.0,  130.0),
    "weight_kg":               (2.0,   35.0),
    "bmi":                     (8.0,   30.0),
    "age_months":              (0.0,   84.0),
    "gender":                  (0.0,   1.0),
    "has_asthma":              (0.0,   1.0),
    "has_food_allergies":      (0.0,   1.0),
    "birth_weight_kg":         (0.5,   6.0),
    "was_premature":           (0.0,   1.0),
    "immunization_complete":   (0.0,   1.0),
    "chronic_conditions_count":(0.0,   10.0),
    "family_income_ratio":     (0.0,   10.0),
    "parent_education":        (1.0,   3.0),
    "health_insurance":        (0.0,   1.0),
    "food_security":           (0.0,   1.0),
}

# DNN feature order — MUST match training column order
DNN_FEATURE_ORDER = list(DNN_FEATURE_RANGES.keys())

LSTM_FEATURE_RANGES_PER_STEP = {
    "height_cm":                  (40.0,  130.0),
    "weight_kg":                  (2.0,   35.0),
    "bmi":                        (8.0,   30.0),
    "has_respiratory_condition":  (0.0,   1.0),
    "has_infection":              (0.0,   1.0),
    "chronic_disease_count":      (0.0,   10.0),
    "on_antibiotics":             (0.0,   1.0),
    "on_steroids":                (0.0,   1.0),
    "medication_count":           (0.0,   20.0),
}

LSTM_FEATURE_ORDER = list(LSTM_FEATURE_RANGES_PER_STEP.keys())


def _minmax(value: float, min_val: float, max_val: float) -> float:
    """Clip and normalise a single value to [0, 1]."""
    clipped = max(min_val, min(max_val, value))
    if max_val == min_val:
        return 0.0
    return (clipped - min_val) / (max_val - min_val)


def normalize_dnn_features(features: dict) -> np.ndarray:
    """
    Convert a dict of 15 raw feature values → float32 numpy array of shape (1, 15).
    Missing keys default to 0 (maps to the min of that feature's range).
    """
    vector = []
    for key in DNN_FEATURE_ORDER:
        raw = features.get(key, 0.0)
        lo, hi = DNN_FEATURE_RANGES[key]
        vector.append(_minmax(float(raw), lo, hi))
    return np.array([vector], dtype=np.float32)  # shape (1, 15)


def normalize_lstm_sequence(sequence: list[list[float]]) -> np.ndarray:
    """
    Convert a list of 3 raw measurement rows (each 9 values) →
    float32 numpy array of shape (1, 3, 9).

    sequence[0] = oldest measurement, sequence[2] = most recent.
    """
    if len(sequence) != 3:
        raise ValueError(f"LSTM requires exactly 3 measurements, got {len(sequence)}")

    normalised = []
    for step in sequence:
        if len(step) != 9:
            raise ValueError(f"Each LSTM step requires 9 features, got {len(step)}")
        step_vec = []
        for i, key in enumerate(LSTM_FEATURE_ORDER):
            lo, hi = LSTM_FEATURE_RANGES_PER_STEP[key]
            step_vec.append(_minmax(float(step[i]), lo, hi))
        normalised.append(step_vec)

    return np.array([normalised], dtype=np.float32)  # shape (1, 3, 9)


def denormalize_growth_output(normalised_output: np.ndarray) -> dict:
    """
    Convert raw model growth-trajectory output back to real-world units.
    Assumes output[0] = height (norm), output[1] = weight (norm), output[2] = bmi (norm)
    """
    h_lo, h_hi = DNN_FEATURE_RANGES["height_cm"]
    w_lo, w_hi = DNN_FEATURE_RANGES["weight_kg"]
    b_lo, b_hi = DNN_FEATURE_RANGES["bmi"]

    pred = normalised_output.flatten()
    height = float(pred[0]) * (h_hi - h_lo) + h_lo
    weight = float(pred[1]) * (w_hi - w_lo) + w_lo
    bmi    = float(pred[2]) * (b_hi - b_lo) + b_lo

    return {
        "height_cm": round(height, 1),
        "weight_kg": round(weight, 2),
        "bmi":       round(bmi, 2),
    }
