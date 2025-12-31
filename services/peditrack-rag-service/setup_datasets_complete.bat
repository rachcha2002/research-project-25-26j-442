@echo off
REM All-in-One Dataset Setup Script
REM Downloads, preprocesses, and ingests medical datasets automatically

echo ========================================
echo All-in-One Dataset Setup
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

echo.
echo Starting complete dataset setup...
echo This will:
echo   1. Download datasets from HuggingFace
echo   2. Preprocess and filter for pediatric content
echo   3. Ingest into RAG vector database
echo.
echo This may take several minutes...
echo.

REM Run the all-in-one script
python scripts\setup_datasets_all_in_one.py

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next step: Start the RAG service
echo   start.bat
echo.
pause
