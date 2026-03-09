FROM python:3.12-slim

WORKDIR /app

# ── System dependencies ───────────────────────────────────────────────────────
# libgomp1      : OpenMP runtime required by faiss-cpu
# build-essential: needed to compile any C extensions during pip install
# curl          : health-check tooling
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ───────────────────────────────────────────────────────
COPY requirements.txt .

# 1. CPU-only PyTorch first — keeps image ~200 MB instead of 2.5 GB
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 2. Everything else (faiss-cpu, sentence-transformers, fastapi, etc.)
RUN pip install --no-cache-dir -r requirements.txt

# ── Pre-bake model weights ────────────────────────────────────────────────────
# Download embedding + reranker weights NOW during image build so the first
# real request is not delayed 30-60 s by a network download.
# HF_HOME is set so weights land inside the image layer.
ENV HF_HOME=/app/.cache/huggingface
RUN python - <<'EOF'
from sentence_transformers import SentenceTransformer, CrossEncoder
import os
print("Downloading embedding model...")
SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
print("Downloading reranker model...")
CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
print("Models cached.")
EOF

# ── Application code ──────────────────────────────────────────────────────────
COPY . .

# Ensure vector_store directory exists (populated from the COPY above)
RUN mkdir -p /app/vector_store

# ── Runtime config ────────────────────────────────────────────────────────────
ENV PORT=3002
ENV SERVICE_HOST=0.0.0.0
ENV SERVICE_PORT=3002
# Point sentence-transformers to the pre-baked cache
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/huggingface

# Shell form so Railway's injected $PORT is expanded at runtime
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-3002}
