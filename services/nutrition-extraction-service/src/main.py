from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import json

from src.schemas import TextScanRequest, ClinicalSafetyResponse, ChildMedicalProfile
from src.yolo_service import YoloVisionService
from src.gemini_service import GeminiClinicalService

yolo_service = YoloVisionService()
gemini_service = GeminiClinicalService()

app = FastAPI(title="Nutrition Extraction Service")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


def _normalize_nutrients(value) -> List[str]:
    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        return list(dict.fromkeys(cleaned))

    if isinstance(value, str):
        tokens = [token.strip() for token in value.replace(";", ",").split(",") if token.strip()]
        return list(dict.fromkeys(tokens))

    return []

# ==========================================
# ENDPOINT 1: TEXT ONLY (Scenario 3)
# Accepts pure JSON. Super fast, no YOLO.
# ==========================================
@app.post("/scan-text", response_model=ClinicalSafetyResponse)
async def scan_food_text(request: TextScanRequest):
    try:
        llm_result = await gemini_service.evaluate_safety_text(request.food_query, request.child_profile)
        
        # 🛡️ THE SAFETY NET: If Gemini returns a list instead of a string, join it!
        identified_food = llm_result.get("verified_food", request.food_query)
        if isinstance(identified_food, list):
            identified_food = ", ".join(identified_food)

        nutrients = _normalize_nutrients(llm_result.get("nutrients", []))
        if not nutrients:
            nutrients = ["Energy"]
        
        return ClinicalSafetyResponse(
            food_identified=identified_food,
            detection_confidence=1.0, 
            nutrients=nutrients,
            safety_status=llm_result.get("safety_status", "Warning"),
            clinical_reasoning=llm_result.get("clinical_reasoning", "Error reading clinical data.")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# ENDPOINT 2: VISION / HYBRID (Scenarios 1 & 2)
# Accepts Multipart Form Data (Image + Profile + Optional Text)
# ==========================================
@app.post("/scan-vision", response_model=ClinicalSafetyResponse)
async def scan_food_vision(
    image: UploadFile = File(...),
    profile_json: str = Form(...),
    user_text_hint: Optional[str] = Form(None) # Make the text completely optional!
):
    if not yolo_service.model:
        raise HTTPException(status_code=503, detail="YOLO Service Offline")

    try:
        profile_data = json.loads(profile_json)
        profile = ChildMedicalProfile(**profile_data)

        img_bytes = await image.read()
        yolo_guess, confidence = yolo_service.detect_food(img_bytes)

        non_food_allowlist = {"optical mouse", "mouse", "keyboard", "phone", "remote", "pen"}  # expand list
        if yolo_guess in non_food_allowlist or confidence < 0.25:
            return ClinicalSafetyResponse(
                food_identified=yolo_guess,
                detection_confidence=round(confidence, 2),
                nutrients=[],
                safety_status="NotFood",
                clinical_reasoning="Detected object is not a food item."
            )

        # Pass the image, the YOLO guess, AND the optional user text to Gemini
        llm_result = await gemini_service.evaluate_safety_vision(
            yolo_guess, profile, img_bytes, user_text_hint
        )

        nutrients = _normalize_nutrients(llm_result.get("nutrients", []))
        if not nutrients:
            nutrients = ["Energy"]

        return ClinicalSafetyResponse(
            food_identified=llm_result.get("verified_food", yolo_guess), 
            detection_confidence=round(confidence, 2), 
            nutrients=nutrients,
            safety_status=llm_result.get("safety_status", "Warning"),
            clinical_reasoning=llm_result.get("clinical_reasoning", "Error reading clinical data.")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
