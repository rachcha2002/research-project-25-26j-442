# PediTrack ML Service

FastAPI service running Keras H5 models for pediatric growth prediction.

## Models
| File | Type | Features | Use Case |
|------|------|----------|---------|
| `cross-sectional_combined_full_final.h5` | DNN | 15 | < 4 measurements |
| `longitudinal_pic_longitudinal_minimal_final.h5` | LSTM | 3×9 | ≥ 4 measurements |

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start service
uvicorn app.main:app --host 0.0.0.0 --port 5003 --reload
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Model load status |
| POST | `/predict/single` | DNN — 15 features |
| POST | `/predict/sequence` | LSTM — 3×9 matrix |
| POST | `/predict/iterative` | LSTM — 12-month forecast |

Interactive docs at: http://localhost:5003/docs

## Test with sample data

```bash
# Health check
curl http://localhost:5003/health

# DNN prediction (baby with 2 measurements)
curl -X POST http://localhost:5002/predict/single \
  -H "Content-Type: application/json" \
  -d '{
    "height_cm": 95.0, "weight_kg": 14.2, "bmi": 15.7,
    "age_months": 36, "gender": 1,
    "has_asthma": 0, "has_food_allergies": 0,
    "birth_weight_kg": 3.2, "was_premature": 0,
    "immunization_complete": 1, "chronic_conditions_count": 0,
    "family_income_ratio": 2.5, "parent_education": 2,
    "health_insurance": 1, "food_security": 1
  }'

# LSTM prediction (baby with 6 measurements)
curl -X POST http://localhost:5002/predict/sequence \
  -H "Content-Type: application/json" \
  -d '{
    "sequence": [
      [92.0, 13.1, 15.5, 0, 0, 0, 0, 0, 0],
      [93.5, 13.5, 15.4, 0, 0, 0, 0, 0, 0],
      [95.0, 14.2, 15.7, 0, 0, 0, 0, 0, 0]
    ],
    "age_months": 36, "gender": 1
  }'
```

## Directory Structure

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py          ← FastAPI app
│   ├── models.py        ← Pydantic schemas
│   ├── inference.py     ← IterativeGrowthPredictor
│   ├── preprocessing.py ← Feature normalization
│   └── who_standards.py ← WHO 2006 LMS tables
├── models/
│   ├── cross-sectional_combined_full_final.h5
│   └── longitudinal_pic_longitudinal_minimal_final.h5
├── requirements.txt
├── .env
└── README.md
```
