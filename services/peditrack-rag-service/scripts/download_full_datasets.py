"""
Download FULL Medical Datasets from HuggingFace
This script downloads complete medical datasets for RAG integration
"""
import os
import sys
import json
from pathlib import Path
import argparse

print("=" * 70)
print("DOWNLOADING FULL MEDICAL DATASETS FROM HUGGINGFACE")
print("=" * 70)
print()

def download_medquad():
    """Download MedQuad dataset - 16K+ medical Q&A pairs"""
    print("📥 DOWNLOADING: MedQuad Medical QnA Dataset")
    print("-" * 70)
    
    try:
        from datasets import load_dataset
        from tqdm import tqdm
        
        print("Loading dataset from HuggingFace...")
        print("Source: keivalya/MedQuad-MedicalQnADataset")
        print()
        
        dataset = load_dataset("keivalya/MedQuad-MedicalQnADataset")
        
        # Create output directory
        output_dir = Path("data/raw_datasets/medquad")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"✓ Dataset loaded: {len(dataset['train'])} records")
        print("Converting to JSON format...")
        
        data = []
        for item in tqdm(dataset['train'], desc="Processing"):
            data.append({
                "question": item.get('question', ''),
                "answer": item.get('answer', ''),
                "source": item.get('source', 'MedQuad'),
                "specialty": item.get('focus_area', 'General'),
                "url": item.get('url', '')
            })
        
        # Save to JSON
        output_file = output_dir / "medical_qa.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Saved {len(data)} Q&A pairs to: {output_file}")
        print()
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False

def download_meddialog():
    """Download MedDialog dataset - 260K+ doctor-patient conversations"""
    print("📥 DOWNLOADING: MedDialog Dataset")
    print("-" * 70)
    
    try:
        from datasets import load_dataset
        from tqdm import tqdm
        
        print("Loading dataset from HuggingFace...")
        print("Source: bigbio/meddialog")
        print("Note: This is a large dataset, may take several minutes...")
        print()
        
        # Load English version
        dataset = load_dataset("bigbio/meddialog", "meddialog_en_source")
        
        # Create output directory
        output_dir = Path("data/raw_datasets/meddialog")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"✓ Dataset loaded: {len(dataset['train'])} dialogues")
        print("Converting to JSON format...")
        
        data = []
        for item in tqdm(dataset['train'], desc="Processing"):
            # Extract dialogue
            utterances = item.get('utterances', [])
            if utterances:
                dialogue_text = "\n".join([
                    f"{utt.get('speaker', 'Unknown')}: {utt.get('text', '')}"
                    for utt in utterances
                ])
                
                data.append({
                    "dialogue": dialogue_text,
                    "description": item.get('description', ''),
                    "utterances": utterances,
                    "category": item.get('category', 'general'),
                    "specialty": item.get('specialty', 'general')
                })
        
        # Save to JSON
        output_file = output_dir / "dialogues.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Saved {len(data)} dialogues to: {output_file}")
        print()
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False

def download_healthcareMagic():
    """Download HealthCareMagic dataset - 100K+ conversations"""
    print("📥 DOWNLOADING: HealthCareMagic Dataset")
    print("-" * 70)
    
    try:
        from datasets import load_dataset
        from tqdm import tqdm
        
        print("Loading dataset from HuggingFace...")
        print("Source: lavita/ChatDoctor-HealthCareMagic-100k")
        print()
        
        dataset = load_dataset("lavita/ChatDoctor-HealthCareMagic-100k")
        
        # Create output directory
        output_dir = Path("data/raw_datasets/healthcaremagic")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"✓ Dataset loaded: {len(dataset['train'])} conversations")
        print("Converting to JSON format...")
        
        data = []
        for item in tqdm(dataset['train'], desc="Processing"):
            instruction = item.get('instruction', '')
            input_text = item.get('input', '')
            output_text = item.get('output', '')
            
            if instruction or input_text:
                question = f"{instruction} {input_text}".strip()
                data.append({
                    "question": question,
                    "answer": output_text,
                    "source": "HealthCareMagic",
                    "specialty": "General"
                })
        
        # Save to JSON
        output_file = output_dir / "conversations.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Saved {len(data)} conversations to: {output_file}")
        print()
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False

def install_datasets_library():
    """Install HuggingFace datasets library if not available"""
    try:
        import datasets
        return True
    except ImportError:
        print("📦 Installing HuggingFace datasets library...")
        print()
        os.system("pip install datasets tqdm")
        print()
        return True

def main():
    parser = argparse.ArgumentParser(description='Download full medical datasets')
    parser.add_argument(
        '--dataset',
        choices=['medquad', 'meddialog', 'healthcaremagic', 'all'],
        default='all',
        help='Which dataset to download'
    )
    
    args = parser.parse_args()
    
    # Install dependencies
    if not install_datasets_library():
        print("✗ Failed to install required libraries")
        sys.exit(1)
    
    print("Starting dataset downloads...")
    print()
    
    success_count = 0
    total_count = 0
    
    if args.dataset == 'all' or args.dataset == 'medquad':
        total_count += 1
        if download_medquad():
            success_count += 1
    
    if args.dataset == 'all' or args.dataset == 'meddialog':
        total_count += 1
        if download_meddialog():
            success_count += 1
    
    if args.dataset == 'all' or args.dataset == 'healthcaremagic':
        total_count += 1
        if download_healthcareMagic():
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
        print("  1. Preprocess: python scripts\\preprocess_full_datasets.py")
        print("  2. Ingest: python scripts\\ingest_full_datasets.py")
        print()
    else:
        print("✗ No datasets were downloaded successfully")
        print("Check the errors above for details")
        print()

if __name__ == "__main__":
    main()
