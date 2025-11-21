#!/bin/bash
# Quick Start Script for PediTrack Chat Service (Linux/Mac)
# This script helps you get started quickly

echo ""
echo "========================================"
echo "PediTrack Chat Service - Quick Start"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[1/4] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo "     Dependencies installed successfully!"
else
    echo "[1/4] Dependencies already installed"
fi

echo ""
echo "[2/4] Checking environment configuration..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "     .env file not found!"
    echo "     Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "     IMPORTANT: Please edit .env and add your OpenAI API key!"
    echo "     Open .env and replace 'your_openai_api_key_here' with your actual key"
    echo ""
    echo "     Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter to continue..."
else
    echo "     .env file found"
fi

echo ""
echo "[3/4] Configuration Summary"
echo "     - Service will run on: http://localhost:3001"
echo "     - Environment: development"
echo "     - Default provider: OpenAI"
echo ""

echo "[4/4] Starting the service..."
echo ""
echo "========================================"
echo "Service is starting..."
echo "Press Ctrl+C to stop the service"
echo "========================================"
echo ""

# Start the service
npm run dev
