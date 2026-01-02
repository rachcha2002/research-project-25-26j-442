@echo off
REM RAG Evaluation Script
REM Evaluates the accuracy of the RAG system

echo ========================================
echo RAG System Accuracy Evaluation
echo ========================================
echo.

REM Activate virtual environment
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Warning: Virtual environment not found
)

REM Run evaluation
echo Running RAG evaluation...
python scripts\evaluate_rag.py --top-k 5

echo.
echo ========================================
echo Evaluation Complete!
echo ========================================
echo.
echo Results saved to: tests\evaluation_results\
echo.
echo To visualize results, run: visualize_evaluation.bat
echo.

pause
