# Google Colab GPU Ingestion Package

This folder contains everything you need to ingest all PediTrack datasets using Google Colab's free GPU.

## 📦 Contents

- `GPU_Ingestion.ipynb` - Colab notebook for GPU-accelerated ingestion
- `package_data.py` - Script to create processed_data.zip
- `README.md` - This file

## 🚀 Quick Start

### Step 1: Package Your Data

Run this script to create a zip file with all processed datasets:

```bash
cd colab_gpu_ingestion
python package_data.py
```

This creates `processed_data.zip` (~50-60 MB compressed).

### Step 2: Upload to Google Colab

1. Go to [Google Colab](https://colab.research.google.com/)
2. Upload `GPU_Ingestion.ipynb`
3. **Important**: Enable GPU
   - Click `Runtime` → `Change runtime type`
   - Select `T4 GPU` or `A100 GPU`
   - Click `Save`

### Step 3: Run the Notebook

Follow the notebook cells in order:

1. **Check GPU** - Verify GPU is available
2. **Install packages** - Install required libraries
3. **Upload data** - Upload `processed_data.zip`
4. **Load model** - Load embedding model on GPU
5. **Ingest datasets** - Process all ~40,000 documents
6. **Save** - Create vector store files
7. **Download** - Get `vector_store.zip`

### Step 4: Use the Vector Store

1. Download `vector_store.zip` from Colab
2. Extract to your local project:
   ```bash
   # Extract to vector_store directory
   unzip vector_store.zip -d ../vector_store/
   ```
3. Start your RAG service:
   ```bash
   cd ..
   start.bat
   ```

## ⚡ Why Use Colab?

- **Free GPU**: Google provides free T4 GPU access
- **Faster**: 10-20x faster than CPU
- **No local setup**: No need to install CUDA locally
- **Easy**: Just upload, run, download

## 📊 Expected Results

**Processing time with GPU:**
- HealthCareMagic (24,855 docs): ~3-5 minutes
- Medical QA (6,500 docs): ~1-2 minutes
- Symptom Checker (5,002 docs): ~1 minute
- PediatricsMQA (3,417 docs): ~1 minute

**Total: ~6-9 minutes** (vs 30-40 minutes on CPU)

## 📁 Output Files

After running the notebook, you'll get:

- `faiss_index` - FAISS vector index (~112 MB)
- `metadata.json` - Document metadata (~100 MB)

Both are packaged in `vector_store.zip` for easy download.

## 🔧 Troubleshooting

### "No GPU detected"
- Make sure you enabled GPU in Runtime settings
- Try reconnecting: Runtime → Disconnect and delete runtime

### "Out of memory"
- Reduce `batch_size` in the notebook (default: 100)
- Use T4 GPU instead of trying to use too much memory

### Upload fails
- Check your internet connection
- Try uploading from Google Drive instead:
  ```python
  from google.colab import drive
  drive.mount('/content/drive')
  ```

## 📝 Notes

- Colab sessions timeout after ~12 hours
- Free tier has usage limits (check Colab docs)
- Save your work frequently
- Download results before session ends

## 🎯 Alternative: Use Google Drive

If upload is slow, you can use Google Drive:

1. Upload `processed_data.zip` to your Google Drive
2. In Colab, mount Drive:
   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   ```
3. Copy from Drive:
   ```python
   !cp /content/drive/MyDrive/processed_data.zip .
   ```

---

**Ready to go!** Run `python package_data.py` to start.
