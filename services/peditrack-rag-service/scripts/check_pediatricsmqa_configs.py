"""
Check all available configurations in PediatricsMQA dataset
"""
from datasets import get_dataset_config_names, load_dataset

print("=" * 70)
print("CHECKING PEDIATRICSMQA DATASET CONFIGURATIONS")
print("=" * 70)
print()

# Get all configurations
configs = get_dataset_config_names('adlbh/PediatricsMQA')
print(f"Available configurations: {configs}")
print()

# Load each configuration
total_examples = 0
for config in configs:
    print(f"📊 Configuration: {config}")
    ds = load_dataset('adlbh/PediatricsMQA', config)
    for split_name in ds.keys():
        print(f"  - {split_name}: {len(ds[split_name])} examples")
        total_examples += len(ds[split_name])
    print()

print("=" * 70)
print(f"TOTAL EXAMPLES ACROSS ALL CONFIGS: {total_examples}")
print("=" * 70)
