"""
Package ONLY Unique Processed Data for Google Colab
Excludes duplicates and combined files
"""
import zipfile
from pathlib import Path
import json

print("=" * 70)
print("PACKAGING UNIQUE DATASETS FOR COLAB")
print("=" * 70)
print()

# Define which files to include (no duplicates)
files_to_include = {
    'healthcaremagic_processed.json': 'HealthCareMagic Q&A',
    'medical_qa_pediatric_processed.json': 'Medical QA (Pediatric)',
    'pediatric_combined_processed.json': 'Symptom Checker + Disease Symptoms',
    'pediatricsmqa_processed.json': 'PediatricsMQA Exam Questions'
}

processed_dir = Path("../data/processed")
total_docs = 0
total_size = 0

print("Files to include:")
print()

for filename, description in files_to_include.items():
    filepath = processed_dir / filename
    if filepath.exists():
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        size_mb = filepath.stat().st_size / (1024 * 1024)
        total_size += size_mb
        total_docs += len(data)
        
        print(f"✓ {filename}")
        print(f"  Description: {description}")
        print(f"  Documents: {len(data):,}")
        print(f"  Size: {size_mb:.1f} MB")
        print()

print(f"Total documents: {total_docs:,}")
print(f"Total size: {total_size:.1f} MB")
print()

# Create zip file
zip_path = Path("processed_data.zip")
print(f"Creating {zip_path}...")
print()

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for filename in files_to_include.keys():
        filepath = processed_dir / filename
        if filepath.exists():
            arcname = f"processed/{filename}"
            zipf.write(filepath, arcname)
            print(f"  ✓ Added: {filename}")

zip_size_mb = zip_path.stat().st_size / (1024 * 1024)

print()
print("=" * 70)
print("PACKAGING COMPLETE")
print("=" * 70)
print(f"Output: {zip_path.absolute()}")
print(f"Compressed: {zip_size_mb:.1f} MB (from {total_size:.1f} MB)")
print(f"Compression: {(1 - zip_size_mb/total_size)*100:.1f}%")
print()
print("📊 DATASET BREAKDOWN:")
print(f"  • HealthCareMagic: 24,855 docs (doctor-patient Q&A)")
print(f"  • Medical QA: 6,500 docs (pediatric Q&A)")
print(f"  • Symptom/Disease: 11,502 docs (symptom checker + diseases)")
print(f"  • PediatricsMQA: 3,417 docs (medical exam questions)")
print(f"  TOTAL: {total_docs:,} unique documents")
print()
print("Next: Upload to Google Colab and run GPU_Ingestion.ipynb")
print("=" * 70)
