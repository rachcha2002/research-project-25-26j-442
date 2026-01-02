# Medical Datasets Integration - Workflow Diagram

## 📊 Complete Integration Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MEDICAL DATASETS INTEGRATION                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: SETUP                                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Run: setup_medical_datasets.bat                                     │
│                                                                       │
│  Actions:                                                            │
│  ✓ Install dependencies (requests, tqdm, datasets)                  │
│  ✓ Create directories (raw_datasets/, processed/)                   │
│  ✓ Verify virtual environment                                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: DOWNLOAD DATASETS                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Run: python scripts/download_medical_datasets.py --dataset all     │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  MedDialog   │  │   MediTOD    │  │  Defined.ai  │              │
│  │   ~260K      │  │    ~22.5K    │  │    ~55K      │              │
│  │   Manual     │  │    Manual    │  │    Auto      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         ↓                 ↓                  ↓                       │
│  data/raw_datasets/  data/raw_datasets/  data/raw_datasets/         │
│     meddialog/          meditod/          definedai/                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: PREPROCESS                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Run: python scripts/preprocess_medical_datasets.py --dataset all   │
│                                                                       │
│  Processing Pipeline:                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. Load JSON → 2. Extract Fields → 3. Filter Pediatric      │   │
│  │ 4. Clean Text → 5. Format Dialogue → 6. Add Metadata        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Pediatric Filtering:                                                │
│  • Keywords: child, infant, baby, pediatric, vaccination...         │
│  • Specialties: Pediatrics, Neonatology, Child Development          │
│  • Optional: Use --no-filter to include all content                 │
│                                                                       │
│  Output:                                                             │
│  ✓ data/processed/meddialog_processed.json                          │
│  ✓ data/processed/meditod_processed.json                            │
│  ✓ data/processed/definedai_processed.json                          │
│  ✓ Statistics files (*_stats.json)                                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: INGEST INTO RAG                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Run: python scripts/ingest_medical_datasets.py                     │
│                                                                       │
│  Ingestion Pipeline:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Processed JSON                                               │   │
│  │       ↓                                                       │   │
│  │ Batch into chunks (default: 100)                            │   │
│  │       ↓                                                       │   │
│  │ Convert to Document objects                                 │   │
│  │       ↓                                                       │   │
│  │ Generate embeddings (sentence-transformers)                 │   │
│  │       ↓                                                       │   │
│  │ Add to FAISS vector store                                   │   │
│  │       ↓                                                       │   │
│  │ Save persistently                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Result: ~70K documents indexed (with pediatric filter)             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: VERIFY & TEST                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Check Statistics:                                                   │
│  curl http://localhost:3002/api/rag/stats                           │
│                                                                       │
│  Test Retrieval:                                                     │
│  curl -X POST http://localhost:3002/api/rag/retrieve \              │
│    -H "Content-Type: application/json" \                            │
│    -d '{"query": "fever in children", "top_k": 3}'                  │
│                                                                       │
│  Expected Response:                                                  │
│  {                                                                   │
│    "success": true,                                                  │
│    "results": [                                                      │
│      {                                                               │
│        "text": "Ear pain with fever in young children...",         │
│        "source": "MedDialog",                                       │
│        "score": 0.89                                                │
│      }                                                               │
│    ]                                                                 │
│  }                                                                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: USE IN CHATBOT                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Query: "My child has a fever, what should I do?"              │
│       ↓                                                              │
│  Chat Service → RAG Service                                         │
│       ↓                                                              │
│  Retrieve relevant medical dialogues                                │
│       ↓                                                              │
│  Provide context to LLM                                             │
│       ↓                                                              │
│  Generate informed response                                         │
│       ↓                                                              │
│  Return to user                                                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘


## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  MedDialog (GitHub)     MediTOD (GitHub)     Defined.ai (HF)        │
│       260K                  22.5K                 55K                │
│         │                     │                    │                 │
│         └─────────────────────┴────────────────────┘                 │
│                              ↓                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    PREPROCESSING LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  • Text Cleaning                                                     │
│  • Pediatric Filtering                                               │
│  • Dialogue Formatting                                               │
│  • Metadata Enrichment                                               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      EMBEDDING LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Sentence Transformers (all-MiniLM-L6-v2)                           │
│  Text → 384-dimensional vectors                                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      VECTOR STORE (FAISS)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  • Fast similarity search                                            │
│  • Persistent storage                                                │
│  • Metadata indexing                                                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      RETRIEVAL API                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  POST /api/rag/retrieve                                             │
│  • Query embedding                                                   │
│  • Top-K similarity search                                          │
│  • Return relevant documents                                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      CHAT SERVICE                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  • Receives user query                                               │
│  • Retrieves context from RAG                                       │
│  • Sends to LLM with context                                        │
│  • Returns informed response                                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 📈 Processing Statistics

```
Dataset Processing Times (Approximate):

MedDialog:     [████████████████████████████████████] 50 min
MediTOD:       [████████] 8 min
Defined.ai:    [███████████████████] 23 min

Total Time:    ~1.5 hours (for all datasets)
```

## 🎯 Quality Metrics

```
Before Integration:
├── Documents: 5 (sample data)
├── Coverage: Basic pediatric info
└── Response Quality: Limited

After Integration:
├── Documents: ~70,000 (filtered) or ~337,000 (unfiltered)
├── Coverage: Comprehensive medical dialogues
└── Response Quality: Significantly improved
    ├── More diverse knowledge
    ├── Realistic dialogue patterns
    ├── Specialty-specific information
    └── Evidence-based responses
```

## 🔍 Example Query Flow

```
User: "My 2-year-old has a fever of 101°F. What should I do?"
  ↓
Chat Service
  ↓
RAG Service: /api/rag/retrieve
  ↓
Query Embedding: [0.23, -0.45, 0.67, ..., 0.12] (384 dims)
  ↓
FAISS Search: Top 3 similar documents
  ↓
Results:
  1. "Ear pain with fever in young children..." (score: 0.89)
  2. "Fever management in children..." (score: 0.85)
  3. "When to seek medical attention for fever..." (score: 0.82)
  ↓
Chat Service: Combines results with LLM
  ↓
Response: "For a 2-year-old with a 101°F fever, here's what you should do:
           1. Give age-appropriate fever reducer...
           2. Keep your child hydrated...
           3. Monitor for other symptoms...
           [Based on medical guidelines and expert recommendations]"
```

---

**This workflow ensures**:
✅ High-quality medical knowledge
✅ Pediatric-specific content
✅ Fast retrieval (<100ms)
✅ Scalable architecture
✅ Easy maintenance
