"""
Pydantic schemas for PediTrack ML service.
All request and response models for /predict/* endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional


# ─────────────────────────────────────────────
# REQUEST SCHEMAS
# ─────────────────────────────────────────────

class SinglePredictRequest(BaseModel):
    """15-feature DNN request — used when baby has <4 measurements."""
    height_cm: float = Field(..., ge=30, le=130, description="Height in cm")
    weight_kg: float = Field(..., ge=1, le=40, description="Weight in kg")
    bmi: float = Field(..., ge=8, le=35, description="BMI (kg/m²)")
    age_months: int = Field(..., ge=0, le=84, description="Age in months")
    gender: int = Field(..., ge=0, le=1, description="1=male, 0=female")
    has_asthma: int = Field(0, ge=0, le=1)
    has_food_allergies: int = Field(0, ge=0, le=1)
    birth_weight_kg: float = Field(3.0, ge=0.3, le=8.0)
    was_premature: int = Field(0, ge=0, le=1)
    immunization_complete: int = Field(1, ge=0, le=1)
    chronic_conditions_count: int = Field(0, ge=0)
    family_income_ratio: float = Field(2.5, description="Default 2.5 if not collected")
    parent_education: int = Field(2, ge=1, le=3, description="1=low, 2=medium, 3=high")
    health_insurance: int = Field(1, ge=0, le=1)
    food_security: int = Field(1, ge=0, le=1, description="1=adequate, 0=inadequate")


class SequencePredictRequest(BaseModel):
    """LSTM request — used when baby has ≥4 measurements. Takes last 3 as sequence."""
    sequence: list[list[float]] = Field(
        ...,
        description="3 measurements × 9 features: [height_cm, weight_kg, bmi, "
                    "has_respiratory, has_infection, chronic_count, "
                    "on_antibiotics, on_steroids, medication_count]"
    )
    age_months: int = Field(..., ge=0, le=84)
    gender: int = Field(..., ge=0, le=1)


class IterativePredictRequest(SequencePredictRequest):
    """Extends LSTM request with multi-step count."""
    steps: int = Field(12, ge=1, le=24, description="Number of months to forecast")


# ─────────────────────────────────────────────
# RESPONSE SCHEMAS
# ─────────────────────────────────────────────

class GrowthPrediction(BaseModel):
    height_cm: float
    weight_kg: float
    bmi: float


class RiskScore(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    level: str  # "low" | "moderate" | "high"
    color: str  # hex color for UI


class RiskScores(BaseModel):
    growth_disorder: RiskScore
    developmental_delay: RiskScore
    nutritional_deficiency: RiskScore
    behavioral_issue: RiskScore


class PredictionResponse(BaseModel):
    model_config = {'protected_namespaces': ()}
    model_used: str  # "DNN" or "LSTM"
    confidence_score: float
    confidence_level: str  # "high" | "medium" | "low"
    growth_prediction: GrowthPrediction
    risk_scores: RiskScores
    health_score: float  # 0-100 composite
    recommendations: list[dict]


class MonthPrediction(BaseModel):
    month: int
    age_months: int
    height_cm: float
    weight_kg: float
    bmi: float
    confidence: float


class IterativePredictionResponse(BaseModel):
    model_config = {'protected_namespaces': ()}
    model_used: str = "LSTM"
    predictions: list[MonthPrediction]
    month_3: Optional[MonthPrediction] = None
    month_6: Optional[MonthPrediction] = None
    month_12: Optional[MonthPrediction] = None
    trajectory: dict  # {months, heights, weights, confidences}
    risk_scores: RiskScores
    health_score: float


class HealthCheckResponse(BaseModel):
    status: str
    models_loaded: dict
    version: str = "1.0.0"
