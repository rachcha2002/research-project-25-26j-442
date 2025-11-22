"""
Dataset ingestion script for RAG system
Supports JSON, CSV, and text files
"""
import sys
import os
import json
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.ingestion_service import get_ingestion_service
from models.schemas import Document
from utils.logger import setup_logger
from dotenv import load_dotenv

# Load environment
load_dotenv()

logger = setup_logger(__name__)

def ingest_json_file(file_path: str) -> int:
    """Ingest documents from a JSON file"""
    logger.info(f"Ingesting from JSON file: {file_path}")
    
    try:
        ingestion_service = get_ingestion_service()
        count = ingestion_service.ingest_from_json(file_path)
        logger.info(f"✓ Successfully ingested {count} documents from {file_path}")
        return count
    except Exception as e:
        logger.error(f"Failed to ingest {file_path}: {e}")
        raise

def ingest_text_file(file_path: str, source_name: str, chunk_size: int = 500) -> int:
    """Ingest a large text file with chunking"""
    logger.info(f"Ingesting from text file: {file_path}")
    
    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Get ingestion service
        ingestion_service = get_ingestion_service()
        
        # Chunk the text
        chunks = ingestion_service.chunk_text(content, chunk_size=chunk_size, overlap=50)
        
        # Create Document objects
        documents = []
        for i, chunk in enumerate(chunks):
            doc = Document(
                text=chunk,
                source=f"{source_name} (Part {i+1}/{len(chunks)})",
                metadata={"chunk_index": i, "total_chunks": len(chunks)},
                doc_id=f"{source_name}_{i}"
            )
            documents.append(doc)
        
        # Ingest
        count = ingestion_service.ingest_documents(documents)
        logger.info(f"✓ Successfully ingested {count} chunks from {file_path}")
        return count
        
    except Exception as e:
        logger.error(f"Failed to ingest {file_path}: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description='Ingest datasets into RAG system')
    parser.add_argument('--file', required=True, help='Path to the dataset file')
    parser.add_argument('--source', help='Source name (for text files)', default='Unknown Source')
    parser.add_argument('--chunk-size', type=int, default=500, help='Chunk size for text files')
    
    args = parser.parse_args()
    
    file_path = Path(args.file)
    
    if not file_path.exists():
        logger.error(f"File not found: {file_path}")
        sys.exit(1)
    
    # Determine file type and ingest
    if file_path.suffix == '.json':
        count = ingest_json_file(str(file_path))
    elif file_path.suffix in ['.txt', '.md']:
        count = ingest_text_file(str(file_path), args.source, args.chunk_size)
    else:
        logger.error(f"Unsupported file type: {file_path.suffix}")
        logger.info("Supported types: .json, .txt, .md")
        sys.exit(1)
    
    logger.info(f"\n{'='*50}")
    logger.info(f"Ingestion complete!")
    logger.info(f"Total documents added: {count}")
    logger.info(f"{'='*50}\n")
    logger.info("You can now query the RAG service:")
    logger.info("  curl -X POST http://localhost:3002/api/rag/retrieve \\")
    logger.info("    -H 'Content-Type: application/json' \\")
    logger.info("    -d '{\"query\": \"your question here\", \"top_k\": 3}'")

if __name__ == "__main__":
    main()
