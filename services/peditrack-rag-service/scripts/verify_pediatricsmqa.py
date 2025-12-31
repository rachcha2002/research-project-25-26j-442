"""
Verify PediatricsMQA Dataset Integration
Check if we downloaded the full dataset or just samples
"""
from datasets import load_dataset
import json
from pathlib import Path

print("=" * 70)
print("VERIFYING PEDIATRICSMQA DATASET INTEGRATION")
print("=" * 70)
print()

# Check HuggingFace dataset size
print("📊 Checking HuggingFace dataset...")
ds = load_dataset('adlbh/PediatricsMQA', 'tqa')
print(f"Available splits: {list(ds.keys())}")
print(f"Test split size: {len(ds['test'])} examples")
print()

# Check our downloaded file
raw_file = Path("data/raw_datasets/pediatricsmqa/pediatrics_qa.json")
if raw_file.exists():
    with open(raw_file, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
    print(f"✓ Raw file downloaded: {len(raw_data)} examples")
else:
    print("✗ Raw file not found")
    raw_data = []

# Check processed file
processed_file = Path("data/processed/pediatricsmqa_processed.json")
if processed_file.exists():
    with open(processed_file, 'r', encoding='utf-8') as f:
        processed_data = json.load(f)
    print(f"✓ Processed file created: {len(processed_data)} documents")
else:
    print("✗ Processed file not found")
    processed_data = []

print()
print("=" * 70)
print("COMPARISON")
print("=" * 70)
print(f"HuggingFace dataset:  {len(ds['test'])} examples")
print(f"Downloaded (raw):     {len(raw_data)} examples")
print(f"Processed:            {len(processed_data)} documents")
print()

if len(raw_data) == len(ds['test']):
    print("✅ FULL DATASET DOWNLOADED!")
else:
    print(f"⚠️  PARTIAL DOWNLOAD: Missing {len(ds['test']) - len(raw_data)} examples")

print("=" * 70)
