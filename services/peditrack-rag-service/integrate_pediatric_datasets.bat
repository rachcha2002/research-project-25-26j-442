@echo off
REM Download and Integrate Pediatric-Specific Datasets
REM Includes: Symptom-Disease mappings, Symptom Checker, Medical QA

echo ========================================================================
echo PEDIATRIC DATASETS INTEGRATION
echo ========================================================================
echo.
echo This will download and integrate pediatric-specific datasets:
echo   1. Disease-Symptom Dataset (Symptom mappings)
echo   2. AI Symptom Checker (Disease descriptions + precautions)
echo   3. Medical QA Dataset (Pediatric Q^&A pairs)
echo   4. HealthSearchQA (Consumer health questions)
echo.
echo These datasets are perfect for:
echo   - Symptom-based triage
echo   - "When to seek care" logic
echo   - Parent health questions
echo   - Vaccination guidance
echo.
pause

REM Check if virtual environment exists
if not exist "venv\" (
    echo ERROR: Virtual environment not found!
    echo Please run init.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo ========================================================================
echo STEP 1/3: DOWNLOADING PEDIATRIC DATASETS
echo ========================================================================
echo.
echo NOTE: You need a Kaggle account and API token for some datasets
echo If you don't have one, the script will guide you through setup
echo.
python scripts\download_pediatric_datasets.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Some downloads may have failed
    echo You can continue with available datasets or try manual downloads
    echo.
    choice /C YN /M "Continue with preprocessing"
    if errorlevel 2 exit /b 1
)

echo.
echo ========================================================================
echo STEP 2/3: PREPROCESSING DATASETS
echo ========================================================================
echo.
python scripts\preprocess_pediatric_datasets.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Preprocessing failed!
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo STEP 3/3: INGESTING INTO RAG SYSTEM
echo ========================================================================
echo.
python scripts\ingest_full_datasets.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Ingestion failed!
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo SUCCESS! PEDIATRIC DATASETS INTEGRATED
echo ========================================================================
echo.
echo Your RAG service now includes:
echo   ✓ Disease-symptom mappings for triage
echo   ✓ Symptom checker with urgency levels
echo   ✓ Pediatric Q^&A for parent questions
echo   ✓ Health facts and guidance
echo.
echo To start the service:
echo   start.bat
echo.
pause
