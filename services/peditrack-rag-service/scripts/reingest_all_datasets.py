"""
Re-ingest ALL Datasets into RAG Vector Store with GPU Acceleration
Combines all processed datasets into a single vector store
"""
import sys
import json
from pathlib import Path
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.ingestion_service import IngestionService
from models.schemas import Document

print("=" * 70)
print("RE-INGESTING ALL DATASETS WITH GPU ACCELERATION")
print("=" * 70)
print()

def load_and_ingest_all():
    """Load all processed datasets and ingest them"""
    
    # Initialize ingestion service (GPU will be auto-detected)
    print("🚀 Initializing services with GPU acceleration...")
    ingestion_service = IngestionService()
    print()
    
    # Find all processed files
    processed_dir = Path("data/processed")
    processed_files = list(processed_dir.glob("*_processed.json"))
    
    # Exclude combined files to avoid duplicates
    processed_files = [f for f in processed_files if 'combined' not in f.name.lower()]
    
    if not processed_files:
        print("✗ No processed files found!")
        return
    
    print(f"Found {len(processed_files)} dataset files:")
    for f in processed_files:
        print(f"  - {f.name}")
    print()
    
    # Clear existing vector store
    print("🗑️  Clearing existing vector store...")
    ingestion_service.vector_store.clear()
    print("✓ Vector store cleared")
    print()
    
    total_ingested = 0
    batch_size = 100
    
    # Process each dataset
    for processed_file in processed_files:
        print(f"📥 Ingesting: {processed_file.name}")
        print("-" * 70)
        
        try:
            with open(processed_file, 'r', encoding='utf-8') as f:
                raw_documents = json.load(f)
            
            print(f"  Loaded {len(raw_documents):,} documents")
            
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
            print(f"  Ingesting in batches of {batch_size}...")
            for i in tqdm(range(0, len(documents), batch_size), desc="  Progress"):
                batch = documents[i:i + batch_size]
                ingestion_service.ingest_documents(batch)
            
            total_ingested += len(documents)
            print(f"  ✓ Ingested {len(documents):,} documents")
            print()
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            print()
            continue
    
    # Save vector store
    print("💾 Saving vector store...")
    ingestion_service.vector_store.save()
    print("✓ Vector store saved")
    print()
    
    # Get final stats
    stats = ingestion_service.vector_store.get_stats()
    
    print("=" * 70)
    print("INGESTION COMPLETE!")
    print("=" * 70)
    print(f"Total documents ingested: {total_ingested:,}")
    print(f"Vector store size: {stats.get('total_documents', 0):,} documents")
    print(f"Embedding dimension: {stats.get('embedding_dimension', 0)}")
    print(f"Index size: {stats.get('index_size', 0):,} bytes")
    print("=" * 70)
    print()
    
    # Show dataset breakdown
    print("📊 DATASET BREAKDOWN")
    print("-" * 70)
    for f in processed_files:
        with open(f, 'r', encoding='utf-8') as file:
            data = json.load(file)
            dataset_name = f.stem.replace('_processed', '')
            print(f"  {dataset_name}: {len(data):,} documents")
    print("=" * 70)

if __name__ == "__main__":
    try:
        load_and_ingest_all()
        print()
        print("✅ All datasets successfully re-ingested with GPU acceleration!")
        print()
        print("Next steps:")
        print("  1. Start the service: start.bat")
        print("  2. Test retrieval: curl http://localhost:3002/api/rag/stats")
        print("  3. Visualize: python scripts\\visualize_vectors_detailed.py")
        print()
    except Exception as e:
        print()
        print("=" * 70)
        print("ERROR OCCURRED")
        print("=" * 70)
        print(f"Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        sys.exit(1)
