"""
Preprocess Full Medical Datasets
Processes downloaded datasets and filters for pediatric content
"""
import json
from pathlib import Path
from tqdm import tqdm

print("=" * 70)
print("PREPROCESSING FULL MEDICAL DATASETS")
print("=" * 70)
print()

# Pediatric keywords for filtering
PEDIATRIC_KEYWORDS = [
    'child', 'children', 'pediatric', 'paediatric', 'infant', 'baby', 
    'toddler', 'newborn', 'adolescent', 'teenager', 'teen', 'kid', 'kids',
    'vaccination', 'vaccine', 'immunization', 'growth', 'development', 
    'milestone', 'breastfeeding', 'formula', 'diaper', 'neonatal',
    'premature', 'preterm', 'kindergarten', 'school-age', 'puberty'
]

def is_pediatric(text: str, metadata: dict = None) -> bool:
    """Check if content is pediatric-related"""
    text_lower = text.lower()
    
    # Check specialty
    if metadata:
        specialty = metadata.get('specialty', '').lower()
        if 'pediatric' in specialty or 'paediatric' in specialty:
            return True
    
    # Check for keywords
    return any(keyword in text_lower for keyword in PEDIATRIC_KEYWORDS)

def preprocess_medquad(filter_pediatric=True):
    """Preprocess MedQuad dataset"""
    print("📝 PREPROCESSING: MedQuad")
    print("-" * 70)
    
    input_file = Path("data/raw_datasets/medquad/medical_qa.json")
    
    if not input_file.exists():
        print(f"✗ File not found: {input_file}")
        print()
        return []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} Q&A pairs")
    
    processed_docs = []
    
    for item in tqdm(data, desc="Processing"):
        question = item.get('question', '')
        answer = item.get('answer', '')
        
        if not question or not answer:
            continue
        
        # Format as dialogue
        dialogue_text = f"Patient Question: {question}\n\nDoctor Answer: {answer}"
        
        metadata = {
            'specialty': item.get('specialty', 'General'),
            'source_dataset': item.get('source', 'MedQuad'),
            'dataset': 'MedQuad'
        }
        
        # Filter for pediatric content if requested
        if filter_pediatric and not is_pediatric(dialogue_text, metadata):
            continue
        
        doc = {
            'text': dialogue_text.strip(),
            'source': f"MedQuad - {metadata['specialty']}",
            'metadata': metadata
        }
        processed_docs.append(doc)
    
    print(f"✓ Processed {len(processed_docs)} documents")
    print()
    return processed_docs

def preprocess_meddialog(filter_pediatric=True):
    """Preprocess MedDialog dataset"""
    print("📝 PREPROCESSING: MedDialog")
    print("-" * 70)
    
    input_file = Path("data/raw_datasets/meddialog/dialogues.json")
    
    if not input_file.exists():
        print(f"✗ File not found: {input_file}")
        print()
        return []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} dialogues")
    
    processed_docs = []
    
    for item in tqdm(data, desc="Processing"):
        dialogue_text = item.get('dialogue', '')
        
        if not dialogue_text:
            continue
        
        metadata = {
            'category': item.get('category', 'general'),
            'specialty': item.get('specialty', 'general'),
            'dataset': 'MedDialog'
        }
        
        # Filter for pediatric content if requested
        if filter_pediatric and not is_pediatric(dialogue_text, metadata):
            continue
        
        doc = {
            'text': dialogue_text.strip(),
            'source': 'MedDialog - Online Health Forums',
            'metadata': metadata
        }
        processed_docs.append(doc)
    
    print(f"✓ Processed {len(processed_docs)} documents")
    print()
    return processed_docs

def preprocess_healthcaremagic(filter_pediatric=True):
    """Preprocess HealthCareMagic dataset"""
    print("📝 PREPROCESSING: HealthCareMagic")
    print("-" * 70)
    
    input_file = Path("data/raw_datasets/healthcaremagic/conversations.json")
    
    if not input_file.exists():
        print(f"✗ File not found: {input_file}")
        print()
        return []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} conversations")
    
    processed_docs = []
    
    for item in tqdm(data, desc="Processing"):
        question = item.get('question', '')
        answer = item.get('answer', '')
        
        if not question or not answer:
            continue
        
        # Format as dialogue
        dialogue_text = f"Patient: {question}\n\nDoctor: {answer}"
        
        metadata = {
            'specialty': item.get('specialty', 'General'),
            'source_dataset': 'HealthCareMagic',
            'dataset': 'HealthCareMagic'
        }
        
        # Filter for pediatric content if requested
        if filter_pediatric and not is_pediatric(dialogue_text, metadata):
            continue
        
        doc = {
            'text': dialogue_text.strip(),
            'source': 'HealthCareMagic - Medical Consultations',
            'metadata': metadata
        }
        processed_docs.append(doc)
    
    print(f"✓ Processed {len(processed_docs)} documents")
    print()
    return processed_docs

def save_processed_data(documents, dataset_name):
    """Save processed documents to JSON"""
    if not documents:
        print(f"⚠ No documents to save for {dataset_name}")
        return
    
    output_dir = Path("data/processed")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = output_dir / f"{dataset_name}_processed.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(documents, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved to: {output_file}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Preprocess full medical datasets')
    parser.add_argument(
        '--no-filter',
        action='store_true',
        help='Disable pediatric filtering (include all medical content)'
    )
    parser.add_argument(
        '--dataset',
        choices=['medquad', 'meddialog', 'healthcaremagic', 'all'],
        default='all',
        help='Which dataset to preprocess'
    )
    
    args = parser.parse_args()
    filter_pediatric = not args.no_filter
    
    print(f"Pediatric filtering: {'ON' if filter_pediatric else 'OFF'}")
    print()
    
    all_docs = []
    
    if args.dataset == 'all' or args.dataset == 'medquad':
        docs = preprocess_medquad(filter_pediatric)
        if docs:
            save_processed_data(docs, 'medquad')
            all_docs.extend(docs)
    
    if args.dataset == 'all' or args.dataset == 'meddialog':
        docs = preprocess_meddialog(filter_pediatric)
        if docs:
            save_processed_data(docs, 'meddialog')
            all_docs.extend(docs)
    
    if args.dataset == 'all' or args.dataset == 'healthcaremagic':
        docs = preprocess_healthcaremagic(filter_pediatric)
        if docs:
            save_processed_data(docs, 'healthcaremagic')
            all_docs.extend(docs)
    
    # Save combined dataset
    if all_docs:
        save_processed_data(all_docs, 'all_combined')
    
    # Summary
    print("=" * 70)
    print("PREPROCESSING SUMMARY")
    print("=" * 70)
    print(f"Total documents processed: {len(all_docs)}")
    print()
    print("✓ Preprocessing complete!")
    print()
    print("Next step:")
    print("  python scripts\\ingest_full_datasets.py")
    print()

if __name__ == "__main__":
    main()
