# Medical Datasets Integration - Quick Reference

## 🎯 One-Command Setup

```bash
# Complete setup in one go
cd services\peditrack-rag-service
setup_medical_datasets.bat
python scripts\download_medical_datasets.py --dataset definedai
python scripts\preprocess_medical_datasets.py --dataset definedai
python scripts\ingest_medical_datasets.py --dataset definedai_processed.json
```

## 📊 Dataset Quick Facts

| Dataset | Size | Format | Auto-Download | Pediatric Filter |
|---------|------|--------|---------------|------------------|
| **MedDialog** | 260K | JSON | ❌ Manual | ✅ Yes |
| **MediTOD** | 22.5K | JSON | ❌ Manual | ✅ Yes |
| **Defined.ai** | 55K | JSON | ✅ Auto | ✅ Yes |

## 🚀 Common Commands

### Download
```bash
# All datasets
python scripts\download_medical_datasets.py --dataset all

# Specific dataset
python scripts\download_medical_datasets.py --dataset definedai
```

### Preprocess
```bash
# With pediatric filtering (recommended)
python scripts\preprocess_medical_datasets.py --dataset all

# Without filtering (all medical content)
python scripts\preprocess_medical_datasets.py --dataset all --no-filter

# Specific dataset
python scripts\preprocess_medical_datasets.py --dataset meddialog
```

### Ingest
```bash
# All processed datasets
python scripts\ingest_medical_datasets.py

# Specific dataset
python scripts\ingest_medical_datasets.py --dataset meddialog_processed.json

# Custom batch size
python scripts\ingest_medical_datasets.py --batch-size 50
```

### Test Sample Data
```bash
# Ingest the sample dialogues
python scripts\ingest_dataset.py --file data\sample_medical_dialogues.json

# Test retrieval
curl -X POST http://localhost:3002/api/rag/retrieve ^
  -H "Content-Type: application/json" ^
  -d "{\"query\": \"ear infection symptoms\", \"top_k\": 3}"
```

## 📁 File Locations

```
data/
├── raw_datasets/              # Downloaded files go here
│   ├── meddialog/            # Manual download
│   ├── meditod/              # Manual download
│   └── definedai/            # Auto-downloaded
├── processed/                 # Preprocessed files
│   ├── meddialog_processed.json
│   ├── meditod_processed.json
│   └── definedai_processed.json
└── sample_medical_dialogues.json  # Ready to use!
```

## ✅ Verification Steps

### 1. Check if datasets downloaded
```bash
dir data\raw_datasets\definedai
```

### 2. Check if preprocessing worked
```bash
dir data\processed
type data\processed\definedai_stats.json
```

### 3. Check if ingestion succeeded
```bash
curl http://localhost:3002/api/rag/stats
```

### 4. Test retrieval
```bash
curl -X POST http://localhost:3002/api/rag/retrieve ^
  -H "Content-Type: application/json" ^
  -d "{\"query\": \"vaccination schedule\", \"top_k\": 3}"
```

## 🔧 Troubleshooting Quick Fixes

### Problem: Download fails
```bash
# Defined.ai requires HuggingFace datasets
pip install datasets

# MedDialog & MediTOD require manual download
# Visit GitHub links in MEDICAL_DATASETS_INTEGRATION.md
```

### Problem: No pediatric content found
```bash
# Disable filtering
python scripts\preprocess_medical_datasets.py --no-filter
```

### Problem: Out of memory
```bash
# Reduce batch size
python scripts\ingest_medical_datasets.py --batch-size 25
```

### Problem: Service not running
```bash
# Start the service first
cd services\peditrack-rag-service
start.bat
```

## 📈 Expected Processing Times

| Step | MedDialog | MediTOD | Defined.ai |
|------|-----------|---------|------------|
| Download | Manual | Manual | ~5 min |
| Preprocess | ~20 min | ~3 min | ~8 min |
| Ingest | ~30 min | ~5 min | ~10 min |
| **Total** | ~50 min | ~8 min | ~23 min |

*Times are approximate and depend on hardware*

## 🎯 Recommended Workflow

### For Quick Testing (5 minutes)
```bash
# Use sample data
python scripts\ingest_dataset.py --file data\sample_medical_dialogues.json
```

### For Production (1-2 hours)
```bash
# 1. Setup
setup_medical_datasets.bat

# 2. Download Defined.ai (easiest)
python scripts\download_medical_datasets.py --dataset definedai

# 3. Process and ingest
python scripts\preprocess_medical_datasets.py --dataset definedai
python scripts\ingest_medical_datasets.py --dataset definedai_processed.json

# 4. Manually download MedDialog & MediTOD later
# Follow instructions in MEDICAL_DATASETS_INTEGRATION.md
```

## 🔍 Useful Queries

```bash
# Check total documents
curl http://localhost:3002/api/rag/stats

# Test pediatric query
curl -X POST http://localhost:3002/api/rag/retrieve ^
  -H "Content-Type: application/json" ^
  -d "{\"query\": \"fever in toddlers\", \"top_k\": 5}"

# Test vaccination query
curl -X POST http://localhost:3002/api/rag/retrieve ^
  -H "Content-Type: application/json" ^
  -d "{\"query\": \"when should baby get first shots\", \"top_k\": 3}"

# Test development query
curl -X POST http://localhost:3002/api/rag/retrieve ^
  -H "Content-Type: application/json" ^
  -d "{\"query\": \"12 month milestones\", \"top_k\": 3}"
```

## 📚 Documentation Files

- `README.md` - Main service documentation
- `QUICK_START_DATASETS.md` - Basic dataset integration
- `MEDICAL_DATASETS_INTEGRATION.md` - Detailed integration guide
- `QUICK_REFERENCE.md` - This file

## 💡 Pro Tips

1. **Start with Defined.ai** - It auto-downloads and has good pediatric content
2. **Use pediatric filtering** - Reduces noise and improves relevance
3. **Test with sample data first** - Verify everything works before large ingestion
4. **Monitor logs** - Check `logs/rag_service.log` for issues
5. **Batch processing** - Use smaller batches if you have limited RAM

## 🆘 Need Help?

1. ✅ Check this quick reference
2. ✅ Review `MEDICAL_DATASETS_INTEGRATION.md`
3. ✅ Check logs: `logs/rag_service.log`
4. ✅ Verify service is running: `curl http://localhost:3002/health`
5. ✅ Test with sample data first
