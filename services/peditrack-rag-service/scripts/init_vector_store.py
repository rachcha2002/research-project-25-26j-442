"""
Initialize the vector store with sample pediatric health documents
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.ingestion_service import get_ingestion_service
from utils.logger import setup_logger
from dotenv import load_dotenv

# Load environment
load_dotenv()

logger = setup_logger(__name__)

def main():
    """Initialize vector store with sample data"""
    logger.info("Initializing vector store with sample pediatric documents...")
    
    try:
        # Get ingestion service
        ingestion_service = get_ingestion_service()
        
        # Path to sample data
        data_path = Path(__file__).parent.parent / "data" / "sample_pediatric_docs.json"
        
        if not data_path.exists():
            logger.error(f"Sample data file not found: {data_path}")
            return
        
        # Ingest documents
        logger.info(f"Loading documents from {data_path}")
        count = ingestion_service.ingest_from_json(str(data_path))
        
        logger.info(f"✓ Successfully initialized vector store with {count} documents")
        logger.info("You can now start the RAG service with: python main.py")
        
    except Exception as e:
        logger.error(f"Initialization failed: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    main()
