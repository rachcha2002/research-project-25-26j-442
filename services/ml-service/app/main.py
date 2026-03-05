"""
FastAPI application — PediTrack ML Service (Port 5003).

Endpoints:
  GET  /health              — Model load status
  POST /predict             — Unified API accepting comprehensive BabyData
"""

import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from .inference import PediTrackPredictor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_ROOT       = Path(__file__).resolve().parent.parent
_MODEL_DIR  = _ROOT / "models"

predictor: PediTrackPredictor | None = None
models_status = {"pic_growth": False, "srilanka_risks": False}

@asynccontextmanager
async def lifespan(app: FastAPI):
    global predictor, models_status
    try:
        # Pass the directory directly
        predictor = PediTrackPredictor(models_dir=str(_MODEL_DIR))
        models_status = {"pic_growth": True, "srilanka_risks": True}
        logger.info("✅ ML Service ready — both models loaded")
    except Exception as e:
        logger.error(f"❌ Failed to load models: {e}")
    yield
    logger.info("ML Service shutting down")

app = FastAPI(
    title="PediTrack ML Service",
    description="Two-Model Prediction System (PIC Growth + Sri Lanka Risks)",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["status"])
def health_check():
    """Health check — returns model load status."""
    return {
        "status":        "healthy" if all(models_status.values()) else "degraded",
        "models_loaded": models_status,
        "version":       "2.0.0",
    }


@app.post("/predict", tags=["predictions"])
def predict(body: Dict[str, Any]):
    """
    Unified endpoint for the two-model system.
    Expects a JSON body containing baby profile data and an array of measurements.
    """
    if predictor is None:
        raise HTTPException(status_code=503, detail="Models not loaded")
    try:
        result = predictor.predict(body)
        return result
    except Exception as e:
        logger.error(f"/predict error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
