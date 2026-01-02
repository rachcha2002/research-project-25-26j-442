@echo off
REM Initialize the vector store with sample data

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Initializing vector store with sample pediatric health documents...
echo This will download the embedding model (~90MB) on first run.
echo.

python scripts\init_vector_store.py

echo.
echo Done! You can now start the service with: start.bat
pause
