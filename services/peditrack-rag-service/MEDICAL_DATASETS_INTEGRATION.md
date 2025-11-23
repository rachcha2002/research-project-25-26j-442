# Medical Dialogue Datasets Integration Guide

This guide explains how to integrate three large-scale medical dialogue datasets into the PediTrack RAG system:

1. **MedDialog** - ~0.26M English doctor-patient conversations from online health forums
2. **MediTOD** - 22.5K annotated utterances from staged clinical interviews  
3. **Defined.ai Medical Dialogues** - 55K authentic Q&A pairs across 80+ specialties (including Pediatrics)

## 📋 Overview

These datasets provide realistic dialogue examples and medical knowledge that will significantly enhance the pediatric chatbot's ability to understand and respond to health queries.

## 🚀 Quick Start (3 Steps)

### Step 1: Download Datasets

```bash
cd services/peditrack-rag-service
python scripts/download_medical_datasets.py --dataset all
```

**Note:** Some datasets require manual download:
- **MedDialog**: Visit [GitHub](https://github.com/UCSD-AI4H/Medical-Dialogue-System) and download to `data/raw_datasets/meddialog/`
- **MediTOD**: Visit [GitHub](https://github.com/UCSD-AI4H/MediTOD) and download to `data/raw_datasets/meditod/`
- **Defined.ai**: Auto-downloads from HuggingFace (requires `datasets` library)

### Step 2: Preprocess Datasets

```bash
python scripts/preprocess_medical_datasets.py --dataset all
```

This will:
- ✅ Clean and normalize text
- ✅ Filter for pediatric-relevant content
- ✅ Convert to standardized format
- ✅ Save to `data/processed/`

**Options:**
```bash
# Process specific dataset
python scripts/preprocess_medical_datasets.py --dataset meddialog

# Include all medical content (no pediatric filtering)
python scripts/preprocess_medical_datasets.py --no-filter
```

### Step 3: Ingest into RAG System

```bash
python scripts/ingest_medical_datasets.py
```

This will:
- ✅ Load processed datasets
- ✅ Create embeddings
- ✅ Add to vector store
- ✅ Save progress

**Options:**
```bash
# Ingest specific dataset
python scripts/ingest_medical_datasets.py --dataset meddialog_processed.json

# Custom batch size (default: 100)
python scripts/ingest_medical_datasets.py --batch-size 50
```

## 📊 Dataset Details

### 1. MedDialog Corpus

**Source:** Online health forums  
**Size:** ~260,000 conversations  
**Format:** JSON with dialogue utterances  
**Content:** Real patient questions and doctor responses

**Example Structure:**
```json
{
  "utterances": [
    {"speaker": "Patient", "text": "My child has a fever of 102°F..."},
    {"speaker": "Doctor", "text": "For children, fever management..."}
  ],
  "category": "symptoms",
  "specialty": "pediatrics"
}
```

**Best For:**
- Natural conversation patterns
- Common patient concerns
- Diverse medical topics

### 2. MediTOD Dataset

**Source:** Staged clinical interviews  
**Size:** 22,500 annotated utterances  
**Format:** JSON with intent and entity annotations  
**Content:** Structured clinical dialogues

**Example Structure:**
```json
{
  "dialogue": "Patient reports child has rash on arms",
  "intent": "symptom_report",
  "entities": ["rash", "arms"],
  "annotations": {...}
}
```

**Best For:**
- Intent recognition
- Entity extraction
- Clinical interview patterns

### 3. Defined.ai Medical Dialogues

**Source:** MedQuad dataset via HuggingFace  
**Size:** 55,000 Q&A pairs  
**Format:** JSON with question-answer pairs  
**Content:** Authentic medical Q&A across 80+ specialties

**Example Structure:**
```json
{
  "question": "What are the signs of dehydration in infants?",
  "answer": "Signs include dry mouth, no tears when crying...",
  "specialty": "Pediatrics",
  "source": "NIH"
}
```

**Best For:**
- Factual medical information
- Specialty-specific knowledge
- Trusted medical sources

## 🎯 Pediatric Filtering

The preprocessing script automatically filters for pediatric-relevant content using:

**Keywords:**
- child, children, pediatric, infant, baby, toddler
- newborn, adolescent, teenager, kid
- vaccination, growth, development, milestone
- breastfeeding

**Specialty Tags:**
- Pediatrics, Neonatology, Child Development

**Disable Filtering:**
```bash
python scripts/preprocess_medical_datasets.py --no-filter
```

## 📁 Directory Structure

```
services/peditrack-rag-service/
├── data/
│   ├── raw_datasets/          # Downloaded datasets
│   │   ├── meddialog/
│   │   ├── meditod/
│   │   └── definedai/
│   └── processed/             # Preprocessed datasets
│       ├── meddialog_processed.json
│       ├── meddialog_stats.json
│       ├── meditod_processed.json
│       ├── meditod_stats.json
│       ├── definedai_processed.json
│       └── definedai_stats.json
├── scripts/
│   ├── download_medical_datasets.py
│   ├── preprocess_medical_datasets.py
│   └── ingest_medical_datasets.py
└── vector_store/              # RAG embeddings
```

## ✅ Verification

### Check Statistics

```bash
curl http://localhost:3002/api/rag/stats
```

Expected output:
```json
{
  "success": true,
  "total_documents": 50000,
  "index_size": 192000000,
  "embedding_dimension": 384,
  "model_name": "sentence-transformers/all-MiniLM-L6-v2"
}
```

### Test Retrieval

```bash
curl -X POST http://localhost:3002/api/rag/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are common symptoms of ear infection in children?",
    "top_k": 3
  }'
```

### View Processing Statistics

```bash
# Check processed dataset stats
cat data/processed/meddialog_stats.json
```

## 🔧 Troubleshooting

### Issue: Download Fails

**Solution:** Most datasets require manual download:
1. Visit the GitHub/HuggingFace links
2. Download files to `data/raw_datasets/[dataset_name]/`
3. Ensure files are in JSON format

### Issue: No Documents After Filtering

**Solution:** Pediatric filtering may be too strict:
```bash
# Disable filtering to include all medical content
python scripts/preprocess_medical_datasets.py --no-filter
```

### Issue: Out of Memory During Ingestion

**Solution:** Reduce batch size:
```bash
python scripts/ingest_medical_datasets.py --batch-size 50
```

### Issue: Slow Processing

**Solution:** Process datasets individually:
```bash
# Process one at a time
python scripts/preprocess_medical_datasets.py --dataset definedai
python scripts/ingest_medical_datasets.py --dataset definedai_processed.json
```

## 📈 Expected Results

After successful integration:

| Dataset | Raw Size | Pediatric Filtered | Ingestion Time |
|---------|----------|-------------------|----------------|
| MedDialog | ~260K | ~50K | ~30 min |
| MediTOD | ~22K | ~5K | ~5 min |
| Defined.ai | ~55K | ~15K | ~10 min |
| **Total** | **~337K** | **~70K** | **~45 min** |

## 🎓 Advanced Usage

### Custom Preprocessing

Edit `scripts/preprocess_medical_datasets.py` to add:
- Custom filtering logic
- Additional metadata extraction
- Specialized text cleaning

### Batch Processing

For very large datasets:
```python
# In your script
from scripts.ingest_medical_datasets import MedicalDatasetIngester

ingester = MedicalDatasetIngester(batch_size=50)
ingester.ingest_dataset(dataset_path, dataset_name)
```

### Monitoring Progress

Check logs:
```bash
tail -f logs/rag_service.log
```

## 🔗 Dataset Sources

1. **MedDialog**
   - GitHub: https://github.com/UCSD-AI4H/Medical-Dialogue-System
   - Paper: https://arxiv.org/abs/2004.03329

2. **MediTOD**
   - GitHub: https://github.com/UCSD-AI4H/MediTOD
   - Paper: https://arxiv.org/abs/2010.00063

3. **Defined.ai / MedQuad**
   - HuggingFace: https://huggingface.co/datasets/keivalya/MedQuad-MedicalQnADataset
   - Original: https://github.com/abachaa/MedQuAD

## 📝 Citation

If using these datasets in research, please cite:

```bibtex
@article{meddialog2020,
  title={MedDialog: A Large-scale Medical Dialogue Dataset},
  author={Chen, Shu and Ju, Zeqian and Dong, Xiangyu and others},
  journal={arXiv preprint arXiv:2004.03329},
  year={2020}
}

@article{meditod2020,
  title={MediTOD: A Task-Oriented Dialogue Dataset for Medical Consultations},
  author={Lee, Sungdong and Schulz, Christoph and others},
  journal={arXiv preprint arXiv:2010.00063},
  year={2020}
}
```

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in `logs/rag_service.log`
3. Verify dataset format matches examples
4. Ensure all dependencies are installed

## 🎯 Next Steps

After integration:
1. ✅ Test chatbot responses with real queries
2. ✅ Monitor retrieval quality
3. ✅ Fine-tune filtering parameters
4. ✅ Add more specialized datasets
5. ✅ Implement feedback loop for improvements
