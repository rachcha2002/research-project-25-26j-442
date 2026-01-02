@echo off
REM RAG Evaluation Visualization Script
REM Creates visualizations from evaluation results

echo ========================================
echo RAG Evaluation Visualization
echo ========================================
echo.

REM Activate virtual environment
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Warning: Virtual environment not found
)

REM Run visualization
echo Generating visualizations...
python scripts\visualize_evaluation.py

echo.
echo ========================================
echo Visualization Complete!
echo ========================================
echo.
echo Visualizations saved to: tests\evaluation_results\visualizations\
echo.

REM Open the visualizations folder
start tests\evaluation_results\visualizations

pause
