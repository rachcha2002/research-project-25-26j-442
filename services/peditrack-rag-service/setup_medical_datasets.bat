@echo off
REM Quick setup script for medical datasets integration

echo ========================================
echo Medical Datasets Integration Setup
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo ERROR: Virtual environment not found!
    echo Please run init.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install additional dependencies
echo.
echo Installing required packages...
pip install requests tqdm datasets

REM Create necessary directories
echo.
echo Creating directories...
if not exist "data\raw_datasets" mkdir data\raw_datasets
if not exist "data\raw_datasets\meddialog" mkdir data\raw_datasets\meddialog
if not exist "data\raw_datasets\meditod" mkdir data\raw_datasets\meditod
if not exist "data\raw_datasets\definedai" mkdir data\raw_datasets\definedai
if not exist "data\processed" mkdir data\processed

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Download datasets:
echo    python scripts\download_medical_datasets.py --dataset all
echo.
echo 2. Preprocess datasets:
echo    python scripts\preprocess_medical_datasets.py --dataset all
echo.
echo 3. Ingest into RAG:
echo    python scripts\ingest_medical_datasets.py
echo.
echo For detailed instructions, see MEDICAL_DATASETS_INTEGRATION.md
echo.
pause
