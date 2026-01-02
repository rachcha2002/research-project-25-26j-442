"""
Ingest Full Datasets into RAG Vector Store
Loads processed datasets and creates vector embeddings
"""
import sys
import json
from pathlib import Path
from tqdm import tqdm

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

print("=" * 70)
print("INGESTING FULL DATASETS INTO RAG SYSTEM")
print("=" * 70)
print()

try:
    from services.embedding_service import EmbeddingService
    from services.vector_store import VectorStore
    from services.ingestion_service import IngestionService
    from models.schemas import Document
    
    print("✓ Services imported successfully")
    print()
    
    # Initialize ingestion service (it will create its own embedding and vector store)
    print("Initializing RAG services...")
    ingestion_service = IngestionService()
    print("  ✓ Ingestion service initialized")
    print()
    
    # Find all processed files
    processed_dir = Path("data/processed")
    processed_files = list(processed_dir.glob("*_processed.json"))
    
    if not processed_files:
        print("✗ No processed files found in data/processed/")
        print()
        print("Please run preprocessing first:")
        print("  python scripts\\preprocess_full_datasets.py")
        sys.exit(1)
    
    print(f"Found {len(processed_files)} processed dataset(s)")
    print()
    
    total_ingested = 0
    batch_size = 100
    
    for processed_file in processed_files:
        print(f"📥 Ingesting: {processed_file.name}")
        print("-" * 70)
        
        with open(processed_file, 'r', encoding='utf-8') as f:
            raw_documents = json.load(f)
        
        print(f"  Documents to ingest: {len(raw_documents)}")
        
        # Convert to Document objects
        documents = []
        for item in raw_documents:
            doc = Document(
                text=item.get('text', ''),
                source=item.get('source', 'Unknown'),
                metadata=item.get('metadata', {})
            )
            documents.append(doc)
        
        # Ingest in batches
        for i in tqdm(range(0, len(documents), batch_size), desc="  Progress"):
            batch = documents[i:i + batch_size]
            ingestion_service.ingest_documents(batch)
        
        total_ingested += len(documents)
        print(f"  ✓ Ingested {len(documents)} documents")
        print()
    
    # Save vector store
    print("💾 Saving vector store...")
    ingestion_service.vector_store.save()
    print("✓ Vector store saved")
    print()
    
    # Get stats
    stats = ingestion_service.vector_store.get_stats()
    
    print("=" * 70)
    print("INGESTION COMPLETE!")
    print("=" * 70)
    print(f"Total documents ingested: {total_ingested}")
    print(f"Vector store size: {stats.get('total_documents', 0)} documents")
    print(f"Embedding dimension: {stats.get('embedding_dimension', 0)}")
    print(f"Model: {stats.get('model_name', 'N/A')}")
    print("=" * 70)
    print()
    print("✓ RAG service is ready to use!")
    print()
    print("Next steps:")
    print("  1. Start the service: python main.py")
    print("  2. Test retrieval: curl http://localhost:3002/api/rag/stats")
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
    print()
    sys.exit(1)
