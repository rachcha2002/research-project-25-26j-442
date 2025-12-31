"""
Download and prepare medical dialogue datasets for RAG integration
Supports: MedDialog, MediTOD, and Defined.ai Medical Dialogues
"""
import os
import sys
import json
import requests
import zipfile
import tarfile
from pathlib import Path
from typing import Dict, List, Any
from tqdm import tqdm
import argparse

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Dataset configurations
DATASETS = {
    "meddialog": {
        "name": "MedDialog",
        "description": "~0.26M English doctor-patient conversations from online health forums",
        "url": "https://github.com/UCSD-AI4H/Medical-Dialogue-System",
        "format": "json",
        "size": "large"
    },
    "meditod": {
        "name": "MediTOD",
        "description": "22.5K annotated utterances from staged clinical interviews",
        "url": "https://github.com/UCSD-AI4H/MediTOD",
        "format": "json",
        "size": "medium"
    },
    "definedai": {
        "name": "Defined.ai Medical Dialogues",
        "description": "55K authentic Q&A pairs across 80+ specialties (including Pediatrics)",
        "url": "https://huggingface.co/datasets/keivalya/MedQuad-MedicalQnADataset",
        "format": "json",
        "size": "medium"
    }
}

class DatasetDownloader:
    """Download and prepare medical datasets"""
    
    def __init__(self, data_dir: str = "data/raw_datasets"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Dataset directory: {self.data_dir}")
    
    def download_file(self, url: str, destination: Path) -> bool:
        """Download a file with progress bar"""
        try:
            logger.info(f"Downloading from {url}")
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            
            with open(destination, 'wb') as f, tqdm(
                desc=destination.name,
                total=total_size,
                unit='B',
                unit_scale=True,
                unit_divisor=1024,
            ) as pbar:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        pbar.update(len(chunk))
            
            logger.info(f"✓ Downloaded to {destination}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to download {url}: {e}")
            return False
    
    def download_meddialog(self) -> Path:
        """Download MedDialog dataset"""
        logger.info("Downloading MedDialog dataset...")
        
        # Since MedDialog is on GitHub, we'll use the raw file URLs
        dataset_dir = self.data_dir / "meddialog"
        dataset_dir.mkdir(exist_ok=True)
        
        # Sample URLs - adjust based on actual repository structure
        urls = [
            "https://raw.githubusercontent.com/UCSD-AI4H/Medical-Dialogue-System/master/data/en/dialogues.json"
        ]
        
        logger.info("Note: MedDialog requires manual download from GitHub")
        logger.info("Visit: https://github.com/UCSD-AI4H/Medical-Dialogue-System")
        logger.info(f"Download files to: {dataset_dir}")
        
        return dataset_dir
    
    def download_meditod(self) -> Path:
        """Download MediTOD dataset"""
        logger.info("Downloading MediTOD dataset...")
        
        dataset_dir = self.data_dir / "meditod"
        dataset_dir.mkdir(exist_ok=True)
        
        logger.info("Note: MediTOD requires manual download from GitHub")
        logger.info("Visit: https://github.com/UCSD-AI4H/MediTOD")
        logger.info(f"Download files to: {dataset_dir}")
        
        return dataset_dir
    
    def download_definedai(self) -> Path:
        """Download Defined.ai Medical Dialogues (via HuggingFace)"""
        logger.info("Downloading Defined.ai Medical Dialogues...")
        
        dataset_dir = self.data_dir / "definedai"
        dataset_dir.mkdir(exist_ok=True)
        
        try:
            # Use HuggingFace datasets library if available
            from datasets import load_dataset
            
            logger.info("Loading from HuggingFace...")
            dataset = load_dataset("keivalya/MedQuad-MedicalQnADataset")
            
            # Save to JSON
            output_file = dataset_dir / "medical_qa.json"
            
            # Convert to our format
            data = []
            for item in dataset['train']:
                data.append({
                    "question": item.get('question', ''),
                    "answer": item.get('answer', ''),
                    "source": item.get('source', 'MedQuad'),
                    "specialty": item.get('specialty', 'General')
                })
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✓ Saved {len(data)} Q&A pairs to {output_file}")
            return dataset_dir
            
        except ImportError:
            logger.warning("HuggingFace datasets not installed. Install with: pip install datasets")
            logger.info("Manual download: https://huggingface.co/datasets/keivalya/MedQuad-MedicalQnADataset")
            logger.info(f"Save to: {dataset_dir}")
            return dataset_dir
        except Exception as e:
            logger.error(f"Error downloading dataset: {e}")
            return dataset_dir

def main():
    parser = argparse.ArgumentParser(description='Download medical dialogue datasets')
    parser.add_argument(
        '--dataset',
        choices=['meddialog', 'meditod', 'definedai', 'all'],
        default='all',
        help='Which dataset to download'
    )
    parser.add_argument(
        '--data-dir',
        default='data/raw_datasets',
        help='Directory to save datasets'
    )
    
    args = parser.parse_args()
    
    downloader = DatasetDownloader(args.data_dir)
    
    logger.info("="*60)
    logger.info("Medical Dataset Downloader")
    logger.info("="*60)
    
    if args.dataset == 'all' or args.dataset == 'meddialog':
        downloader.download_meddialog()
    
    if args.dataset == 'all' or args.dataset == 'meditod':
        downloader.download_meditod()
    
    if args.dataset == 'all' or args.dataset == 'definedai':
        downloader.download_definedai()
    
    logger.info("\n" + "="*60)
    logger.info("Download process complete!")
    logger.info("="*60)
    logger.info("\nNext steps:")
    logger.info("1. Check the downloaded files in the data directory")
    logger.info("2. Run the preprocessing script:")
    logger.info("   python scripts/preprocess_medical_datasets.py")
    logger.info("3. Ingest into RAG system:")
    logger.info("   python scripts/ingest_medical_datasets.py")

if __name__ == "__main__":
    main()
