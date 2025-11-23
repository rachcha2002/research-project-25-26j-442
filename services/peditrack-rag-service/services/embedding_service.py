from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List
from utils.logger import setup_logger
import os
import torch

logger = setup_logger(__name__)

class EmbeddingService:
    """Service for generating text embeddings using sentence transformers"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """Initialize the embedding service"""
        self.model_name = model_name
        self.model = None
        self.embedding_dimension = None
        self.device = None
        logger.info(f"Initializing EmbeddingService with model: {model_name}")
        
    def load_model(self):
        """Load the sentence transformer model"""
        if self.model is None:
            try:
                # Detect GPU/CUDA availability
                if torch.cuda.is_available():
                    self.device = 'cuda'
                    logger.info(f"🚀 GPU detected! Using CUDA device: {torch.cuda.get_device_name(0)}")
                    logger.info(f"   GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
                else:
                    self.device = 'cpu'
                    logger.info("Using CPU for embeddings")
                
                logger.info(f"Loading model: {self.model_name} on {self.device}")
                self.model = SentenceTransformer(self.model_name, device=self.device)
                test_embedding = self.model.encode("test")
                self.embedding_dimension = len(test_embedding)
                logger.info(f"✓ Model loaded successfully. Embedding dimension: {self.embedding_dimension}")
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                raise
    
    def embed_text(self, text: str) -> np.ndarray:
        """Generate embedding for a single text"""
        if self.model is None:
            self.load_model()
        
        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding
        except Exception as e:
            logger.error(f"Failed to embed text: {e}")
            raise
    
    def embed_batch(self, texts: List[str], batch_size: int = 32, show_progress: bool = False) -> np.ndarray:
        """Generate embeddings for multiple texts"""
        if self.model is None:
            self.load_model()
        
        try:
            logger.info(f"Embedding {len(texts)} texts in batches of {batch_size}")
            embeddings = self.model.encode(
                texts,
                batch_size=batch_size,
                show_progress_bar=show_progress,
                convert_to_numpy=True
            )
            logger.info(f"Successfully embedded {len(texts)} texts")
            return embeddings
        except Exception as e:
            logger.error(f"Failed to embed batch: {e}")
            raise
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings produced by this model"""
        if self.embedding_dimension is None:
            if self.model is None:
                self.load_model()
        return self.embedding_dimension

# Global instance
_embedding_service = None

def get_embedding_service(model_name: str = None):
    """Get or create the global embedding service instance"""
    global _embedding_service
    if _embedding_service is None:
        if model_name is None:
            model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        _embedding_service = EmbeddingService(model_name)
    return _embedding_service
