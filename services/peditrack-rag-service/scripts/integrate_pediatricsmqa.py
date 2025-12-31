"""
Download and Integrate PediatricsMQA Dataset from HuggingFace
Specialized pediatric medical Q&A dataset with GPU acceleration
"""
import json
import sys
from pathlib import Path
from tqdm import tqdm

print("=" * 70)
print("PEDIATRICSMQA DATASET INTEGRATION (GPU ACCELERATED)")
print("=" * 70)
print()

def download_pediatricsmqa():
    """Download PediatricsMQA dataset from HuggingFace"""
    print("📥 Downloading PediatricsMQA Dataset")
    print("-" * 70)
    print("Source: HuggingFace - adlbh/PediatricsMQA")
    print("Content: Specialized pediatric medical Q&A")
    print()
    
    try:
        from datasets import load_dataset
        
        print("Loading dataset from HuggingFace...")
        print("Note: This may take a few minutes...")
        print()
        
        # Load the dataset (it only has 'test' split)
        dataset = load_dataset("adlbh/PediatricsMQA", "tqa")
        
        output_dir = Path("data/raw_datasets/pediatricsmqa")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"✓ Dataset loaded successfully")
        
        # Convert to JSON
        print("Converting to JSON format...")
        all_data = []
        
        for split_name in dataset.keys():
            print(f"Processing {split_name} split: {len(dataset[split_name])} examples")
            for item in tqdm(dataset[split_name], desc=f"  {split_name}"):
                data_item = {
                    'question': item.get('question', ''),
                    'answer': item.get('answer', ''),
                    'options': item.get('options', []),
                    'topic': item.get('topic', ''),
                    'age_group': item.get('age_group', ''),
                    'split': split_name
                }
                all_data.append(data_item)
        
        # Save to JSON
        output_file = output_dir / "pediatrics_qa.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)
        
        print()
        print(f"✓ Saved {len(all_data)} Q&A pairs to: {output_file}")
        print()
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False

def preprocess_pediatricsmqa():
    """Preprocess PediatricsMQA dataset"""
    print("📝 Preprocessing PediatricsMQA Dataset")
    print("-" * 70)
    
    input_file = Path("data/raw_datasets/pediatricsmqa/pediatrics_qa.json")
    
    if not input_file.exists():
        print(f"✗ File not found: {input_file}")
        return []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} Q&A pairs")
    print()
    
    processed_docs = []
    
    for item in tqdm(data, desc="Processing"):
        question = item.get('question', '')
        answer = item.get('answer', '')
        topic = item.get('topic', '')
        age_group = item.get('age_group', '')
        options = item.get('options', [])
        
        if not question:
            continue
        
        # Format the document
        text_parts = [f"Pediatric Medical Question: {question}"]
        
        if options and len(options) > 0:
            text_parts.append(f"\nOptions:")
            for i, opt in enumerate(options):
                text_parts.append(f"  {chr(65+i)}. {opt}")
        
        if answer:
            text_parts.append(f"\nCorrect Answer: {answer}")
        
        if topic:
            text_parts.append(f"\nTopic: {topic}")
        
        if age_group:
            text_parts.append(f"\nAge Group: {age_group}")
        
        text = "\n".join(text_parts)
        
        doc = {
            'text': text,
            'source': 'PediatricsMQA - Medical Exam Questions',
            'metadata': {
                'question': question,
                'answer': answer,
                'topic': topic,
                'age_group': age_group,
                'has_options': bool(options),
                'dataset': 'PediatricsMQA',
                'type': 'medical_qa_exam',
                'split': item.get('split', 'test')
            }
        }
        processed_docs.append(doc)
    
    print(f"✓ Processed {len(processed_docs)} pediatric Q&A documents")
    print()
    
    # Save processed data
    output_dir = Path("data/processed")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = output_dir / "pediatricsmqa_processed.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_docs, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved to: {output_file}")
    print()
    
    return processed_docs

def ingest_with_gpu():
    """Ingest using GPU-accelerated embeddings"""
    print("🚀 Ingesting with GPU Acceleration")
    print("-" * 70)
    
    sys.path.insert(0, str(Path(__file__).parent.parent))
    
    try:
        from services.ingestion_service import IngestionService
        from models.schemas import Document
        
        # Initialize ingestion service (will use GPU if available)
        print("Initializing services...")
        ingestion_service = IngestionService()
        print()
        
        # Load processed file
        processed_file = Path("data/processed/pediatricsmqa_processed.json")
        
        if not processed_file.exists():
            print(f"✗ Processed file not found: {processed_file}")
            return False
        
        with open(processed_file, 'r', encoding='utf-8') as f:
            raw_documents = json.load(f)
        
        print(f"📥 Ingesting {len(raw_documents)} documents...")
        print()
        
        # Convert to Document objects
        documents = []
        for item in raw_documents:
            doc = Document(
                text=item.get('text', ''),
                source=item.get('source', 'Unknown'),
                metadata=item.get('metadata', {})
            )
            documents.append(doc)
        
        # Ingest in batches with GPU
        batch_size = 100
        for i in tqdm(range(0, len(documents), batch_size), desc="Ingesting"):
            batch = documents[i:i + batch_size]
            ingestion_service.ingest_documents(batch)
        
        print()
        print(f"✓ Ingested {len(documents)} documents")
        print()
        
        # Get stats
        stats = ingestion_service.vector_store.get_stats()
        print("=" * 70)
        print("INTEGRATION COMPLETE!")
        print("=" * 70)
        print(f"Total documents in RAG: {stats.get('total_documents', 0)}")
        print(f"Embedding dimension: {stats.get('embedding_dimension', 0)}")
        print("=" * 70)
        print()
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("This script will:")
    print("  1. Download PediatricsMQA dataset from HuggingFace")
    print("  2. Preprocess the data")
    print("  3. Ingest into RAG with GPU acceleration")
    print()
    
    # Step 1: Download
    if not download_pediatricsmqa():
        print("Download failed. Exiting.")
        return
    
    # Step 2: Preprocess
    docs = preprocess_pediatricsmqa()
    if not docs:
        print("Preprocessing failed. Exiting.")
        return
    
    # Step 3: Ingest with GPU
    if not ingest_with_gpu():
        print("Ingestion failed.")
        return
    
    print("✅ PediatricsMQA dataset successfully integrated!")
    print()
    print("Your RAG system now includes specialized pediatric medical exam Q&A!")
    print()

if __name__ == "__main__":
    main()
