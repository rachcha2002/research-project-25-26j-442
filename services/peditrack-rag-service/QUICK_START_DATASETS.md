# Quick Start: Dataset Integration

## 🚀 3 Simple Ways to Add Data

### Method 1: JSON File (Recommended for Beginners)

**Step 1:** Create a JSON file with your data:

```json
[
  {
    "text": "Your medical content here...",
    "source": "CDC",
    "metadata": {"category": "symptoms"}
  }
]
```

**Step 2:** Save it to `data/my_dataset.json`

**Step 3:** Run:
```bash
cd services/peditrack-rag-service
python scripts/ingest_dataset.py --file data/my_dataset.json
```

---

### Method 2: API Call (For Programmatic Integration)

```bash
curl -X POST http://localhost:3002/api/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "text": "Fever treatment for children...",
        "source": "AAP Guidelines",
        "metadata": {"category": "treatment"}
      }
    ]
  }'
```

---

### Method 3: Python Script (For Custom Processing)

```python
import requests

# Your data
documents = [
    {
        "text": "Child development milestones...",
        "source": "WHO",
        "metadata": {"category": "development"}
    }
]

# Send to RAG service
response = requests.post(
    'http://localhost:3002/api/rag/ingest',
    json={'documents': documents}
)

print(f"Added {response.json()['documents_added']} documents")
```

---

## 📊 Example Datasets You Can Use

### 1. Sample Pediatric Data (Already Included)
```bash
python scripts/init_vector_store.py
```
This loads 5 sample documents about fever, vaccinations, development, etc.

### 2. Your Own Medical Guidelines

Create `data/my_guidelines.json`:
```json
[
  {
    "text": "Asthma management in children: Use inhaled corticosteroids as first-line treatment...",
    "source": "National Asthma Guidelines 2024",
    "metadata": {
      "category": "treatment",
      "condition": "asthma",
      "age_group": "all"
    }
  }
]
```

Then ingest:
```bash
python scripts/ingest_dataset.py --file data/my_guidelines.json
```

### 3. Large Text Documents

For PDFs or long documents, first convert to text, then:

```bash
python scripts/ingest_dataset.py \
  --file data/pediatric_textbook.txt \
  --source "Pediatric Medicine Textbook" \
  --chunk-size 500
```

---

## ✅ Verify Your Data Was Added

### Check Statistics
```bash
curl http://localhost:3002/api/rag/stats
```

Expected output:
```json
{
  "success": true,
  "total_documents": 5,
  "index_size": 7680,
  "embedding_dimension": 384,
  "model_name": "sentence-transformers/all-MiniLM-L6-v2"
}
```

### Test Retrieval
```bash
curl -X POST http://localhost:3002/api/rag/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "What are fever symptoms in children?", "top_k": 2}'
```

---

## 🎯 Real-World Dataset Sources

### Free Medical Datasets

1. **MedDialog** (Medical Q&A)
   - URL: https://github.com/UCSD-AI4H/Medical-Dialogue-System
   - Format: JSON
   - Size: ~1M dialogues

2. **PubMed Central** (Research Articles)
   - URL: https://www.ncbi.nlm.nih.gov/pmc/
   - Format: XML/PDF
   - Access: Free via API

3. **CDC Guidelines** (Health Guidelines)
   - URL: https://www.cdc.gov/
   - Format: Web pages
   - Method: Web scraping

4. **WHO Resources** (Global Health Info)
   - URL: https://www.who.int/
   - Format: PDF/Web
   - Method: Manual extraction

---

## 💡 Tips for Best Results

1. **Keep text chunks 300-500 characters**
   - Too short: loses context
   - Too long: poor retrieval accuracy

2. **Always include metadata**
   ```json
   "metadata": {
     "category": "symptoms",
     "age_group": "infant",
     "urgency": "high",
     "source_date": "2024-01-01"
   }
   ```

3. **Use trusted sources only**
   - CDC, WHO, AAP, Mayo Clinic
   - Peer-reviewed journals
   - Official medical guidelines

4. **Test after each ingestion**
   ```bash
   curl -X POST http://localhost:3002/api/rag/retrieve \
     -H "Content-Type: application/json" \
     -d '{"query": "test query", "top_k": 3}'
   ```

---

## 🔧 Troubleshooting

**Problem**: "File not found"
- **Solution**: Use absolute path or ensure you're in the correct directory

**Problem**: "No documents retrieved"
- **Solution**: Check if documents were actually ingested with `/stats` endpoint

**Problem**: "Out of memory"
- **Solution**: Ingest in smaller batches (100-500 documents at a time)

---

## 📚 Next Steps

1. ✅ Start with sample data: `python scripts/init_vector_store.py`
2. ✅ Test retrieval with a query
3. ✅ Add your own JSON file
4. ✅ Integrate with chat service
5. ✅ Monitor and refine

For detailed information, see `DATASET_INTEGRATION.md`
