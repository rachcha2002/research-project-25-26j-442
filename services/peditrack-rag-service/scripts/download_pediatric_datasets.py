"""
Download Pediatric-Specific Datasets
Includes: Disease-Symptom datasets, Symptom Checker data, and Pediatric QA
"""
import os
import json
from pathlib import Path

print("=" * 70)
print("DOWNLOADING PEDIATRIC-SPECIFIC DATASETS")
print("=" * 70)
print()

def install_kaggle():
    """Install Kaggle API if not available"""
    try:
        import kaggle
        return True
    except ImportError:
        print("📦 Installing Kaggle API...")
        os.system("pip install kaggle")
        print()
        return True

def download_disease_symptom_dataset():
    """Download Disease-Symptom Dataset from Kaggle"""
    print("📥 Dataset 1: Disease-Symptom Dataset")
    print("-" * 70)
    print("Source: Kaggle")
    print("Content: 773 diseases, 377 symptoms, severity levels")
    print()
    
    try:
        import kaggle
        
        output_dir = Path("data/raw_datasets/disease_symptoms")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print("Downloading from Kaggle...")
        # Download the dataset
        kaggle.api.dataset_download_files(
            'niyarrbarman/symptom2disease',
            path=str(output_dir),
            unzip=True
        )
        
        print(f"✓ Downloaded to: {output_dir}")
        print()
        return True
        
    except Exception as e:
        print(f"⚠️ Error: {e}")
        print()
        print("Manual download:")
        print("  1. Visit: https://www.kaggle.com/datasets/niyarrbarman/symptom2disease")
        print(f"  2. Download and extract to: {output_dir}")
        print()
        return False

def download_symptom_checker_dataset():
    """Download AI Symptom Checker Dataset"""
    print("📥 Dataset 2: AI-Powered Symptom Checker")
    print("-" * 70)
    print("Source: Kaggle")
    print("Content: Symptom-disease mapping with urgency levels")
    print()
    
    try:
        import kaggle
        
        output_dir = Path("data/raw_datasets/symptom_checker")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print("Downloading from Kaggle...")
        kaggle.api.dataset_download_files(
            'itachi9604/disease-symptom-description-dataset',
            path=str(output_dir),
            unzip=True
        )
        
        print(f"✓ Downloaded to: {output_dir}")
        print()
        return True
        
    except Exception as e:
        print(f"⚠️ Error: {e}")
        print()
        print("Manual download:")
        print("  1. Visit: https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset")
        print(f"  2. Download and extract to: {output_dir}")
        print()
        return False

def download_medical_qa_dataset():
    """Download Medical QA Dataset"""
    print("📥 Dataset 3: Medical QA Dataset")
    print("-" * 70)
    print("Source: Kaggle - MedQuAD")
    print("Content: 43,000+ medical Q&A pairs")
    print()
    
    try:
        import kaggle
        
        output_dir = Path("data/raw_datasets/medical_qa")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print("Downloading from Kaggle...")
        kaggle.api.dataset_download_files(
            'thedevastator/comprehensive-medical-q-a-dataset',
            path=str(output_dir),
            unzip=True
        )
        
        print(f"✓ Downloaded to: {output_dir}")
        print()
        return True
        
    except Exception as e:
        print(f"⚠️ Error: {e}")
        print()
        print("Manual download:")
        print("  1. Visit: https://www.kaggle.com/datasets/thedevastator/comprehensive-medical-q-a-dataset")
        print(f"  2. Download and extract to: {output_dir}")
        print()
        return False

def download_healthsearchqa():
    """Download HealthSearchQA from HuggingFace"""
    print("📥 Dataset 4: HealthSearchQA")
    print("-" * 70)
    print("Source: HuggingFace")
    print("Content: 3,173 consumer health questions")
    print()
    
    try:
        from datasets import load_dataset
        
        output_dir = Path("data/raw_datasets/healthsearchqa")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print("Loading from HuggingFace...")
        dataset = load_dataset("bigbio/health_fact")
        
        # Convert to JSON
        data = []
        for item in dataset['train']:
            data.append({
                'question': item.get('claim', ''),
                'answer': item.get('explanation', ''),
                'label': item.get('label', '')
            })
        
        output_file = output_dir / "health_qa.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Saved {len(data)} Q&A pairs to: {output_file}")
        print()
        return True
        
    except Exception as e:
        print(f"⚠️ Error: {e}")
        print()
        return False

def setup_kaggle_api():
    """Guide user to setup Kaggle API"""
    print("=" * 70)
    print("KAGGLE API SETUP REQUIRED")
    print("=" * 70)
    print()
    print("To download datasets from Kaggle, you need to:")
    print()
    print("1. Create a Kaggle account at: https://www.kaggle.com")
    print("2. Go to: https://www.kaggle.com/settings/account")
    print("3. Scroll to 'API' section and click 'Create New Token'")
    print("4. This downloads kaggle.json file")
    print("5. Place kaggle.json in: C:\\Users\\<YourUsername>\\.kaggle\\")
    print()
    print("Press Enter when ready to continue...")
    input()

def main():
    print("This script will download pediatric-specific datasets:")
    print("  1. Disease-Symptom Dataset (Kaggle)")
    print("  2. AI Symptom Checker (Kaggle)")
    print("  3. Medical QA Dataset (Kaggle)")
    print("  4. HealthSearchQA (HuggingFace)")
    print()
    
    # Install dependencies
    install_kaggle()
    
    # Check if Kaggle is configured
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if not kaggle_json.exists():
        setup_kaggle_api()
    
    success_count = 0
    total_count = 4
    
    # Download datasets
    if download_disease_symptom_dataset():
        success_count += 1
    
    if download_symptom_checker_dataset():
        success_count += 1
    
    if download_medical_qa_dataset():
        success_count += 1
    
    if download_healthsearchqa():
        success_count += 1
    
    # Summary
    print("=" * 70)
    print("DOWNLOAD SUMMARY")
    print("=" * 70)
    print(f"Successful downloads: {success_count}/{total_count}")
    print()
    
    if success_count > 0:
        print("✓ Datasets downloaded successfully!")
        print()
        print("Next steps:")
        print("  1. Preprocess: python scripts\\preprocess_pediatric_datasets.py")
        print("  2. Ingest: python scripts\\ingest_full_datasets.py")
        print()
    else:
        print("⚠️ No datasets were downloaded")
        print("Please check the errors above and try manual downloads")
        print()

if __name__ == "__main__":
    main()
