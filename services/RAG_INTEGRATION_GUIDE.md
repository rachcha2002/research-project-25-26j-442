# RAG Integration Guide

## Overview

The PediTrack system now includes a RAG (Retrieval-Augmented Generation) microservice that enhances chat responses with relevant pediatric health information from a curated knowledge base.

## Architecture

```
React Native App (Port 8081)
        ↓
Express Chat Service (Port 3001)
        ↓
    ┌───┴───┐
    ↓       ↓
RAG Service  LLM API
(Port 3002)  (OpenAI/etc)
```

## Setup Instructions

### 1. Set Up RAG Service

```bash
cd services/peditrack-rag-service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Initialize vector store with sample data
python scripts/init_vector_store.py
```

### 2. Configure Chat Service

Edit `services/peditrack-chat-service/.env`:

```bash
# Enable RAG
RAG_SERVICE_URL=http://localhost:3002
RAG_ENABLED=true
RAG_TOP_K=5
```

### 3. Start Both Services

**Terminal 1 - RAG Service:**
```bash
cd services/peditrack-rag-service
venv\Scripts\activate
uvicorn main:app --reload --port 3002
```

**Terminal 2 - Chat Service:**
```bash
cd services/peditrack-chat-service
npm run dev
```

## How It Works

1. **User sends a message** via the React Native app
2. **Chat service receives** the message
3. **RAG service is queried** to retrieve relevant pediatric health documents
4. **Context is injected** into the LLM prompt
5. **LLM generates response** using both its knowledge and the retrieved context
6. **Response is sent back** to the user

## Testing

### Test RAG Service Directly

```bash
curl -X POST http://localhost:3002/api/rag/retrieve \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"What are the symptoms of fever in children?\", \"top_k\": 3}"
```

### Test End-to-End

1. Start both services
2. Open the mobile app
3. Navigate to the chat screen
4. Ask a pediatric health question: "What vaccinations does my 6-month-old need?"
5. The response should include specific information from the knowledge base

### Check Logs

**RAG Service logs:**
- Look for "Retrieved X relevant documents"
- Check `services/peditrack-rag-service/logs/rag_service.log`

**Chat Service logs:**
- Look for "RAG: Retrieved X relevant documents"
- Console output shows RAG integration status

## Troubleshooting

### RAG Service Not Starting

**Error**: `ModuleNotFoundError`
- **Solution**: Ensure virtual environment is activated and dependencies installed

**Error**: Port 3002 already in use
- **Solution**: Change `SERVICE_PORT` in `.env` or stop other service

### Chat Service Can't Reach RAG

**Symptom**: "Falling back to standard generation" in logs
- **Check**: RAG service is running on port 3002
- **Check**: `RAG_SERVICE_URL` in chat service `.env` is correct
- **Check**: Firewall isn't blocking localhost connections

### No Documents Retrieved

**Symptom**: "No relevant documents found"
- **Check**: Vector store was initialized: `python scripts/init_vector_store.py`
- **Check**: Query is related to pediatric health topics in the sample data
- **Try**: Lower `similarity_threshold` in retrieval request

## Adding More Documents

### Option 1: Via API

```bash
curl -X POST http://localhost:3002/api/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "text": "Your pediatric health content here...",
        "source": "Source Name",
        "metadata": {"category": "symptoms"}
      }
    ]
  }'
```

### Option 2: Via JSON File

1. Add documents to `data/sample_pediatric_docs.json`
2. Run: `python scripts/init_vector_store.py`

## Disabling RAG

To temporarily disable RAG without stopping the service:

Edit `services/peditrack-chat-service/.env`:
```bash
RAG_ENABLED=false
```

Restart the chat service. It will use standard LLM generation without retrieval.

## Performance Notes

- **First query**: Slower (~2-3s) due to model loading
- **Subsequent queries**: Fast (~200-500ms for retrieval)
- **Vector store size**: Currently 15 documents, can scale to 100K+
- **Memory usage**: ~500MB for embedding model + vector store

## Next Steps

1. ✅ RAG service running
2. ✅ Chat service integrated
3. ⏳ Add more pediatric health documents
4. ⏳ Fine-tune similarity thresholds
5. ⏳ Implement caching for frequent queries
6. ⏳ Add source citations in UI

## Support

For issues or questions:
1. Check logs in `services/peditrack-rag-service/logs/`
2. Verify both services are running
3. Test RAG endpoint directly with curl
4. Check environment variables are set correctly
