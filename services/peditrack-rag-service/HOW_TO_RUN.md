# How to Run the RAG Service

## 🚀 Quick Start (5 Steps)

### Step 1: Install Python Dependencies

Open a terminal and navigate to the RAG service directory:

```bash
cd d:\research-project-25-26j-442\services\peditrack-rag-service
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

> **Note**: First time installation will download the embedding model (~90MB). This is normal and only happens once.

---

### Step 2: Set Up Environment Variables

Copy the example environment file:

```bash
copy .env.example .env
```

The default settings should work fine. Your `.env` file contains:
```
SERVICE_PORT=3002
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
DEFAULT_TOP_K=5
```

---

### Step 3: Initialize the Vector Store

Load sample pediatric health documents:

```bash
python scripts/init_vector_store.py
```

You should see:
```
✓ Successfully initialized vector store with 5 documents
You can now start the RAG service with: uvicorn main:app --reload --port 3002
```

---

### Step 4: Start the RAG Service

```bash
uvicorn main:app --reload --port 3002
```

Or simply:

```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:3002 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Loaded embedding model: sentence-transformers/all-MiniLM-L6-v2
INFO:     Loaded existing vector store with 5 documents
INFO:     RAG Service startup complete
INFO:     Application startup complete.
```

✅ **The service is now running on http://localhost:3002**

---

### Step 5: Test the Service

Open a new terminal and test:

**Health Check:**
```bash
curl http://localhost:3002/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "PediTrack RAG Service",
  "version": "1.0.0"
}
```

**Test Retrieval:**
```bash
curl -X POST http://localhost:3002/api/rag/retrieve -H "Content-Type: application/json" -d "{\"query\": \"What are fever symptoms in children?\", \"top_k\": 3}"
```

You should get relevant documents about fever!

---

## 🔧 Running with Chat Service

To use RAG with your chat service, you need **both services running**:

### Terminal 1: RAG Service
```bash
cd d:\research-project-25-26j-442\services\peditrack-rag-service
venv\Scripts\activate
python main.py
```

### Terminal 2: Chat Service
```bash
cd d:\research-project-25-26j-442\services\peditrack-chat-service
npm run dev
```

### Terminal 3: Mobile App
```bash
cd d:\research-project-25-26j-442\peditrackv2
npm start
```

---

## 📊 API Endpoints

Once running, you can access:

- **Health Check**: http://localhost:3002/health
- **API Docs**: http://localhost:3002/docs (Interactive Swagger UI)
- **Stats**: http://localhost:3002/api/rag/stats

### Available Endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check service health |
| `/api/rag/retrieve` | POST | Retrieve relevant documents |
| `/api/rag/ingest` | POST | Add new documents |
| `/api/rag/stats` | GET | Get index statistics |
| `/api/rag/clear` | DELETE | Clear all documents |

---

## 🛑 Stopping the Service

Press `CTRL+C` in the terminal where the service is running.

The service will automatically save the vector store before shutting down.

---

## 🔄 Restarting the Service

Just run again:
```bash
cd d:\research-project-25-26j-442\services\peditrack-rag-service
venv\Scripts\activate
python main.py
```

The service will automatically load your existing vector store with all documents.

---

## ⚠️ Troubleshooting

### Issue: "python: command not found"
**Solution**: Make sure Python 3.9+ is installed. Try `python3` instead of `python`.

### Issue: "Port 3002 already in use"
**Solution**: 
1. Stop any other service using port 3002, OR
2. Change the port in `.env`: `SERVICE_PORT=3003`

### Issue: "Module not found"
**Solution**: Make sure virtual environment is activated and dependencies installed:
```bash
venv\Scripts\activate
pip install -r requirements.txt
```

### Issue: "No documents in vector store"
**Solution**: Run the initialization script:
```bash
python scripts/init_vector_store.py
```

### Issue: Model download fails
**Solution**: 
- Check internet connection
- The model (~90MB) downloads on first run
- Wait for download to complete

---

## 📝 Logs

Check logs for debugging:
```bash
# View recent logs
type logs\rag_service.log

# Monitor logs in real-time
Get-Content logs\rag_service.log -Wait
```

---

## 🎯 Next Steps

1. ✅ Service is running on port 3002
2. ✅ Test retrieval with sample queries
3. ✅ Add more documents (see `QUICK_START_DATASETS.md`)
4. ✅ Enable RAG in chat service (set `RAG_ENABLED=true` in chat service `.env`)
5. ✅ Test end-to-end with mobile app

---

## 💡 Pro Tips

- **Auto-reload**: The service automatically reloads when you change code (thanks to `--reload` flag)
- **API Docs**: Visit http://localhost:3002/docs for interactive API documentation
- **Batch Processing**: Ingest documents in batches of 100-500 for best performance
- **Monitoring**: Check `/api/rag/stats` regularly to monitor index size

---

## 🆘 Need Help?

1. Check logs: `logs/rag_service.log`
2. Verify service is running: `curl http://localhost:3002/health`
3. Check vector store stats: `curl http://localhost:3002/api/rag/stats`
4. Review error messages in terminal

For more details, see:
- `README.md` - Full documentation
- `RAG_INTEGRATION_GUIDE.md` - Integration with chat service
- `QUICK_START_DATASETS.md` - Adding more data
