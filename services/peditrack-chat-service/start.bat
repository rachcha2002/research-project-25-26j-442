@echo off
REM Quick Start Script for PediTrack Chat Service
REM This script helps you get started quickly

echo.
echo ========================================
echo PediTrack Chat Service - Quick Start
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [1/4] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo      Dependencies installed successfully!
) else (
    echo [1/4] Dependencies already installed
)

echo.
echo [2/4] Checking environment configuration...

REM Check if .env exists
if not exist ".env" (
    echo      .env file not found!
    echo      Creating .env from .env.example...
    copy .env.example .env > nul
    echo.
    echo      IMPORTANT: Please edit .env and add your OpenAI API key!
    echo      Open .env and replace 'your_openai_api_key_here' with your actual key
    echo.
    echo      Get your API key from: https://platform.openai.com/api-keys
    echo.
    pause
) else (
    echo      .env file found
)

echo.
echo [3/4] Configuration Summary
echo      - Service will run on: http://localhost:3001
echo      - Environment: development
echo      - Default provider: OpenAI
echo.

echo [4/4] Starting the service...
echo.
echo ========================================
echo Service is starting...
echo Press Ctrl+C to stop the service
echo ========================================
echo.

REM Start the service
npm run dev
