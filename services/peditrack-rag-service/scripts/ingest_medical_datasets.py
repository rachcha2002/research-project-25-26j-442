"""
Ingest preprocessed medical dialogue datasets into RAG system
Handles batch ingestion with progress tracking and error recovery
"""
import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict
from tqdm import tqdm

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.ingestion_service import get_ingestion_service
from models.schemas import Document
from utils.logger import setup_logger
from dotenv import load_dotenv

# Load environment
load_dotenv()

logger = setup_logger(__name__)

class MedicalDatasetIngester:
    """Ingest medical datasets into RAG system"""
    
    def __init__(self, batch_size: int = 100):
        self.ingestion_service = get_ingestion_service()
        self.batch_size = batch_size
        logger.info(f"Initialized ingester with batch size: {batch_size}")
    
    def ingest_dataset(self, dataset_path: Path, dataset_name: str) -> int:
        """Ingest a single dataset file"""
        logger.info(f"Ingesting {dataset_name} from {dataset_path}")
        
        if not dataset_path.exists():
            logger.error(f"Dataset file not found: {dataset_path}")
            return 0
        
        try:
            # Load dataset
            with open(dataset_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                logger.error(f"Expected list of documents, got {type(data)}")
                return 0
            
            total_docs = len(data)
            logger.info(f"Loaded {total_docs} documents")
            
            # Process in batches
            total_ingested = 0
            
            for i in tqdm(range(0, total_docs, self.batch_size), desc=f"Ingesting {dataset_name}"):
                batch = data[i:i + self.batch_size]
                
                # Convert to Document objects
                documents = []
                for j, item in enumerate(batch):
                    doc = Document(
                        text=item.get('text', ''),
                        source=item.get('source', dataset_name),
                        metadata={
                            **item.get('metadata', {}),
                            'dataset_name': dataset_name,
                            'batch_id': i // self.batch_size
                        },
                        doc_id=f"{dataset_name}_{i+j}"
                    )
                    documents.append(doc)
                
                # Ingest batch
                try:
                    count = self.ingestion_service.ingest_documents(documents)
                    total_ingested += count
                except Exception as e:
                    logger.error(f"Error ingesting batch {i//self.batch_size}: {e}")
                    continue
            
            logger.info(f"✓ Successfully ingested {total_ingested}/{total_docs} documents from {dataset_name}")
            return total_ingested
            
        except Exception as e:
            logger.error(f"Error ingesting {dataset_name}: {e}")
            return 0
    
    def ingest_all_datasets(self, processed_dir: Path) -> Dict[str, int]:
        """Ingest all processed datasets"""
        results = {}
        
        # Find all processed dataset files
        dataset_files = list(processed_dir.glob("*_processed.json"))
        
        if not dataset_files:
            logger.warning(f"No processed datasets found in {processed_dir}")
            logger.info("Run preprocessing first: python scripts/preprocess_medical_datasets.py")
            return results
        
        logger.info(f"Found {len(dataset_files)} dataset files")
        
        for dataset_file in dataset_files:
            dataset_name = dataset_file.stem.replace('_processed', '')
            count = self.ingest_dataset(dataset_file, dataset_name)
            results[dataset_name] = count
        
        return results
    
    def print_summary(self, results: Dict[str, int]):
        """Print ingestion summary"""
        logger.info("\n" + "="*60)
        logger.info("INGESTION SUMMARY")
        logger.info("="*60)
        
        total = 0
        for dataset_name, count in results.items():
            logger.info(f"  {dataset_name:20s}: {count:,} documents")
            total += count
        
        logger.info("-"*60)
        logger.info(f"  {'TOTAL':20s}: {total:,} documents")
        logger.info("="*60)

def main():
    parser = argparse.ArgumentParser(description='Ingest medical datasets into RAG system')
    parser.add_argument(
        '--dataset',
        help='Specific dataset to ingest (e.g., meddialog_processed.json)'
    )
    parser.add_argument(
        '--processed-dir',
        default='data/processed',
        help='Directory with processed datasets'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Batch size for ingestion'
    )
    
    args = parser.parse_args()
    
    processed_dir = Path(args.processed_dir)
    
    if not processed_dir.exists():
        logger.error(f"Processed directory not found: {processed_dir}")
        logger.info("Run preprocessing first: python scripts/preprocess_medical_datasets.py")
        sys.exit(1)
    
    ingester = MedicalDatasetIngester(batch_size=args.batch_size)
    
    logger.info("="*60)
    logger.info("Medical Dataset Ingestion")
    logger.info("="*60)
    
    if args.dataset:
        # Ingest specific dataset
        dataset_path = processed_dir / args.dataset
        dataset_name = Path(args.dataset).stem.replace('_processed', '')
        count = ingester.ingest_dataset(dataset_path, dataset_name)
        results = {dataset_name: count}
    else:
        # Ingest all datasets
        results = ingester.ingest_all_datasets(processed_dir)
    
    # Print summary
    ingester.print_summary(results)
    
    logger.info("\n" + "="*60)
    logger.info("Next steps:")
    logger.info("="*60)
    logger.info("1. Check RAG statistics:")
    logger.info("   curl http://localhost:3002/api/rag/stats")
    logger.info("\n2. Test retrieval:")
    logger.info("   curl -X POST http://localhost:3002/api/rag/retrieve \\")
    logger.info("     -H 'Content-Type: application/json' \\")
    logger.info("     -d '{\"query\": \"What are common childhood illnesses?\", \"top_k\": 3}'")

if __name__ == "__main__":
    main()
