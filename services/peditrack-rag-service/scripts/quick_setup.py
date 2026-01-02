"""
Quick Setup Script - Uses sample data to get started immediately
"""
import os
import sys
import json
from pathlib import Path
from tqdm import tqdm

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

print("=" * 60)
print("QUICK SETUP - RAG Service with Sample Data")
print("=" * 60)
print()

try:
    from services.embedding_service import EmbeddingService
    from services.vector_store import VectorStore
    from services.ingestion_service import IngestionService
    from utils.logger import setup_logger
    
    logger = setup_logger(__name__)
    
    print("✓ Imports successful")
    print()
    
    # Initialize services
    print("Initializing RAG services...")
    embedding_service = EmbeddingService()
    print("✓ Embedding service initialized")
    
    vector_store = VectorStore(embedding_service)
    print("✓ Vector store initialized")
    
    ingestion_service = IngestionService(vector_store)
    print("✓ Ingestion service initialized")
    print()
    
    # Load sample data
    data_dir = Path("data")
    sample_files = [
        data_dir / "sample_pediatric_docs.json",
        data_dir / "sample_medical_dialogues.json"
    ]
    
    total_docs = 0
    
    for sample_file in sample_files:
        if sample_file.exists():
            print(f"Loading {sample_file.name}...")
            with open(sample_file, 'r', encoding='utf-8') as f:
                documents = json.load(f)
            
            print(f"  Found {len(documents)} documents")
            print(f"  Ingesting...")
            
            # Ingest documents
            ingestion_service.ingest_documents(documents)
            total_docs += len(documents)
            
            print(f"  ✓ Ingested {len(documents)} documents")
            print()
        else:
            print(f"⚠ {sample_file.name} not found, skipping...")
            print()
    
    # Save vector store
    print("Saving vector store...")
    vector_store.save()
    print("✓ Vector store saved")
    print()
    
    # Get stats
    stats = vector_store.get_stats()
    
    print("=" * 60)
    print("SETUP COMPLETE!")
    print("=" * 60)
    print(f"Total documents ingested: {total_docs}")
    print(f"Vector store size: {stats.get('total_documents', 0)} documents")
    print(f"Embedding dimension: {stats.get('embedding_dimension', 0)}")
    print("=" * 60)
    print()
    print("✓ RAG service is ready to use!")
    print()
    print("Next steps:")
    print("  1. Start the service: python main.py")
    print("  2. Test retrieval: curl http://localhost:3002/api/rag/stats")
    print()
    print("To add more datasets, run:")
    print("  python scripts\\setup_datasets_all_in_one.py")
    print()
    
except Exception as e:
    print()
    print("=" * 60)
    print("ERROR OCCURRED")
    print("=" * 60)
    print(f"Error: {e}")
    print()
    import traceback
    traceback.print_exc()
    print()
    print("Troubleshooting:")
    print("  1. Make sure virtual environment is activated")
    print("  2. Run: pip install -r requirements.txt")
    print("  3. Check that data/sample_*.json files exist")
    print()
    sys.exit(1)
