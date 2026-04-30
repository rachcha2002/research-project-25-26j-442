FROM python:3.11-slim-bookworm

WORKDIR /app

# Install system dependencies for OpenCV (libgl1-mesa-glx was removed in Debian Trixie)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install CPU-only PyTorch first (much smaller ~200MB vs 2.5GB)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000

CMD uvicorn src.main:app --host 0.0.0.0 --port $PORT
