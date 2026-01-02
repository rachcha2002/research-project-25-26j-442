"""
Check what's in each processed file
"""
import json
from pathlib import Path

processed_dir = Path("../data/processed")
files = list(processed_dir.glob("*.json"))

print("=" * 70)
print("PROCESSED DATA ANALYSIS")
print("=" * 70)
print()

for file in sorted(files):
    try:
        with open(file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        size_mb = file.stat().st_size / (1024 * 1024)
        
        # Get source distribution
        sources = {}
        for item in data[:100]:  # Sample first 100
            source = item.get('source', 'Unknown')
            sources[source] = sources.get(source, 0) + 1
        
        print(f"📄 {file.name}")
        print(f"   Size: {size_mb:.1f} MB")
        print(f"   Documents: {len(data):,}")
        print(f"   Sample sources: {list(sources.keys())[:3]}")
        print()
        
    except Exception as e:
        print(f"✗ Error reading {file.name}: {e}")
        print()

print("=" * 70)
