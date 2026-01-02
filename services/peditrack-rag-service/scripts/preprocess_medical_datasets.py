"""
Preprocess medical dialogue datasets for RAG ingestion
Converts MedDialog, MediTOD, and Defined.ai datasets into standardized format
"""
import os
import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
import argparse
from tqdm import tqdm

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.logger import setup_logger

logger = setup_logger(__name__)

class MedicalDatasetPreprocessor:
    """Preprocess medical dialogue datasets"""
    
    def __init__(self, raw_dir: str = "data/raw_datasets", output_dir: str = "data/processed"):
        self.raw_dir = Path(raw_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Raw data: {self.raw_dir}")
        logger.info(f"Output: {self.output_dir}")
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep medical terms
        text = text.strip()
        
        return text
    
    def extract_pediatric_content(self, text: str, metadata: Dict) -> bool:
        """Check if content is pediatric-related"""
        pediatric_keywords = [
            'child', 'children', 'pediatric', 'infant', 'baby', 'toddler',
            'newborn', 'adolescent', 'teenager', 'kid', 'vaccination',
            'growth', 'development', 'milestone', 'breastfeeding'
        ]
        
        text_lower = text.lower()
        specialty = metadata.get('specialty', '').lower()
        
        # Check if pediatrics is mentioned
        if 'pediatric' in specialty or 'pediatrics' in specialty:
            return True
        
        # Check for pediatric keywords
        return any(keyword in text_lower for keyword in pediatric_keywords)
    
    def preprocess_meddialog(self, filter_pediatric: bool = True) -> List[Dict]:
        """Preprocess MedDialog dataset"""
        logger.info("Processing MedDialog dataset...")
        
        meddialog_dir = self.raw_dir / "meddialog"
        processed_docs = []
        
        # Look for JSON files in the directory
        json_files = list(meddialog_dir.glob("*.json"))
        
        if not json_files:
            logger.warning(f"No JSON files found in {meddialog_dir}")
            logger.info("Please download MedDialog from: https://github.com/UCSD-AI4H/Medical-Dialogue-System")
            return []
        
        for json_file in json_files:
            logger.info(f"Processing {json_file.name}...")
            
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Process dialogues
                if isinstance(data, list):
                    for item in tqdm(data, desc="Processing dialogues"):
                        # Extract dialogue
                        if 'utterances' in item:
                            dialogue_text = self._format_dialogue(item['utterances'])
                        elif 'description' in item and 'dialogue' in item:
                            dialogue_text = f"Patient: {item['description']}\nDoctor: {item['dialogue']}"
                        else:
                            continue
                        
                        metadata = {
                            'category': item.get('category', 'general'),
                            'specialty': item.get('specialty', 'general'),
                            'dataset': 'MedDialog'
                        }
                        
                        # Filter for pediatric content if requested
                        if filter_pediatric and not self.extract_pediatric_content(dialogue_text, metadata):
                            continue
                        
                        doc = {
                            'text': self.clean_text(dialogue_text),
                            'source': 'MedDialog - Online Health Forums',
                            'metadata': metadata
                        }
                        processed_docs.append(doc)
                
                logger.info(f"✓ Processed {len(processed_docs)} documents from {json_file.name}")
                
            except Exception as e:
                logger.error(f"Error processing {json_file}: {e}")
        
        return processed_docs
    
    def preprocess_meditod(self, filter_pediatric: bool = True) -> List[Dict]:
        """Preprocess MediTOD dataset"""
        logger.info("Processing MediTOD dataset...")
        
        meditod_dir = self.raw_dir / "meditod"
        processed_docs = []
        
        json_files = list(meditod_dir.glob("*.json"))
        
        if not json_files:
            logger.warning(f"No JSON files found in {meditod_dir}")
            logger.info("Please download MediTOD from: https://github.com/UCSD-AI4H/MediTOD")
            return []
        
        for json_file in json_files:
            logger.info(f"Processing {json_file.name}...")
            
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Process annotated utterances
                if isinstance(data, list):
                    for item in tqdm(data, desc="Processing utterances"):
                        # Extract dialogue
                        dialogue_text = item.get('dialogue', '')
                        
                        if not dialogue_text:
                            continue
                        
                        metadata = {
                            'intent': item.get('intent', 'unknown'),
                            'entities': item.get('entities', []),
                            'dataset': 'MediTOD'
                        }
                        
                        # Filter for pediatric content if requested
                        if filter_pediatric and not self.extract_pediatric_content(dialogue_text, metadata):
                            continue
                        
                        doc = {
                            'text': self.clean_text(dialogue_text),
                            'source': 'MediTOD - Clinical Interviews',
                            'metadata': metadata
                        }
                        processed_docs.append(doc)
                
                logger.info(f"✓ Processed {len(processed_docs)} documents from {json_file.name}")
                
            except Exception as e:
                logger.error(f"Error processing {json_file}: {e}")
        
        return processed_docs
    
    def preprocess_definedai(self, filter_pediatric: bool = True) -> List[Dict]:
        """Preprocess Defined.ai Medical Dialogues"""
        logger.info("Processing Defined.ai Medical Dialogues...")
        
        definedai_dir = self.raw_dir / "definedai"
        processed_docs = []
        
        json_files = list(definedai_dir.glob("*.json"))
        
        if not json_files:
            logger.warning(f"No JSON files found in {definedai_dir}")
            logger.info("Run download script first: python scripts/download_medical_datasets.py --dataset definedai")
            return []
        
        for json_file in json_files:
            logger.info(f"Processing {json_file.name}...")
            
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Process Q&A pairs
                if isinstance(data, list):
                    for item in tqdm(data, desc="Processing Q&A pairs"):
                        question = item.get('question', '')
                        answer = item.get('answer', '')
                        
                        if not question or not answer:
                            continue
                        
                        # Format as dialogue
                        dialogue_text = f"Patient Question: {question}\n\nDoctor Answer: {answer}"
                        
                        metadata = {
                            'specialty': item.get('specialty', 'general'),
                            'source_dataset': item.get('source', 'MedQuad'),
                            'dataset': 'Defined.ai'
                        }
                        
                        # Filter for pediatric content if requested
                        if filter_pediatric and not self.extract_pediatric_content(dialogue_text, metadata):
                            continue
                        
                        doc = {
                            'text': self.clean_text(dialogue_text),
                            'source': f"Defined.ai - {metadata['specialty']}",
                            'metadata': metadata
                        }
                        processed_docs.append(doc)
                
                logger.info(f"✓ Processed {len(processed_docs)} documents from {json_file.name}")
                
            except Exception as e:
                logger.error(f"Error processing {json_file}: {e}")
        
        return processed_docs
    
    def _format_dialogue(self, utterances: List[Dict]) -> str:
        """Format utterances into dialogue text"""
        dialogue_parts = []
        
        for utterance in utterances:
            speaker = utterance.get('speaker', 'Unknown')
            text = utterance.get('text', '')
            dialogue_parts.append(f"{speaker}: {text}")
        
        return "\n".join(dialogue_parts)
    
    def save_processed_data(self, documents: List[Dict], dataset_name: str):
        """Save processed documents to JSON"""
        if not documents:
            logger.warning(f"No documents to save for {dataset_name}")
            return
        
        output_file = self.output_dir / f"{dataset_name}_processed.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(documents, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✓ Saved {len(documents)} documents to {output_file}")
        
        # Save statistics
        stats = {
            'total_documents': len(documents),
            'dataset': dataset_name,
            'specialties': self._get_unique_values(documents, 'specialty'),
            'categories': self._get_unique_values(documents, 'category')
        }
        
        stats_file = self.output_dir / f"{dataset_name}_stats.json"
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)
        
        logger.info(f"✓ Saved statistics to {stats_file}")
    
    def _get_unique_values(self, documents: List[Dict], key: str) -> List[str]:
        """Get unique values for a metadata key"""
        values = set()
        for doc in documents:
            value = doc.get('metadata', {}).get(key)
            if value:
                values.add(value)
        return sorted(list(values))

def main():
    parser = argparse.ArgumentParser(description='Preprocess medical dialogue datasets')
    parser.add_argument(
        '--dataset',
        choices=['meddialog', 'meditod', 'definedai', 'all'],
        default='all',
        help='Which dataset to preprocess'
    )
    parser.add_argument(
        '--raw-dir',
        default='data/raw_datasets',
        help='Directory with raw datasets'
    )
    parser.add_argument(
        '--output-dir',
        default='data/processed',
        help='Directory for processed datasets'
    )
    parser.add_argument(
        '--no-filter',
        action='store_true',
        help='Disable pediatric filtering (include all medical content)'
    )
    
    args = parser.parse_args()
    
    preprocessor = MedicalDatasetPreprocessor(args.raw_dir, args.output_dir)
    filter_pediatric = not args.no_filter
    
    logger.info("="*60)
    logger.info("Medical Dataset Preprocessor")
    logger.info(f"Pediatric filtering: {'ON' if filter_pediatric else 'OFF'}")
    logger.info("="*60)
    
    if args.dataset == 'all' or args.dataset == 'meddialog':
        docs = preprocessor.preprocess_meddialog(filter_pediatric)
        preprocessor.save_processed_data(docs, 'meddialog')
    
    if args.dataset == 'all' or args.dataset == 'meditod':
        docs = preprocessor.preprocess_meditod(filter_pediatric)
        preprocessor.save_processed_data(docs, 'meditod')
    
    if args.dataset == 'all' or args.dataset == 'definedai':
        docs = preprocessor.preprocess_definedai(filter_pediatric)
        preprocessor.save_processed_data(docs, 'definedai')
    
    logger.info("\n" + "="*60)
    logger.info("Preprocessing complete!")
    logger.info("="*60)
    logger.info("\nNext step: Ingest into RAG system")
    logger.info("  python scripts/ingest_medical_datasets.py")

if __name__ == "__main__":
    main()
