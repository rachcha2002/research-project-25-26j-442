@echo off
REM Complete Dataset Integration - Downloads FULL datasets
REM This script will:
REM   1. Download full datasets from HuggingFace (MedQuad, MedDialog, HealthCareMagic)
REM   2. Preprocess and filter for pediatric content
REM   3. Ingest into RAG vector database

echo ========================================================================
echo FULL DATASET INTEGRATION FOR RAG SERVICE
echo ========================================================================
echo.
echo This will download and process FULL medical datasets:
echo   - MedQuad: 16,000+ medical Q^&A pairs
echo   - MedDialog: 260,000+ doctor-patient conversations
echo   - HealthCareMagic: 100,000+ medical consultations
echo.
echo WARNING: This may take 30-60 minutes and requires several GB of disk space
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
echo STEP 1/3: DOWNLOADING DATASETS
echo ========================================================================
echo.
python scripts\download_full_datasets.py --dataset all

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Download failed!
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo STEP 2/3: PREPROCESSING DATASETS
echo ========================================================================
echo.
echo Filtering for pediatric content...
python scripts\preprocess_full_datasets.py --dataset all

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
echo SUCCESS! FULL DATASET INTEGRATION COMPLETE
echo ========================================================================
echo.
echo Your RAG service is now ready with full medical datasets!
echo.
echo To start the service:
echo   start.bat
echo.
echo To test the service:
echo   curl http://localhost:3002/api/rag/stats
echo.
pause
