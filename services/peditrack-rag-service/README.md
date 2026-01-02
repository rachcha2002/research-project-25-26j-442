# PediTrack RAG Service

Retrieval-Augmented Generation (RAG) service for pediatric health information. This microservice provides intelligent document retrieval to enhance the PediTrack chatbot with evidence-based medical knowledge.

## 🌟 Features

- **Vector-based semantic search** using sentence transformers
- **FAISS indexing** for fast similarity search
- **Batch document ingestion** with progress tracking
- **Medical dialogue datasets** integration (MedDialog, MediTOD, Defined.ai)
- **Pediatric content filtering** for specialized knowledge
- **RESTful API** for easy integration
- **Persistent vector storage** with automatic saving

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Run initialization script
init.bat

# Or manually:
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Initialize with Sample Data

```bash
python scripts\init_vector_store.py
```

### 3. Start the Service

```bash
start.bat

# Or manually:
python main.py
```

The service will be available at `http://localhost:3002`

## 📊 Dataset Integration

### Quick Setup (3 Steps)

```bash
# 1. Setup
setup_medical_datasets.bat

# 2. Download datasets
python scripts\download_medical_datasets.py --dataset all

# 3. Preprocess and ingest
python scripts\preprocess_medical_datasets.py --dataset all
python scripts\ingest_medical_datasets.py
```

### Supported Datasets

1. **MedDialog** - 260K doctor-patient conversations
2. **MediTOD** - 22.5K annotated clinical interviews
3. **Defined.ai** - 55K medical Q&A pairs

See [MEDICAL_DATASETS_INTEGRATION.md](MEDICAL_DATASETS_INTEGRATION.md) for detailed instructions.

## 🔌 API Endpoints

### Health Check

```bash
GET /health
```

### Retrieve Documents

```bash
POST /api/rag/retrieve
Content-Type: application/json

{
  "query": "What are symptoms of ear infection in children?",
  "top_k": 3
}
```

**Response:**
```json
{
  "success": true,
  "query": "What are symptoms of ear infection in children?",
  "results": [
    {
      "text": "Ear pain with fever in young children...",
      "source": "Pediatric Guidelines",
      "metadata": {...},
      "score": 0.89
    }
  ],
  "count": 3
}
```

### Ingest Documents

```bash
POST /api/rag/ingest
Content-Type: application/json

{
  "documents": [
    {
      "text": "Medical content here...",
      "source": "CDC Guidelines",
      "metadata": {"category": "symptoms"}
    }
  ]
}
```

### Get Statistics

```bash
GET /api/rag/stats
```

**Response:**
```json
{
  "success": true,
  "total_documents": 5000,
  "index_size": 19200000,
  "embedding_dimension": 384,
  "model_name": "sentence-transformers/all-MiniLM-L6-v2"
}
```

## 📁 Project Structure

```
peditrack-rag-service/
├── data/
│   ├── raw_datasets/          # Downloaded datasets
│   ├── processed/             # Preprocessed datasets
│   └── sample_*.json          # Sample data files
├── scripts/
│   ├── init_vector_store.py   # Initialize with sample data
│   ├── ingest_dataset.py      # Ingest custom datasets
│   ├── download_medical_datasets.py
│   ├── preprocess_medical_datasets.py
│   └── ingest_medical_datasets.py
├── services/
│   ├── embedding_service.py   # Text embedding generation
│   ├── vector_store.py        # FAISS vector database
│   ├── ingestion_service.py   # Document ingestion
│   └── retrieval_service.py   # Document retrieval
├── routes/
│   └── rag_routes.py          # API endpoints
├── models/
│   └── schemas.py             # Pydantic models
├── utils/
│   └── logger.py              # Logging configuration
├── vector_store/              # Persistent storage
├── logs/                      # Application logs
├── main.py                    # FastAPI application
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## 🎯 Usage Examples

### Add Custom Medical Data

```bash
# Create a JSON file
cat > data/my_data.json << EOF
[
  {
    "text": "Fever management in children...",
    "source": "AAP Guidelines",
    "metadata": {"category": "treatment"}
  }
]
EOF

# Ingest it
python scripts\ingest_dataset.py --file data\my_data.json
```

### Query the RAG System

```bash
curl -X POST http://localhost:3002/api/rag/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to treat fever in toddlers?",
    "top_k": 5
  }'
```

### Check System Status

```bash
curl http://localhost:3002/api/rag/stats
```

## 🔧 Configuration

Edit `.env` file:

```env
# Service configuration
SERVICE_HOST=0.0.0.0
SERVICE_PORT=3002

# CORS settings
CORS_ORIGINS=http://localhost:3001,http://localhost:3000

# Embedding model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Vector store
VECTOR_STORE_PATH=vector_store/faiss_index

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/rag_service.log
```

## 📚 Documentation

- [Quick Start Guide](QUICK_START_DATASETS.md) - Basic dataset integration
- [Medical Datasets Guide](MEDICAL_DATASETS_INTEGRATION.md) - Large-scale dataset integration
- [API Documentation](http://localhost:3002/docs) - Interactive API docs (when service is running)

## 🧪 Testing

```bash
# Test retrieval
python -c "
import requests
response = requests.post('http://localhost:3002/api/rag/retrieve',
    json={'query': 'vaccination schedule', 'top_k': 3})
print(response.json())
"
```

## 🐛 Troubleshooting

### Service won't start

```bash
# Check if port is in use
netstat -ano | findstr :3002

# Kill process if needed
taskkill /PID <process_id> /F
```

### No documents retrieved

```bash
# Check if vector store is initialized
curl http://localhost:3002/api/rag/stats

# Reinitialize if needed
python scripts\init_vector_store.py
```

### Out of memory

```bash
# Use smaller batch sizes
python scripts\ingest_medical_datasets.py --batch-size 50
```

## 🔒 Security Notes

- This service is for development/research purposes
- Implement authentication for production use
- Validate all medical information with healthcare professionals
- Do not use as a substitute for professional medical advice

## 📝 License

Part of the PediTrack project. See main repository for license information.

## 🤝 Contributing

1. Add new datasets following the format in `data/sample_medical_dialogues.json`
2. Test ingestion and retrieval
3. Document your changes
4. Submit pull request

## 📧 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in `logs/rag_service.log`
3. See documentation files
4. Contact the development team

## 🎓 Research & Citations

This service uses:
- **Sentence Transformers** for embeddings
- **FAISS** for vector search
- **MedDialog, MediTOD, Defined.ai** datasets

Please cite appropriate sources when using in research.
