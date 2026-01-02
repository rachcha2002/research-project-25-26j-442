"""
All-in-One Dataset Integration Script
Downloads, preprocesses, and ingests medical datasets into RAG system
Downloads FULL datasets from HuggingFace
"""
import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Any
import argparse
import time

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

print("=" * 70)
print("FULL DATASET DOWNLOAD & INTEGRATION")
print("=" * 70)
print()

class AllInOneDatasetSetup:
    """Complete dataset setup in one script"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.raw_dir = self.data_dir / "raw_datasets"
        self.processed_dir = self.data_dir / "processed"
        
        # Create directories
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Data directory: {self.data_dir}")
        logger.info(f"Raw datasets: {self.raw_dir}")
        logger.info(f"Processed: {self.processed_dir}")
    
    def download_medquad_dataset(self) -> bool:
        """Download MedQuad dataset from HuggingFace"""
        logger.info("=" * 60)
        logger.info("STEP 1: Downloading MedQuad Dataset from HuggingFace")
        logger.info("=" * 60)
        
        try:
            from datasets import load_dataset
            
            logger.info("Loading MedQuad dataset from HuggingFace...")
            dataset = load_dataset("keivalya/MedQuad-MedicalQnADataset")
            
            # Save to JSON
            output_dir = self.raw_dir / "medquad"
            output_dir.mkdir(exist_ok=True)
            output_file = output_dir / "medical_qa.json"
            
            logger.info("Converting to JSON format...")
            data = []
            for item in tqdm(dataset['train'], desc="Processing records"):
                data.append({
                    "question": item.get('question', ''),
                    "answer": item.get('answer', ''),
                    "source": item.get('source', 'MedQuad'),
                    "specialty": item.get('focus_area', 'General')
                })
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✓ Downloaded {len(data)} Q&A pairs to {output_file}")
            return True
            
        except ImportError:
            logger.error("HuggingFace datasets library not installed!")
            logger.info("Installing datasets library...")
            os.system("pip install datasets")
            return self.download_medquad_dataset()
            
        except Exception as e:
            logger.error(f"Error downloading MedQuad: {e}")
            return False
    
    def download_meddialog_huggingface(self) -> bool:
        """Download MedDialog from HuggingFace"""
        logger.info("=" * 60)
        logger.info("STEP 2: Downloading MedDialog Dataset from HuggingFace")
        logger.info("=" * 60)
        
        try:
            from datasets import load_dataset
            
            logger.info("Loading MedDialog dataset...")
            # Try the bigbio version
            dataset = load_dataset("bigbio/meddialog", "meddialog_en_source")
            
            output_dir = self.raw_dir / "meddialog"
            output_dir.mkdir(exist_ok=True)
            output_file = output_dir / "dialogues.json"
            
            logger.info("Converting dialogues to JSON format...")
            data = []
            
            for item in tqdm(dataset['train'], desc="Processing dialogues"):
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
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✓ Downloaded {len(data)} dialogues to {output_file}")
            return True
            
        except Exception as e:
            logger.warning(f"Could not download MedDialog from HuggingFace: {e}")
            logger.info("Skipping MedDialog dataset...")
            return False
    
    def preprocess_medquad(self, filter_pediatric: bool = True) -> List[Dict]:
        """Preprocess MedQuad dataset"""
        logger.info("=" * 60)
        logger.info("STEP 3: Preprocessing MedQuad Dataset")
        logger.info("=" * 60)
        
        medquad_file = self.raw_dir / "medquad" / "medical_qa.json"
        
        if not medquad_file.exists():
            logger.warning(f"MedQuad file not found: {medquad_file}")
            return []
        
        with open(medquad_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        processed_docs = []
        pediatric_keywords = [
            'child', 'children', 'pediatric', 'infant', 'baby', 'toddler',
            'newborn', 'adolescent', 'teenager', 'kid', 'vaccination',
            'growth', 'development', 'milestone', 'breastfeeding'
        ]
        
        for item in tqdm(data, desc="Processing MedQuad"):
            question = item.get('question', '')
            answer = item.get('answer', '')
            
            if not question or not answer:
                continue
            
            # Format as dialogue
            dialogue_text = f"Patient Question: {question}\n\nDoctor Answer: {answer}"
            
            # Filter for pediatric content if requested
            if filter_pediatric:
                text_lower = (question + " " + answer).lower()
                specialty = item.get('specialty', '').lower()
                
                if 'pediatric' not in specialty and not any(kw in text_lower for kw in pediatric_keywords):
                    continue
            
            doc = {
                'text': dialogue_text.strip(),
                'source': f"MedQuad - {item.get('specialty', 'General')}",
                'metadata': {
                    'specialty': item.get('specialty', 'General'),
                    'source_dataset': item.get('source', 'MedQuad'),
                    'dataset': 'MedQuad'
                }
            }
            processed_docs.append(doc)
        
        logger.info(f"✓ Processed {len(processed_docs)} pediatric documents from MedQuad")
        return processed_docs
    
    def preprocess_meddialog(self, filter_pediatric: bool = True) -> List[Dict]:
        """Preprocess MedDialog dataset"""
        logger.info("=" * 60)
        logger.info("STEP 4: Preprocessing MedDialog Dataset")
        logger.info("=" * 60)
        
        meddialog_file = self.raw_dir / "meddialog" / "dialogues.json"
        
        if not meddialog_file.exists():
            logger.warning(f"MedDialog file not found: {meddialog_file}")
            return []
        
        with open(meddialog_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        processed_docs = []
        pediatric_keywords = [
            'child', 'children', 'pediatric', 'infant', 'baby', 'toddler',
            'newborn', 'adolescent', 'teenager', 'kid', 'vaccination',
            'growth', 'development', 'milestone', 'breastfeeding'
        ]
        
        for item in tqdm(data, desc="Processing MedDialog"):
            dialogue_text = item.get('dialogue', '')
            
            if not dialogue_text:
                continue
            
            metadata = {
                'category': item.get('category', 'general'),
                'specialty': item.get('specialty', 'general'),
                'dataset': 'MedDialog'
            }
            
            # Filter for pediatric content if requested
            if filter_pediatric:
                text_lower = dialogue_text.lower()
                specialty = metadata.get('specialty', '').lower()
                
                if 'pediatric' not in specialty and not any(kw in text_lower for kw in pediatric_keywords):
                    continue
            
            doc = {
                'text': dialogue_text.strip(),
                'source': 'MedDialog - Online Health Forums',
                'metadata': metadata
            }
            processed_docs.append(doc)
        
        logger.info(f"✓ Processed {len(processed_docs)} pediatric documents from MedDialog")
        return processed_docs
    
    def save_processed_data(self, documents: List[Dict], dataset_name: str):
        """Save processed documents to JSON"""
        if not documents:
            logger.warning(f"No documents to save for {dataset_name}")
            return
        
        output_file = self.processed_dir / f"{dataset_name}_processed.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(documents, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✓ Saved {len(documents)} documents to {output_file}")
    
    def ingest_into_rag(self, batch_size: int = 100):
        """Ingest all processed datasets into RAG system"""
        logger.info("=" * 60)
        logger.info("STEP 5: Ingesting Datasets into RAG System")
        logger.info("=" * 60)
        
        try:
            # Import RAG services
            from services.embedding_service import EmbeddingService
            from services.vector_store import VectorStore
            from services.ingestion_service import IngestionService
            
            # Initialize services
            logger.info("Initializing RAG services...")
            embedding_service = EmbeddingService()
            vector_store = VectorStore(embedding_service)
            ingestion_service = IngestionService(vector_store)
            
            # Find all processed files
            processed_files = list(self.processed_dir.glob("*_processed.json"))
            
            if not processed_files:
                logger.warning("No processed files found!")
                return False
            
            total_ingested = 0
            
            for processed_file in processed_files:
                logger.info(f"\nIngesting {processed_file.name}...")
                
                with open(processed_file, 'r', encoding='utf-8') as f:
                    documents = json.load(f)
                
                # Ingest in batches
                for i in tqdm(range(0, len(documents), batch_size), desc="Ingesting batches"):
                    batch = documents[i:i + batch_size]
                    ingestion_service.ingest_documents(batch)
                
                total_ingested += len(documents)
                logger.info(f"✓ Ingested {len(documents)} documents from {processed_file.name}")
            
            logger.info(f"\n✓ Total documents ingested: {total_ingested}")
            
            # Save vector store
            vector_store.save()
            logger.info("✓ Vector store saved successfully")
            
            return True
            
        except Exception as e:
            logger.error(f"Error during ingestion: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def run_complete_setup(self, filter_pediatric: bool = True, batch_size: int = 100):
        """Run the complete setup process"""
        logger.info("\n" + "=" * 60)
        logger.info("ALL-IN-ONE DATASET SETUP")
        logger.info("=" * 60)
        logger.info(f"Pediatric filtering: {'ON' if filter_pediatric else 'OFF'}")
        logger.info(f"Batch size: {batch_size}")
        logger.info("=" * 60 + "\n")
        
        # Step 1: Download MedQuad
        if not self.download_medquad_dataset():
            logger.warning("MedQuad download failed, continuing with other datasets...")
        
        # Step 2: Download MedDialog
        if not self.download_meddialog_huggingface():
            logger.warning("MedDialog download failed, continuing...")
        
        # Step 3: Preprocess MedQuad
        medquad_docs = self.preprocess_medquad(filter_pediatric)
        if medquad_docs:
            self.save_processed_data(medquad_docs, 'medquad')
        
        # Step 4: Preprocess MedDialog
        meddialog_docs = self.preprocess_meddialog(filter_pediatric)
        if meddialog_docs:
            self.save_processed_data(meddialog_docs, 'meddialog')
        
        # Step 5: Ingest into RAG
        success = self.ingest_into_rag(batch_size)
        
        # Final summary
        logger.info("\n" + "=" * 60)
        logger.info("SETUP COMPLETE!")
        logger.info("=" * 60)
        logger.info(f"MedQuad documents: {len(medquad_docs)}")
        logger.info(f"MedDialog documents: {len(meddialog_docs)}")
        logger.info(f"Total documents: {len(medquad_docs) + len(meddialog_docs)}")
        logger.info(f"Ingestion status: {'SUCCESS' if success else 'FAILED'}")
        logger.info("=" * 60)
        
        if success:
            logger.info("\n✓ RAG service is ready to use!")
            logger.info("Start the service with: python main.py")
        else:
            logger.error("\n✗ Setup completed with errors. Check logs above.")

def main():
    parser = argparse.ArgumentParser(description='All-in-one dataset setup')
    parser.add_argument(
        '--no-filter',
        action='store_true',
        help='Disable pediatric filtering (include all medical content)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Batch size for ingestion (default: 100)'
    )
    parser.add_argument(
        '--data-dir',
        default='data',
        help='Data directory (default: data)'
    )
    
    args = parser.parse_args()
    
    setup = AllInOneDatasetSetup(args.data_dir)
    setup.run_complete_setup(
        filter_pediatric=not args.no_filter,
        batch_size=args.batch_size
    )

if __name__ == "__main__":
    main()
