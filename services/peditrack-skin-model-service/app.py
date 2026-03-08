import json
import io
import os
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image

# Updated to match the newly exported files
DEFAULT_MODEL_FILE = "skin_condition_model.keras"
DEFAULT_LABELS_FILE = "class_labels.json"
DEFAULT_IMAGE_SIZE = (224, 224)


def _resolve_model_dir() -> Path:
    raw = os.getenv("MODEL_DIR", "")
    if raw:
        return Path(raw).expanduser().resolve()
    # Default to a 'models' directory or the current directory
    return (Path(__file__).parent / "models").resolve()


MODEL_DIR = _resolve_model_dir()
MODEL_FILE = os.getenv("MODEL_FILE", DEFAULT_MODEL_FILE)
LABELS_FILE = os.getenv("LABELS_FILE", DEFAULT_LABELS_FILE)
MODEL_VERSION = os.getenv("MODEL_VERSION", "2.0.0")


def _load_model() -> tf.keras.Model:
    model_path = MODEL_DIR / MODEL_FILE
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found at: {model_path}")

    print(f"⚙️ Loading model from {model_path}...")
    return tf.keras.models.load_model(str(model_path))


def _load_labels() -> dict:
    labels_path = MODEL_DIR / LABELS_FILE
    
    if not labels_path.exists():
        print(f"⚠️ Warning: Labels file not found at {labels_path}")
        return {}

    with open(labels_path, "r", encoding="utf-8") as f:
        # Expected format: {"0": "Acne_Rosacea", "1": "Bullous_Disease", ...}
        return json.load(f)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(image_bytes))

    # Ensure 3 channels
    image = image.convert("RGB")
    image = image.resize(DEFAULT_IMAGE_SIZE)
    
    # Standard normalization for MobileNetV2 (matching the ImageDataGenerator)
    arr = np.array(image, dtype=np.float32) / 255.0
    
    return arr


# Initialize model and labels on startup
model = _load_model()
class_labels_dict = _load_labels()


app = FastAPI(title="PediTrack Skin Model API", version=MODEL_VERSION)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "MobileNetV2",
        "version": MODEL_VERSION,
        "model_dir": str(MODEL_DIR),
        "class_count": len(class_labels_dict),
    }


@app.post("/predict-skin")
async def predict_skin(image: UploadFile = File(...)):
    if image.content_type not in {"image/jpeg", "image/jpg", "image/png", "image/webp"}:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty image")

    try:
        # Preprocess exactly as trained
        img = preprocess_image(raw)
        batch = np.expand_dims(img, axis=0)

        # Make prediction
        preds = model.predict(batch, verbose=0)[0]
        top_idx = int(np.argmax(preds))
        confidence = float(preds[top_idx])

        if not class_labels_dict:
            raise ValueError(
                "No class labels available. Ensure class_labels.json is loaded."
            )

        if len(class_labels_dict) != len(preds):
            raise ValueError(
                f"Class count mismatch: labels={len(class_labels_dict)} vs model_outputs={len(preds)}"
            )

        predicted_class = class_labels_dict.get(str(top_idx), f"Unknown_{top_idx}")

        # Gather top 3 predictions for nuanced risk scoring
        top3_idx = np.argsort(preds)[-3:][::-1]
        top3 = []
        for idx in top3_idx:
            top3.append(
                {
                    "class": class_labels_dict.get(str(idx), f"Unknown_{idx}"),
                    "confidence": float(preds[int(idx)]),
                }
            )

        # Output perfectly matches what the Node.js backend expects
        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "model": "MobileNetV2",
            "version": MODEL_VERSION,
            "labels": list(class_labels_dict.values()),
            "top3": top3,
        }
        
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8008"))
    uvicorn.run(app, host="0.0.0.0", port=port)