"""
tests/test_predict_endpoint.py
Tests for POST /predict — the unified two-model prediction endpoint.
Uses the mocked `client` + data fixtures from conftest.py.
"""

import pytest


# ─────────────────────────────────────────────────────────────────────────────
# Happy path — 3 measurements (both models should fire)
# ─────────────────────────────────────────────────────────────────────────────

class TestPredictWith3Measurements:
    """When baby has >= 3 measurements both growth_forecast and risk_assessment must be populated."""

    def test_returns_200(self, client, baby_3_measurements):
        response = client.post("/predict", json=baby_3_measurements)
        assert response.status_code == 200

    def test_growth_forecast_is_not_none(self, client, baby_3_measurements):
        data = client.post("/predict", json=baby_3_measurements).json()
        assert data["growth_forecast"] is not None

    def test_growth_forecast_has_required_keys(self, client, baby_3_measurements):
        gf = client.post("/predict", json=baby_3_measurements).json()["growth_forecast"]
        assert "next_height" in gf
        assert "next_weight" in gf
        assert "next_bmi" in gf

    def test_growth_forecast_values_are_numeric(self, client, baby_3_measurements):
        gf = client.post("/predict", json=baby_3_measurements).json()["growth_forecast"]
        assert isinstance(gf["next_height"], (int, float))
        assert isinstance(gf["next_weight"], (int, float))
        assert isinstance(gf["next_bmi"],    (int, float))

    def test_growth_forecast_height_is_positive(self, client, baby_3_measurements):
        gf = client.post("/predict", json=baby_3_measurements).json()["growth_forecast"]
        assert gf["next_height"] > 0

    def test_risk_assessment_is_not_none(self, client, baby_3_measurements):
        data = client.post("/predict", json=baby_3_measurements).json()
        assert data["risk_assessment"] is not None

    def test_risk_assessment_has_four_categories(self, client, baby_3_measurements):
        ra = client.post("/predict", json=baby_3_measurements).json()["risk_assessment"]
        for key in ["growth_disorder", "developmental_delay", "nutritional_deficiency", "behavioral_issue"]:
            assert key in ra

    def test_risk_scores_in_0_to_1_range(self, client, baby_3_measurements):
        ra = client.post("/predict", json=baby_3_measurements).json()["risk_assessment"]
        for score in ra.values():
            assert 0.0 <= score <= 1.0, f"Risk score out of range: {score}"

    def test_health_score_in_0_to_100_range(self, client, baby_3_measurements):
        health_score = client.post("/predict", json=baby_3_measurements).json()["health_score"]
        assert isinstance(health_score, (int, float))
        assert 0 <= health_score <= 100

    def test_response_contains_min_measurement_hints(self, client, baby_3_measurements):
        data = client.post("/predict", json=baby_3_measurements).json()
        assert "min_measurements_for_growth" in data
        assert "min_measurements_for_risks"  in data
        assert data["min_measurements_for_growth"] == 3
        assert data["min_measurements_for_risks"]  == 2


# ─────────────────────────────────────────────────────────────────────────────
# 2 measurements — risk assessment only, no growth forecast
# ─────────────────────────────────────────────────────────────────────────────

class TestPredictWith2Measurements:
    """With 2 measurements: risk_assessment present, growth_forecast absent."""

    def test_returns_200(self, client, baby_2_measurements, mock_predictor):
        mock_predictor.predict.return_value = {
            "growth_forecast": None,
            "risk_assessment": {
                "growth_disorder": 0.2, "developmental_delay": 0.1,
                "nutritional_deficiency": 0.3, "behavioral_issue": 0.15,
            },
            "health_score": 79,
            "min_measurements_for_growth": 3,
            "min_measurements_for_risks":  2,
        }
        response = client.post("/predict", json=baby_2_measurements)
        assert response.status_code == 200

    def test_growth_forecast_is_none(self, client, baby_2_measurements, mock_predictor):
        mock_predictor.predict.return_value = {
            "growth_forecast": None,
            "risk_assessment": {
                "growth_disorder": 0.2, "developmental_delay": 0.1,
                "nutritional_deficiency": 0.3, "behavioral_issue": 0.15,
            },
            "health_score": 79,
            "min_measurements_for_growth": 3,
            "min_measurements_for_risks":  2,
        }
        data = client.post("/predict", json=baby_2_measurements).json()
        assert data["growth_forecast"] is None

    def test_risk_assessment_present(self, client, baby_2_measurements, mock_predictor):
        mock_predictor.predict.return_value = {
            "growth_forecast": None,
            "risk_assessment": {
                "growth_disorder": 0.2, "developmental_delay": 0.1,
                "nutritional_deficiency": 0.3, "behavioral_issue": 0.15,
            },
            "health_score": 79,
            "min_measurements_for_growth": 3,
            "min_measurements_for_risks":  2,
        }
        data = client.post("/predict", json=baby_2_measurements).json()
        assert data["risk_assessment"] is not None


# ─────────────────────────────────────────────────────────────────────────────
# 1 measurement — both models return None
# ─────────────────────────────────────────────────────────────────────────────

class TestPredictWith1Measurement:
    """With only 1 measurement: both growth_forecast and risk_assessment must be None."""

    def _setup(self, mock_predictor):
        mock_predictor.predict.return_value = {
            "growth_forecast": None,
            "risk_assessment": None,
            "health_score": None,
            "min_measurements_for_growth": 3,
            "min_measurements_for_risks":  2,
        }

    def test_returns_200(self, client, baby_1_measurement, mock_predictor):
        self._setup(mock_predictor)
        assert client.post("/predict", json=baby_1_measurement).status_code == 200

    def test_growth_forecast_is_none(self, client, baby_1_measurement, mock_predictor):
        self._setup(mock_predictor)
        assert client.post("/predict", json=baby_1_measurement).json()["growth_forecast"] is None

    def test_risk_assessment_is_none(self, client, baby_1_measurement, mock_predictor):
        self._setup(mock_predictor)
        assert client.post("/predict", json=baby_1_measurement).json()["risk_assessment"] is None

    def test_health_score_is_none(self, client, baby_1_measurement, mock_predictor):
        self._setup(mock_predictor)
        assert client.post("/predict", json=baby_1_measurement).json()["health_score"] is None


# ─────────────────────────────────────────────────────────────────────────────
# Error handling
# ─────────────────────────────────────────────────────────────────────────────

class TestPredictErrorHandling:

    def test_returns_503_when_predictor_is_none(self, client):
        """Endpoint must return 503 if models failed to load (predictor is None)."""
        import app.main as m
        original = m.predictor
        try:
            m.predictor = None
            response = client.post("/predict", json={"measurements": []})
            assert response.status_code == 503
            assert "not loaded" in response.json()["detail"].lower()
        finally:
            m.predictor = original

    def test_returns_500_when_predictor_raises(self, client, baby_3_measurements, mock_predictor):
        """Endpoint must return 500 and propagate the error message on unexpected exceptions."""
        mock_predictor.predict.side_effect = RuntimeError("scaler shape mismatch")
        response = client.post("/predict", json=baby_3_measurements)
        assert response.status_code == 500
        assert "scaler shape mismatch" in response.json()["detail"]

    def test_predict_with_empty_measurements_returns_200(self, client, mock_predictor):
        """Empty measurements list is valid input — model handles it gracefully."""
        mock_predictor.predict.return_value = {
            "growth_forecast": None, "risk_assessment": None,
            "health_score": None,
            "min_measurements_for_growth": 3, "min_measurements_for_risks": 2,
        }
        response = client.post("/predict", json={"measurements": []})
        assert response.status_code == 200

    def test_predict_with_no_body_returns_error(self, client):
        """Sending no JSON body at all should return a 4xx or 5xx error."""
        response = client.post("/predict")
        assert response.status_code in (400, 422, 500)
