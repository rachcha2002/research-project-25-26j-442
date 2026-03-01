# PediTrack ML Service Documentation

This document serves as the comprehensive guide specifically for the **Machine Learning Inference Service** within the PediTrack application. It outlines the codebase structure, the responsibilities of each Python file, the endpoints exposed, and exactly how this service integrates with the broader Node.js Health Analytics backend.

---

## 1. Overview

The ML Service is a self-contained Python microservice built using **FastAPI**. It operates independently of the Node.js backend on **Port 5002**. 

Its sole responsibility is *Mathematical Inference*: it loads heavy `.keras` machine learning models into RAM at startup, accepts standardized numerical arrays over HTTP, passes those arrays through the neural networks, and returns the raw mathematical predictions (probabilities and Z-Scores) back to the caller.

It **does not** connect to MongoDB, and it **does not** generate medical text. It purely calculates.

---

## 2. Directory Structure (`services/ml-service/`)

Unlike a dynamic web server, the ML Service codebase is small and intensely math-focused.

```text
services/ml-service/
│
├── app/                        # Main application package
│   ├── __init__.py             # Empty marker
│   ├── main.py                 # FastAPI application, routes, and server configuration
│   ├── inference.py            # Model loading and Keras inference execution
│   ├── preprocessing.py        # Data scaling (StandardScaler & MinMax algorithms)
│   ├── models.py               # Pydantic Schemas (Strict type definitions for JSON)
│   └── who_standards.py        # Hardcoded WHO LMS tables for baseline Z-Score conversions
│
├── models/                     # Trained Machine Learning binaries (the "Brains")
│   ├── pic_growth.keras        # LSTM Recurrent Neural Network (Time-series growth)
│   ├── srilanka_risks.keras    # Deep Neural Network (Instantaneous Risk Assessment)
│   └── pic_scalers.pkl         # Pickled scikit-learn transformers for output un-scaling
│
├── requirements.txt            # Python dependencies (FastAPI, TensorFlow, Uvicorn, Pandas)
└── .env                        # Environment variables (PORT=5002)
```

---

## 3. File-by-File Deep Dive

### `app/main.py`
This is the entry point holding the FastAPI application. It imports the `IterativeGrowthPredictor` singleton.
**Endpoints Exposed:**
*   `GET /health`: Returns `{ status: "healthy", ... }`. Used by Node.js for connection polling.
*   `POST /predict/single`: Endpoint for cross-sectional predictions. Used only for babies with fewer than 3 historical measurements, or for calculating the static 4-domain Risk Assessment.
*   `POST /predict/sequence`: Endpoint for longitudinal predictions. Used specifically for the Growth Trajectory model.
*   `POST /predict/iterative`: Evaluates sequence models recursively (mostly used during offline testing).

### `app/inference.py`
The most critical file in the service. 
*   **Initialization:** At boot, `IterativeGrowthPredictor.__init__()` loads the heavy `pic_growth.keras` and `srilanka_risks.keras` into TensorFlow engine memory. It also unpickles the `pic_scalers.pkl`.
*   **Custom Keras Layers:** Because the models were trained using Keras 2 (with custom Lambda math layers) but the server runs Keras 3, this file defines a custom class `@keras.saving.register_keras_serializable(name="AttentionSum")`. This explicitly tells Keras 3 how to parse the old mathematical weights.
*   **`predict_sequence()` Method:** Receives a [3, 9] shape array from Node.js. It executes `.predict()` on the Keras LSTM model.
*   **Output Inverse Scaling:** The raw output of the LSTM is a standardized mathematical distance (e.g., `-0.435`). `inference.py` explicitly calls `self.pic_scalers['anthropometric_scaler'].inverse_transform()` to convert that arbitrary float back into a real-world Height (e.g., `85.2 cm`) and Weight.

### `app/preprocessing.py`
Before data touches the Neural Network, it must be mapped to float `[0.0, 1.0]`. 
*   Contains dictionaries stating the exact minimum and maximum biological thresholds (e.g., `height_cm: (40.0, 130.0)`).
*   Applies strict Min-Max scaling. If Node.js passes a child whose height is severely outside the normal range, this file aggressively clips it so the ML model does not break.

### `app/models.py`
Contains the strict `Pydantic` validation models. If Node.js accidentally sends a string instead of a float, or sends an array of 8 items instead of 9, FastAPI throws an immediate `422 Unprocessable Entity` error based on these schemas.

---

## 4. How It Integrates with Node.js

The ML Service acts like an advanced calculator for the Node.js API.

### The Request Handshake
When the React Native app asks Node.js for a Risk Assessment, Node.js cannot do the math itself. 
1.  Node.js parses MongoDB strings (like "eats fruits", "sleeps badly") and converts them to binary 0s and 1s.
2.  Node.js creates an exact 15-item JSON Array.
3.  Node.js performs a server-to-server `POST http://localhost:5002/predict/single`.
4.  Python FastAPI routes this to `main.py`, validates it against `models.py`, clips it in `preprocessing.py`, and feeds it to `inference.py`.
5.  Python returns a JSON block back to Node.js containing precisely 4 Risk Scores (`Growth`, `Nutrition`, `Development`, `Behavior`).
6.  Node.js then executes `generateRecommendations()` based on those 4 numbers and answers React Native.

### Handling Network Latency
Because loading a `.keras` file from the hard drive into RAM takes approximately 3-5 seconds, Node.js uses an asynchronous polling mechanism. When Node.js boots up, it pings `GET /health` on the ML Service repeatedly until Python answers `200 OK`. Node.js will cache prediction results for 24 hours to prevent spamming the ML service with heavy tensor calculations on every UI refresh.

---

## 5. Execution Commands / Operations

As a standalone microservice, it has its own deployment lifecycle.

**Starting the Python Service:**
```powershell
# Navigate to the Python microservice folder
cd "d:\Research Project\Repors\research-project-development\services\ml-service"

# Activate the isolated Python standard environment
.\venv\Scripts\activate

# Launch the Uvicorn ASGI Web Server
uvicorn app.main:app --host 0.0.0.0 --port 5002 --reload
```

**Common Flags & Variables:**
*   Setting `$env:TF_ENABLE_ONEDNN_OPTS=0` disables hardware-specific floating-point optimizations that occasionally trigger console warnings on Intel machines.
*   The API interface automatically generates documentation. Navigate to `http://localhost:5002/docs` in your browser to see a Swagger UI where you can manually test submitting arrays to the ML models without using the App.
