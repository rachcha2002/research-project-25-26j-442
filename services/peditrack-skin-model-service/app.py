import json
import io
import os
import pickle
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image


DEFAULT_MODEL_FILE = "peditrack_condition_classifier_final.keras"
FALLBACK_MODEL_FILE = "best_condition_model.keras"
DEFAULT_IMAGE_SIZE = (224, 224)


def _resolve_model_dir() -> Path:
    raw = os.getenv("MODEL_DIR", "")
    if raw:
        return Path(raw).expanduser().resolve()
    return (Path(__file__).parent / "model-artifacts").resolve()


MODEL_DIR = _resolve_model_dir()
MODEL_FILE = os.getenv("MODEL_FILE", DEFAULT_MODEL_FILE)
MODEL_VERSION = os.getenv("MODEL_VERSION", "1.0.0")


def _load_model() -> tf.keras.Model:
    primary = MODEL_DIR / MODEL_FILE
    fallback = MODEL_DIR / FALLBACK_MODEL_FILE

    if primary.exists():
        model_path = primary
    elif fallback.exists():
        model_path = fallback
    else:
        # Backward-compatible search for legacy .h5 names.
        legacy_primary = MODEL_DIR / "peditrack_condition_classifier_final.h5"
        legacy_fallback = MODEL_DIR / "best_condition_model.h5"
        if legacy_primary.exists():
            model_path = legacy_primary
        elif legacy_fallback.exists():
            model_path = legacy_fallback
        else:
            raise FileNotFoundError(
                "No model file found. Expected one of: "
                f"{primary}, {fallback}, {legacy_primary}, {legacy_fallback}."
            )

    return tf.keras.models.load_model(str(model_path))


def _load_encoder() -> Any:
    encoder_path = MODEL_DIR / "condition_encoder.pkl"
    if not encoder_path.exists():
        return None

    with open(encoder_path, "rb") as f:
        return pickle.load(f)


def _load_mapping() -> dict:
    mapping_path = MODEL_DIR / "condition_mapping.json"
    if not mapping_path.exists():
        return {}

    with open(mapping_path, "r", encoding="utf-8") as f:
        return json.load(f)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(image_bytes))

    image = image.convert("RGB")
    image = image.resize(DEFAULT_IMAGE_SIZE)
    arr = np.array(image, dtype=np.float32)

    # EfficientNet preprocessing: scales input as expected by model.
    arr = tf.keras.applications.efficientnet.preprocess_input(arr)
    return arr


model = _load_model()
encoder = _load_encoder()
class_mapping = _load_mapping()


def _class_names() -> list[str]:
    if encoder is not None and hasattr(encoder, "classes_"):
        return [str(c) for c in encoder.classes_]

    # Supports mapping file shape: {"classes": [...], "num_classes": N}
    if isinstance(class_mapping, dict) and isinstance(class_mapping.get("classes"), list):
        return [str(c) for c in class_mapping["classes"]]

    return []


app = FastAPI(title="PediTrack Skin Model API", version="1.0.0")


@app.get("/health")
def health():
    classes = _class_names()
    return {
        "status": "healthy",
        "model": "efficientnet-b0",
        "version": MODEL_VERSION,
        "model_dir": str(MODEL_DIR),
        "label_source": "encoder" if encoder is not None else "condition_mapping.json",
        "class_count": len(classes),
    }


@app.post("/predict-skin")
async def predict_skin(image: UploadFile = File(...)):
    if image.content_type not in {"image/jpeg", "image/jpg", "image/png", "image/webp"}:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty image")

    try:
        img = preprocess_image(raw)
        batch = np.expand_dims(img, axis=0)

        preds = model.predict(batch, verbose=0)[0]
        top_idx = int(np.argmax(preds))
        confidence = float(preds[top_idx])

        classes = _class_names()
        if not classes:
            raise ValueError(
                "No class labels available. Add condition_encoder.pkl or define classes in condition_mapping.json"
            )

        if len(classes) != len(preds):
            raise ValueError(
                f"Class count mismatch: labels={len(classes)} vs model_outputs={len(preds)}"
            )

        class_name = classes[top_idx]
        mapped_name = class_name

        top3_idx = np.argsort(preds)[-3:][::-1]
        top3 = []
        for idx in top3_idx:
            label = classes[int(idx)]
            top3.append(
                {
                    "class": label,
                    "confidence": float(preds[int(idx)]),
                }
            )

        return {
            "predicted_class": mapped_name,
            "confidence": confidence,
            "model": "efficientnet-b0",
            "version": MODEL_VERSION,
            "labels": classes,
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
