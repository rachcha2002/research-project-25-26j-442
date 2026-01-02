# Medical Datasets Integration - Step-by-Step Checklist

Use this checklist to track your progress through the integration process.

## 📋 Pre-Integration Setup

- [ ] Navigate to RAG service directory
  ```bash
  cd d:\research-project-25-26j-442\services\peditrack-rag-service
  ```

- [ ] Verify virtual environment exists
  ```bash
  dir venv
  ```
  - If not found, run: `init.bat`

- [ ] Run setup script
  ```bash
  setup_medical_datasets.bat
  ```

- [ ] Verify dependencies installed
  ```bash
  venv\Scripts\activate
  pip list | findstr "requests tqdm datasets"
  ```
  - Should see: requests, tqdm, datasets

## 📥 Phase 1: Quick Test with Sample Data (5 minutes)

- [ ] Start RAG service
  ```bash
  start.bat
  ```
  - Wait for "Application startup complete"

- [ ] Verify service is running
  ```bash
  curl http://localhost:3002/health
  ```
  - Should return: `{"status":"healthy",...}`

- [ ] Ingest sample data
  ```bash
  python scripts\ingest_dataset.py --file data\sample_medical_dialogues.json
  ```
  - Should add 10 documents

- [ ] Check statistics
  ```bash
  curl http://localhost:3002/api/rag/stats
  ```
  - Should show total_documents > 0

- [ ] Test retrieval
  ```bash
  curl -X POST http://localhost:3002/api/rag/retrieve -H "Content-Type: application/json" -d "{\"query\": \"fever in children\", \"top_k\": 3}"
  ```
  - Should return relevant results

**✅ If all tests pass, proceed to Phase 2**

## 📊 Phase 2: Defined.ai Dataset (Easiest, ~30 minutes)

### Download

- [ ] Run download script
  ```bash
  python scripts\download_medical_datasets.py --dataset definedai
  ```
  - Auto-downloads from HuggingFace
  - Creates: `data/raw_datasets/definedai/medical_qa.json`

- [ ] Verify download
  ```bash
  dir data\raw_datasets\definedai
  ```
  - Should see: medical_qa.json

### Preprocess

- [ ] Run preprocessing (with pediatric filter)
  ```bash
  python scripts\preprocess_medical_datasets.py --dataset definedai
  ```
  - Takes ~5-10 minutes
  - Creates: `data/processed/definedai_processed.json`

- [ ] Check statistics
  ```bash
  type data\processed\definedai_stats.json
  ```
  - Note the total_documents count

### Ingest

- [ ] Run ingestion
  ```bash
  python scripts\ingest_medical_datasets.py --dataset definedai_processed.json
  ```
  - Takes ~10-15 minutes
  - Shows progress bar

- [ ] Verify ingestion
  ```bash
  curl http://localhost:3002/api/rag/stats
  ```
  - total_documents should have increased significantly

- [ ] Test retrieval with new data
  ```bash
  curl -X POST http://localhost:3002/api/rag/retrieve -H "Content-Type: application/json" -d "{\"query\": \"vaccination schedule for babies\", \"top_k\": 5}"
  ```
  - Should return diverse results

**✅ Defined.ai integration complete!**

## 📚 Phase 3: MedDialog Dataset (Manual, ~1 hour)

### Download (Manual)

- [ ] Visit GitHub repository
  - URL: https://github.com/UCSD-AI4H/Medical-Dialogue-System

- [ ] Download dataset files
  - Look for: `data/en/dialogues.json` or similar

- [ ] Save to correct location
  ```bash
  # Create directory if needed
  mkdir data\raw_datasets\meddialog
  
  # Move downloaded files to:
  # data\raw_datasets\meddialog\
  ```

- [ ] Verify files
  ```bash
  dir data\raw_datasets\meddialog
  ```
  - Should see JSON files

### Preprocess

- [ ] Run preprocessing
  ```bash
  python scripts\preprocess_medical_datasets.py --dataset meddialog
  ```
  - Takes ~15-25 minutes
  - Creates: `data/processed/meddialog_processed.json`

- [ ] Check statistics
  ```bash
  type data\processed\meddialog_stats.json
  ```

### Ingest

- [ ] Run ingestion
  ```bash
  python scripts\ingest_medical_datasets.py --dataset meddialog_processed.json
  ```
  - Takes ~25-35 minutes
  - Use `--batch-size 50` if memory issues

- [ ] Verify ingestion
  ```bash
  curl http://localhost:3002/api/rag/stats
  ```

**✅ MedDialog integration complete!**

## 🏥 Phase 4: MediTOD Dataset (Manual, ~30 minutes)

### Download (Manual)

- [ ] Visit GitHub repository
  - URL: https://github.com/UCSD-AI4H/MediTOD

- [ ] Download dataset files

- [ ] Save to correct location
  ```bash
  mkdir data\raw_datasets\meditod
  # Move files to data\raw_datasets\meditod\
  ```

- [ ] Verify files
  ```bash
  dir data\raw_datasets\meditod
  ```

### Preprocess

- [ ] Run preprocessing
  ```bash
  python scripts\preprocess_medical_datasets.py --dataset meditod
  ```
  - Takes ~3-5 minutes

- [ ] Check statistics
  ```bash
  type data\processed\meditod_stats.json
  ```

### Ingest

- [ ] Run ingestion
  ```bash
  python scripts\ingest_medical_datasets.py --dataset meditod_processed.json
  ```
  - Takes ~5-10 minutes

- [ ] Verify ingestion
  ```bash
  curl http://localhost:3002/api/rag/stats
  ```

**✅ MediTOD integration complete!**

## 🎯 Phase 5: Final Verification

- [ ] Check total document count
  ```bash
  curl http://localhost:3002/api/rag/stats
  ```
  - Expected: ~70,000 documents (with pediatric filter)
  - Expected: ~337,000 documents (without filter)

- [ ] Test various queries
  ```bash
  # Test 1: Symptoms
  curl -X POST http://localhost:3002/api/rag/retrieve -H "Content-Type: application/json" -d "{\"query\": \"ear infection symptoms in toddlers\", \"top_k\": 3}"
  
  # Test 2: Treatment
  curl -X POST http://localhost:3002/api/rag/retrieve -H "Content-Type: application/json" -d "{\"query\": \"how to treat fever in children\", \"top_k\": 3}"
  
  # Test 3: Development
  curl -X POST http://localhost:3002/api/rag/retrieve -H "Content-Type: application/json" -d "{\"query\": \"12 month developmental milestones\", \"top_k\": 3}"
  
  # Test 4: Nutrition
  curl -X POST http://localhost:3002/api/rag/retrieve -H "Content-Type: application/json" -d "{\"query\": \"introducing solid foods to baby\", \"top_k\": 3}"
  ```

- [ ] Verify result quality
  - Results should be relevant
  - Scores should be > 0.5 for good matches
  - Sources should be diverse

- [ ] Check logs for errors
  ```bash
  type logs\rag_service.log
  ```

- [ ] Test chatbot integration
  - Open chat interface
  - Ask pediatric health questions
  - Verify responses use RAG context

**✅ All datasets integrated successfully!**

## 🔧 Optional: Advanced Configuration

- [ ] Adjust batch size for performance
  ```bash
  # If you have memory issues
  python scripts\ingest_medical_datasets.py --batch-size 25
  ```

- [ ] Disable pediatric filtering for more content
  ```bash
  python scripts\preprocess_medical_datasets.py --dataset all --no-filter
  ```

- [ ] Re-ingest with different settings
  ```bash
  # Clear vector store first
  del vector_store\*
  
  # Re-initialize
  python scripts\init_vector_store.py
  
  # Ingest again
  python scripts\ingest_medical_datasets.py
  ```

## 📊 Progress Summary

Track your overall progress:

- [ ] Phase 1: Sample Data ✅
- [ ] Phase 2: Defined.ai ✅
- [ ] Phase 3: MedDialog ✅
- [ ] Phase 4: MediTOD ✅
- [ ] Phase 5: Verification ✅

**Total Estimated Time**: 2-3 hours

## 🆘 Troubleshooting Reference

If you encounter issues, check:

1. **Service not running**
   - Solution: Run `start.bat`

2. **Download fails**
   - Solution: Install `pip install datasets` or download manually

3. **No pediatric content**
   - Solution: Use `--no-filter` flag

4. **Out of memory**
   - Solution: Use `--batch-size 25`

5. **No results retrieved**
   - Solution: Check `curl http://localhost:3002/api/rag/stats`

## 📚 Documentation Reference

- **README.md** - Main documentation
- **MEDICAL_DATASETS_INTEGRATION.md** - Detailed guide
- **QUICK_REFERENCE.md** - Command cheat sheet
- **WORKFLOW_DIAGRAM.md** - Visual workflow
- **IMPLEMENTATION_SUMMARY.md** - Technical details

## ✅ Completion Checklist

- [ ] All datasets downloaded
- [ ] All datasets preprocessed
- [ ] All datasets ingested
- [ ] RAG service tested and working
- [ ] Chatbot integration verified
- [ ] Documentation reviewed

**🎉 Congratulations! Medical datasets integration is complete!**

---

**Notes**:
- Save this file and check off items as you complete them
- Estimated total time: 2-3 hours
- Can be done in phases over multiple sessions
- Start with Phase 1 & 2 for quick results
