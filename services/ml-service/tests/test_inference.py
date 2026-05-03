"""
tests/test_inference.py
Unit tests for app/inference.py — the PediTrackPredictor class.

All Keras model loading and pickle.load calls are mocked so these tests
run instantly without .keras files present.
"""

import pytest
import numpy as np
from unittest.mock import MagicMock, patch, mock_open


# ─────────────────────────────────────────────────────────────────────────────
# Helpers — build a PediTrackPredictor with fully mocked internals
# ─────────────────────────────────────────────────────────────────────────────

def _identity_transform(x):
    """Scaler transform stub — returns input unchanged (no-op scaling)."""
    return x


def _make_mock_scaler(transform_fn=None):
    """Create a scikit-learn-like scaler mock."""
    scaler = MagicMock()
    scaler.transform.side_effect = transform_fn or _identity_transform
    scaler.inverse_transform.side_effect = _identity_transform
    return scaler


def _build_predictor():
    """
    Build a PediTrackPredictor without loading any real models.
    Returns (predictor, pic_model_mock, risk_model_mock).
    """
    from app.inference import PediTrackPredictor

    predictor = PediTrackPredictor.__new__(PediTrackPredictor)

    # Mock scalers
    predictor.pic_scalers = {
        "anthropometric_scaler": _make_mock_scaler(),
        "health_scaler": _make_mock_scaler(),
    }
    predictor.risk_scalers = {
        "lstm_scalers": [_make_mock_scaler() for _ in range(9)],
        "dnn_scaler": _make_mock_scaler(),
    }

    # Mock Keras models
    pic_model  = MagicMock()
    risk_model = MagicMock()
    predictor.pic_model  = pic_model
    predictor.risk_model = risk_model

    return predictor, pic_model, risk_model


# ─────────────────────────────────────────────────────────────────────────────
# _prepare_pic_input() — sequence preparation for the growth model
# ─────────────────────────────────────────────────────────────────────────────

class TestPreparePicInput:
    """Tests for the LSTM sequence preparation method."""

    def _meas(self, age, h, w, bmi):
        return {"age_months": age, "height_cm": h, "weight_kg": w, "bmi": bmi}

    def test_output_shape_is_1_3_9(self):
        """Always returns shape (1, 3, 9) regardless of input count."""
        predictor, _, _ = _build_predictor()
        baby_data = {"measurements": [self._meas(6, 65, 7.5, 17.8)] * 3}
        result = predictor._prepare_pic_input(baby_data)
        assert result.shape == (1, 3, 9)

    def test_pads_to_3_rows_when_only_1_measurement(self):
        """When fewer than 3 measurements exist, zero-pads to reach length 3."""
        predictor, _, _ = _build_predictor()
        baby_data = {"measurements": [self._meas(6, 65, 7.5, 17.8)]}
        result = predictor._prepare_pic_input(baby_data)
        assert result.shape == (1, 3, 9)
        # First two rows should be zero-padded
        assert np.all(result[0, 0, :] == 0)
        assert np.all(result[0, 1, :] == 0)

    def test_pads_to_3_rows_when_2_measurements(self):
        predictor, _, _ = _build_predictor()
        baby_data = {"measurements": [self._meas(6, 65, 7.5, 17.8), self._meas(9, 68, 8.5, 18.4)]}
        result = predictor._prepare_pic_input(baby_data)
        assert result.shape == (1, 3, 9)
        # Only first row should be zero-padded
        assert np.all(result[0, 0, :] == 0)

    def test_uses_last_3_measurements_when_more_provided(self):
        """Only the last 3 measurements are used — earlier ones are discarded."""
        predictor, _, _ = _build_predictor()
        # 5 measurements — only last 3 matter
        measurements = [
            self._meas(3, 60, 6.0, 16.7),
            self._meas(4, 62, 6.5, 16.9),
            self._meas(6, 65, 7.5, 17.8),
            self._meas(9, 68, 8.5, 18.4),
            self._meas(12, 72, 9.2, 17.7),
        ]
        baby_data = {"measurements": measurements}
        result = predictor._prepare_pic_input(baby_data)
        assert result.shape == (1, 3, 9)
        # The last measurement's height_cm (72.0) should appear in the last row
        assert result[0, 2, 0] == pytest.approx(72.0, rel=1e-3)

    def test_output_dtype_is_float32(self):
        predictor, _, _ = _build_predictor()
        baby_data = {"measurements": [self._meas(6, 65, 7.5, 17.8)] * 3}
        result = predictor._prepare_pic_input(baby_data)
        assert result.dtype == np.float32

    def test_defaults_missing_fields_to_zero(self):
        """Measurements missing optional fields (has_asthma etc.) default to 0."""
        predictor, _, _ = _build_predictor()
        baby_data = {"measurements": [{"height_cm": 65.0, "weight_kg": 7.5, "bmi": 17.8}]}
        result = predictor._prepare_pic_input(baby_data)
        # Feature indices 3–8 (health flags) should be 0
        assert result.shape == (1, 3, 9)


# ─────────────────────────────────────────────────────────────────────────────
# _prepare_risk_inputs() — sequence + DNN feature preparation
# ─────────────────────────────────────────────────────────────────────────────

class TestPrepareRiskInputs:

    def _meas(self, age, h, w, bmi):
        return {"age_months": age, "height_cm": h, "weight_kg": w, "bmi": bmi, "gender": 1,
                "has_asthma": 0, "chronic_conditions_count": 0, "food_security": 1, "data_type": 1}

    def test_lstm_output_shape_is_1_2_9(self):
        """LSTM input must always be (1, 2, 9)."""
        predictor, _, _ = _build_predictor()
        baby_data = {"measurements": [self._meas(6, 65, 7.5, 17.8), self._meas(9, 68, 8.5, 18.4)]}
        lstm, dnn = predictor._prepare_risk_inputs(baby_data)
        assert lstm.shape == (1, 2, 9)

    def test_dnn_output_shape_is_1_19(self):
        """DNN input must always be (1, 19) — one row of 19 static features."""
        predictor, _, _ = _build_predictor()
        baby_data = {"measurements": [self._meas(6, 65, 7.5, 17.8), self._meas(9, 68, 8.5, 18.4)]}
        lstm, dnn = predictor._prepare_risk_inputs(baby_data)
        assert dnn.shape == (1, 19)

    def test_pads_lstm_to_2_when_only_1_measurement(self):
        """Zero-pads the LSTM sequence to length 2."""
        predictor, _, _ = _build_predictor()
        baby_data = {"measurements": [self._meas(6, 65, 7.5, 17.8)]}
        lstm, _ = predictor._prepare_risk_inputs(baby_data)
        assert lstm.shape == (1, 2, 9)
        # First row should be zero-padded
        assert np.all(lstm[0, 0, :] == 0)


# ─────────────────────────────────────────────────────────────────────────────
# predict() — integration of both models
# ─────────────────────────────────────────────────────────────────────────────

class TestPredictMethod:

    def _make_risk_preds(self, values=(0.2, 0.15, 0.3, 0.1)):
        """Produce a list of 5 fake risk model outputs (index 0 = auxiliary)."""
        outputs = [np.array([[0.5]])]  # auxiliary output (ignored)
        for v in values:
            outputs.append(np.array([[v]]))
        return outputs

    def test_predict_with_3_measurements_returns_growth_forecast(self):
        predictor, pic_model, risk_model = _build_predictor()

        # Growth model returns [growth_trajectory, ...] format
        pic_model.predict.return_value = [
            np.array([[72.0, 9.5, 18.2]]),  # growth_trajectory
        ]
        risk_model.predict.return_value = self._make_risk_preds()

        baby_data = {
            "measurements": [
                {"age_months": 6, "height_cm": 65, "weight_kg": 7.5, "bmi": 17.8,
                 "has_asthma": 0, "chronic_conditions_count": 0, "takes_supplements": 0},
                {"age_months": 9, "height_cm": 68, "weight_kg": 8.5, "bmi": 18.4,
                 "has_asthma": 0, "chronic_conditions_count": 0, "takes_supplements": 0},
                {"age_months": 12, "height_cm": 72, "weight_kg": 9.2, "bmi": 17.7,
                 "has_asthma": 0, "chronic_conditions_count": 0, "takes_supplements": 0},
            ]
        }

        result = predictor.predict(baby_data)

        assert result["growth_forecast"] is not None
        assert "next_height" in result["growth_forecast"]
        assert "next_weight" in result["growth_forecast"]

    def test_predict_with_2_measurements_returns_no_growth(self):
        predictor, pic_model, risk_model = _build_predictor()
        risk_model.predict.return_value = self._make_risk_preds()

        baby_data = {
            "measurements": [
                {"age_months": 6, "height_cm": 65, "weight_kg": 7.5, "bmi": 17.8,
                 "has_asthma": 0, "chronic_conditions_count": 0, "takes_supplements": 0},
                {"age_months": 9, "height_cm": 68, "weight_kg": 8.5, "bmi": 18.4,
                 "has_asthma": 0, "chronic_conditions_count": 0, "takes_supplements": 0},
            ]
        }

        result = predictor.predict(baby_data)

        assert result["growth_forecast"] is None
        assert result["risk_assessment"] is not None

    def test_predict_with_1_measurement_returns_both_none(self):
        predictor, _, _ = _build_predictor()

        baby_data = {
            "measurements": [
                {"age_months": 6, "height_cm": 65, "weight_kg": 7.5, "bmi": 17.8,
                 "has_asthma": 0, "chronic_conditions_count": 0, "takes_supplements": 0},
            ]
        }

        result = predictor.predict(baby_data)

        assert result["growth_forecast"]  is None
        assert result["risk_assessment"]  is None
        assert result["health_score"]     is None

    def test_health_score_formula(self):
        """health_score = int((1 - avg_risk) * 100)"""
        # avg of 0.2, 0.1, 0.3, 0.1 = 0.175 → int((1-0.175)*100) = 82
        predictor, _, risk_model = _build_predictor()
        risk_model.predict.return_value = self._make_risk_preds((0.2, 0.1, 0.3, 0.1))

        # Force growth forecast to None (only 2 measurements)
        baby_data = {
            "measurements": [
                {"age_months": 6, "height_cm": 65, "weight_kg": 7.5, "bmi": 17.8,
                 "has_asthma": 0, "chronic_conditions_count": 0, "takes_supplements": 0},
                {"age_months": 9, "height_cm": 68, "weight_kg": 8.5, "bmi": 18.4,
                 "has_asthma": 0, "chronic_conditions_count": 0, "takes_supplements": 0},
            ]
        }

        result = predictor.predict(baby_data)
        expected_score = int((1 - 0.175) * 100)  # 82
        assert result["health_score"] == expected_score

    def test_raises_when_risk_model_has_wrong_output_count(self):
        """Should raise RuntimeError if srilanka_risks returns fewer than 5 tensors."""
        predictor, _, risk_model = _build_predictor()
        # Only 3 outputs — should trigger validation guard
        risk_model.predict.return_value = [np.array([[0.5]]), np.array([[0.2]]), np.array([[0.3]])]

        baby_data = {
            "measurements": [
                {"age_months": 6, "height_cm": 65, "weight_kg": 7.5, "bmi": 17.8,
                 "has_asthma": 0, "chronic_conditions_count": 0, "takes_supplements": 0},
                {"age_months": 9, "height_cm": 68, "weight_kg": 8.5, "bmi": 18.4,
                 "has_asthma": 0, "chronic_conditions_count": 0, "takes_supplements": 0},
            ]
        }

        with pytest.raises(RuntimeError, match="output tensors"):
            predictor.predict(baby_data)

    def test_result_always_has_min_measurement_hints(self):
        """Both hint keys are always present regardless of measurement count."""
        predictor, _, _ = _build_predictor()
        result = predictor.predict({"measurements": []})
        assert result["min_measurements_for_growth"] == 3
        assert result["min_measurements_for_risks"]  == 2
