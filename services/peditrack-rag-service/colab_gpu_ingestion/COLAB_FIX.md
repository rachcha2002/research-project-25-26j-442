# Quick Fix for Google Colab FAISS Installation

## The Error
```
ERROR: Could not find a version that satisfies the requirement faiss-gpu
```

## Solution

Replace the installation cell in the notebook with this:

```python
# Install required packages
!pip install -q sentence-transformers faiss-cpu numpy tqdm

print("✓ Packages installed")
```

## Why This Works

- Google Colab doesn't have `faiss-gpu` in pip
- `faiss-cpu` works fine and is still fast
- The **GPU is used for embeddings** (the slow part), which is what matters
- FAISS indexing is already fast even on CPU

## Performance

- **With GPU embeddings + CPU FAISS**: ~6-9 minutes ⚡
- **With CPU everything**: ~30-40 minutes 🐌

You'll still get the speed benefit!

## Alternative: Use faiss-gpu from conda

If you really want GPU FAISS:

```python
!pip install -q sentence-transformers
!conda install -c conda-forge faiss-gpu -y
```

But honestly, `faiss-cpu` is fine since embeddings are the bottleneck.
