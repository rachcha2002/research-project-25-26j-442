# PediTrack Health Analytics System: Comprehensive Architecture Deep Dive

This document is the exhaustive architectural whitepaper for the **Health Analytics System** within the PediTrack application. It covers every component, API route, ML mapping, database schema, and User Interface flow down to the precise fields and formulas used.

It is intended for future developers, doctors, and project maintainers who need to understand the exact mechanics of the AI integrations and data pipelines.

---

## 1. System Architecture & Component Interactions

The Health Analytics ecosystem relies on three synchronized tiers:

1.  **Frontend (React Native & Expo Router):** Renders the charts and insight cards. Collects user input via forms.
2.  **Health Analytics Service (Node.js/Express `localhost:5001`):** The orchestration layer. It owns MongoDB CRUD, aggregates raw baby histories, constructs feature vectors, proxy requests to the ML service, and filters raw ML outputs through a Rule-Based Medical Engine.
3.  **ML Inference Service (Python/FastAPI `localhost:5002`):** The mathematics layer. A stateless microservice that loads `.keras` files into RAM, scales arrays, runs predictions, and outputs raw tensors.

### Detailed Workflow: The `GET /api/ai/risks/:babyId` Request Lifecycle
1.  **UI Mount:** User navigates to `/health-analytics/ai-insights/risk-assessment`. React component `RiskAssessmentScreen.tsx` calls `aiService.ts -> getRiskAssessment()`.
2.  **Data Aggregation (Node.js):**
    *   Finds `BabyProfile` (for `DOB`, `prematurity`, `birthWeight`).
    *   Finds all `Measurements`, `HealthRecords`, `Medications`, `FeedingLogs`, and `SleepLogs` from the trailing 30 days.
3.  **Feature Mapping (Node.js):** 
    *   e.g., Maps `feedingLogs` containing `ricePortions`, `proteinMeat`, etc., into a `nutrition_sum` integer. If `sum >= 5`, sets Boolean `food_security` = `1`.
    *   e.g., Scans `Medications` for substring "vitamin". If found, sets `takes_supplements` = `1`.
4.  **Network Transport:** Node.js hits `http://localhost:5002/predict/single` via Axios, passing a JSON block of 15 exact numbers.
5.  **ML Inference (Python):** 
    *   `preprocessing.py` clips all 15 numbers to expected minimums/maximums and MinMax scales them to `[0.0, 1.0]`.
    *   Loads `srilanka_risks.keras` (Deep Neural Network). 
    *   Model outputs 4 activation values (e.g., `[0.12, 0.69, 0.08, 0.22]`).
6.  **Rule Engine (Node.js):** 
    *   Receives `[0.12, 0.69, 0.08, 0.22]`.
    *   Observes Nutrition Risk (`0.69`) is `> 0.60` (High). 
    *   Invokes `generateRecommendations()` to push a strict JSON object: `{ priority: "high", title: "Review Nutrition", icon: "🥦" ... }`.
7.  **Delivery:** Complete JSON returned to React Native for UI rendering.

---

## 2. Directory Structure (Granular)

### A. Frontend: `peditrackv2/`
*   **`app/health-analytics/`**: The Next.js style layout.
    *   `index.tsx`: The primary dashboard landing zone.
    *   `ai-insights/`: Contains `model-performance.tsx` and `risk-assessment.tsx`.
    *   `growth-details/`: Contains `ai-predictions.tsx` and growth charts.
*   **`src/screens/HealthAnalytics/`**: Implementation of the UI.
    *   `AIInsightsScreen.tsx`: Maps 3 core buttons to `/growth-details/ai-predictions`, `/ai-insights/risk-assessment`, and `/ai-insights/model-performance`.
    *   `GrowthScreens/AIPredictionsScreen.tsx`: Implements scrolling cards and maps over `data.recommendations`. Expects `title`, `icon`, and `priority`.
*   **`src/services/`**:
    *   `aiService.ts`: Axios functions targeting `GET /api/ai/predictions/:babyId` and `GET /api/ai/risks/:babyId`.

### B. Health Analytics Backend: `services/health-analytics-service/`
*   **`models/`**: Mongoose Schemas.
    *   See *Section 3* below for exact fields.
*   **`routes/`**:
    *   `ai.js`: Contains `runPrediction(babyId)`, `generateRecommendations(ra)`, and the `trajectory` extrapolation logic.
    *   `measurements.js`: `POST /`, `GET /baby/:id`.
    *   `healthRecords.js`: Manages diseases/conditions.
*   **`services/`**:
    *   `mlService.js`: Defines `predictSingle(features)` and `predictSequence(sequence)`.

### C. Python ML Service: `services/ml-service/`
*   **`app/inference.py`**:
    *   Defines `AttentionSum` Keras Layer to map older Keras 2 Lambda layers gracefully into Keras 3.
    *   Defines `IterativeGrowthPredictor(dnn_path, lstm_path, scaler_path)`.
    *   `_prepare_pic_input()` reshapes `[3, 9]` arrays. Removes `age_months` and `gender` at the last layer before running `pic_growth.keras`.
    *   Applies `inverse_transform` from `pic_scalers.pkl` to convert standard deviation outputs back into CM and KG.
*   **`app/preprocessing.py`**: Specifies exact `min` and `max` limits for all 15 DNN features.

---

## 3. Database Schema Reference (MongoDB)

All schemas use `timestamps: true` (auto `createdAt`, `updatedAt`).

*   **`Measurement`:**
    *   `height: { value: Number, unit: "cm" }`
    *   `weight: { value: Number, unit: "kg" }`
    *   `headCircumference: { value: Number, unit: "cm" }`
    *   `bmi: Number` (Auto-calculated `weight / (height/100)^2` inside Mongoose Pre-Save hook).
    *   `percentiles`: Embedded object storing WHO Z-scores.
*   **`HealthRecord`:**
    *   `temperature: { value: Number, unit: "C" }`
    *   `symptoms: [String]`
    *   `diagnosis: String`
    *   `severity: enum['mild', 'moderate', 'severe', 'High', 'chronic', '']`
    *   `status: enum['monitoring', 'active', 'resolved', 'underTreatment', '']`
    *   `recordType: enum['checkup', 'illness', 'vaccination', 'emergency', 'other']`
*   **`SleepLog`:**
    *   `logs: [{ startTime: Date, endTime: Date }]`
    *   `hours: Number`
    *   `quality: enum['good', 'wakesFrequently', 'difficultyFallingAsleep', 'restless']`
*   **`FeedingLog`:**
    *   String enums for nutrition intake: `ricePortions` ('1', '1.5', '2.5'), `proteinMeat` ('none', '1', '2to3', '3plus'), `milkCups`, `fruitsServings`.

---

## 4. Machine Learning Pipeline Details

### A. Fallback Logic Control (`routes/ai.js`)
*   **Count Measurements:** If a baby has `< 3 measurements`, the LSTM sequence model is bypassed, and the Node.js API will throw a `400 Need Need at least 3 measurements to generate growth predictions`.
*   However, Risk Assessments merely rely on the cross-sectional DNN, so they calculate fine on newer profiles.

### B. DNN Feature Vector (15 Dimensions)
The `srilanka_risks.keras` model expects exactly 15 sequential floats representing real-life conditions:
1.  `height_cm`: (e.g., `85.2`)
2.  `weight_kg`: (e.g., `12.0`)
3.  `bmi`: (e.g., `16.5`)
4.  `age_months`: (e.g., `24`)
5.  `gender`: (Male=`1`, Female=`0`)
6.  `has_asthma`: Derived from string matching "asthma" in `HealthRecords`.
7.  `has_food_allergies`: Derived from string matching "allerg" in `HealthRecords`.
8.  `birth_weight_kg`: From User Service BabyProfile.
9.  `was_premature`: From User Service BabyProfile.
10. `immunization_complete`: Always `1.0` (Statically mapped currently).
11. `chronic_conditions_count`: Integer count of HealthRecords marked 'chronic' or 'High'.
12. `family_income_ratio`: Always `2.5` (Fallback).
13. `parent_education`: Always `2.0` (Fallback).
14. `health_insurance`: Always `1.0` (Fallback).
15. `food_security`: Float `1.0` or `0.0`. Derived by summing valid enum tags on `FeedingLogs` across 9 categories. If sum `>= 5`, equals `1.0`.

### C. Trajectory Extrapolation for React Native
The `.keras` LSTM predict model natively predicts only *one single timestep* into the future (+3 months). 
However, the React Native component (`react-native-chart-kit`) needs a full line-chart dataset.
To bridge this gap, Node.js manually interpolates data in `routes/ai.js`:
```javascript
const dh = (h3 - h0) / 3;  // Monthly Height Delta
const h6 = h3 + dh * 3;    // Month +6
const h9 = h6 + dh * 3;    // Month +9
const h12 = h9 + dh * 3;   // Month +12

trajectory = {
   months: [0, 3, 6, 9, 12],
   heights: [h0, h3, h6, h9, h12], // ... etc
}
```

---

## 5. Medical Rule-Based Engine

To avoid hallucinations, the system uses strict conditional logic to translate ML Risk Scores (`0.0 - 1.0`) into Medical action plans.

Found in: `health-analytics-service/routes/ai.js -> generateRecommendations(ra)`

| Domain (`ra.*`) | Range | Triggered Action | UI Rendering Priority |
| :--- | :--- | :--- | :--- |
| `growth_disorder` | `> 0.60` | "Schedule a consultation with a pediatrician to monitor growth trajectory." | `High` (Yellow) |
| `growth_disorder` | `0.31 - 0.60` | "Continue tracking height and weight monthly..." | `Normal` (Green) |
| `nutritional_deficiency` | `> 0.60` | "Review dietary intake and ensure infant receives adequate iron..." | `High` (Yellow) |
| `developmental_delay` | `> 0.60` | "Discuss developmental milestones (motor and cognitive) with your child's doctor." | `Urgent` (Red) |
| `behavioral_issue` | `> 0.60` | "Monitor sleep quality and daily behavior patterns closely." | `High` (Yellow) |
| (All Risks) | `< 0.30` | "Maintain current healthy routines and attend scheduled checkups." | `Normal` (Green) |

This array of Objects is passed inside the `/api/ai/risks/` and `/api/ai/predictions/` responses under the `recommendations: []` key. React Native immediately unpacks `.priority` to assign Border Colors and Tailwind-style hex codes to the cards on screen.
