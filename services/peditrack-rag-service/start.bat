@echo off
REM Activate virtual environment and run the RAG service

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting RAG Service on port 3002...
echo Press Ctrl+C to stop the service
echo.

python main.py
