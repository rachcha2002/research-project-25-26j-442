# Skin Model API (EfficientNet-B0)

This API serves skin-condition predictions for the risk assessment flow.

## Place Trained Artifacts

Copy these files into `model-artifacts/`:

- `peditrack_condition_classifier_final.keras` (or `best_condition_model.keras`)
- `condition_encoder.pkl`
- `condition_mapping.json` (optional but recommended)

## Environment Variables

- `MODEL_DIR` (optional): path to model artifacts folder
- `MODEL_FILE` (optional): `peditrack_condition_classifier_final.keras` by default
- `MODEL_VERSION` (optional): returned in API response
- `PORT` (optional): API port, default `8008`

## Run Locally

```bash
cd services/peditrack-skin-model-service
python -m venv .venv
# Windows PowerShell
.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8008
```

## Endpoint

- `GET /health`
- `POST /predict-skin` with multipart form field `image`

## Connect to Node Risk Service

In `services/peditrack-risk-assessment-service/.env` set:

```env
SKIN_MODEL_URL=http://127.0.0.1:8008/predict-skin
```
