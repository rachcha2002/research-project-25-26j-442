"""
Download COMPLETE PediatricsMQA Dataset - ALL Configurations
"""
import json
from pathlib import Path
from tqdm import tqdm
from datasets import get_dataset_config_names, load_dataset

print("=" * 70)
print("DOWNLOADING COMPLETE PEDIATRICSMQA DATASET")
print("=" * 70)
print()

# Get all configurations
configs = get_dataset_config_names('adlbh/PediatricsMQA')
print(f"Found {len(configs)} configurations: {configs}")
print()

all_data = []

for config in configs:
    print(f"📥 Downloading configuration: {config}")
    print("-" * 70)
    
    try:
        dataset = load_dataset("adlbh/PediatricsMQA", config)
        
        for split_name in dataset.keys():
            print(f"  Processing {split_name} split: {len(dataset[split_name])} examples")
            
            for item in tqdm(dataset[split_name], desc=f"    {config}/{split_name}"):
                data_item = {
                    'question': item.get('question', ''),
                    'answer': item.get('answer', ''),
                    'options': item.get('options', []),
                    'topic': item.get('topic', ''),
                    'age_group': item.get('age_group', ''),
                    'config': config,
                    'split': split_name
                }
                all_data.append(data_item)
        
        print(f"  ✓ {config}: {len(dataset[list(dataset.keys())[0]])} examples")
        print()
        
    except Exception as e:
        print(f"  ✗ Error with {config}: {e}")
        print()

# Save to JSON
output_dir = Path("data/raw_datasets/pediatricsmqa")
output_dir.mkdir(parents=True, exist_ok=True)

output_file = output_dir / "pediatrics_qa_complete.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_data, f, indent=2, ensure_ascii=False)

print("=" * 70)
print("DOWNLOAD COMPLETE")
print("=" * 70)
print(f"Total examples downloaded: {len(all_data)}")
print(f"Saved to: {output_file}")
print("=" * 70)
