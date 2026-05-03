"""
conftest.py — shared pytest fixtures for the PediTrack ML service tests.

How it works:
  • The TestClient triggers the FastAPI lifespan (which loads the Keras models).
  • We patch the PediTrackPredictor constructor so no real .keras files need
    to be present when running in CI or on a dev machine without the models.
  • Each test that needs the real models (live integration) can opt-in by
    using the `real_client` fixture or the @pytest.mark.integration marker.
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


# ─────────────────────────────────────────────────────────────────────────────
# Shared baby data fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def baby_3_measurements():
    """Valid baby payload with 3 measurements — enough for both models."""
    return {
        "measurements": [
            {
                "age_months": 6, "height_cm": 65.0, "weight_kg": 7.5, "bmi": 17.8,
                "gender": 1, "has_asthma": 0, "chronic_conditions_count": 0,
                "food_security": 1, "data_type": 1, "takes_supplements": 0,
            },
            {
                "age_months": 9, "height_cm": 68.0, "weight_kg": 8.5, "bmi": 18.4,
                "gender": 1, "has_asthma": 0, "chronic_conditions_count": 0,
                "food_security": 1, "data_type": 1, "takes_supplements": 0,
            },
            {
                "age_months": 12, "height_cm": 72.0, "weight_kg": 9.2, "bmi": 17.7,
                "gender": 1, "has_asthma": 0, "chronic_conditions_count": 0,
                "food_security": 1, "data_type": 1, "takes_supplements": 0,
            },
        ],
        "rice_adequate": 1, "carbs_adequate": 1, "protein_adequate": 1,
        "eggs_adequate": 1, "dhal_adequate": 1, "milk_adequate": 1,
        "dairy_adequate": 0, "fruits_adequate": 1, "vegetables_adequate": 1,
        "has_food_allergies": 0, "birth_weight_kg": 3.2, "was_premature": 0,
        "immunization_complete": 1, "delayed_walking": 0, "takes_supplements": 0,
        "adequate_sleep": 1, "poor_sleep_quality": 0,
        "hospitalizations_count": 0, "doctor_concern_any": 0,
    }


@pytest.fixture
def baby_2_measurements(baby_3_measurements):
    """Only 2 measurements — sufficient for risk assessment, not growth."""
    data = dict(baby_3_measurements)
    data["measurements"] = baby_3_measurements["measurements"][:2]
    return data


@pytest.fixture
def baby_1_measurement(baby_3_measurements):
    """Only 1 measurement — insufficient for either model."""
    data = dict(baby_3_measurements)
    data["measurements"] = baby_3_measurements["measurements"][:1]
    return data


# ─────────────────────────────────────────────────────────────────────────────
# Mocked client fixture (no real Keras models required)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_predictor():
    """
    A MagicMock that mimics PediTrackPredictor.predict() return value.
    Tests can override mock_predictor.predict.return_value as needed.
    """
    predictor = MagicMock()
    predictor.predict.return_value = {
        "growth_forecast": {"next_height": 75.5, "next_weight": 10.1, "next_bmi": 17.7},
        "risk_assessment": {
            "growth_disorder": 0.15,
            "developmental_delay": 0.10,
            "nutritional_deficiency": 0.20,
            "behavioral_issue": 0.10,
        },
        "health_score": 84,
        "min_measurements_for_growth": 3,
        "min_measurements_for_risks": 2,
    }
    return predictor


@pytest.fixture
def client(mock_predictor):
    """
    FastAPI TestClient with the PediTrackPredictor constructor patched.
    The lifespan handler will set app.state.predictor = mock_predictor.
    """
    with patch("app.inference.PediTrackPredictor", return_value=mock_predictor), \
         patch("app.main.PediTrackPredictor", return_value=mock_predictor):
        import app.main as main_module
        # Manually inject the mock predictor into the module-level variable
        main_module.predictor = mock_predictor
        main_module.models_status = {"pic_growth": True, "srilanka_risks": True}
        yield TestClient(main_module.app)
