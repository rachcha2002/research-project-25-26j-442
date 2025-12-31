import faiss
import numpy as np
import json
import os
from typing import List, Dict, Any, Tuple
from pathlib import Path
from utils.logger import setup_logger

logger = setup_logger(__name__)

class VectorStore:
    """FAISS-based vector store for document embeddings"""
    
    def __init__(self, embedding_dimension: int, index_path: str = None, metadata_path: str = None):
        """Initialize the vector store"""
        self.embedding_dimension = embedding_dimension
        self.index_path = index_path or "./vector_store/faiss_index"
        self.metadata_path = metadata_path or "./vector_store/metadata.json"
        
        # Initialize FAISS index (using L2 distance)
        self.index = faiss.IndexFlatL2(embedding_dimension)
        
        # Store metadata separately (FAISS only stores vectors)
        self.metadata: List[Dict[str, Any]] = []
        
        logger.info(f"Initialized VectorStore with dimension: {embedding_dimension}")
    
    def add_documents(self, embeddings: np.ndarray, metadata: List[Dict[str, Any]]):
        """Add documents to the vector store"""
        if len(embeddings) != len(metadata):
            raise ValueError("Number of embeddings must match number of metadata entries")
        
        # Ensure embeddings are float32 (FAISS requirement)
        embeddings = embeddings.astype('float32')
        
        # Add to FAISS index
        self.index.add(embeddings)
        
        # Add metadata
        self.metadata.extend(metadata)
        
        logger.info(f"Added {len(embeddings)} documents to vector store. Total: {self.index.ntotal}")
    
    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> Tuple[List[float], List[Dict[str, Any]]]:
        """Search for similar documents"""
        if self.index.ntotal == 0:
            logger.warning("Vector store is empty")
            return [], []
        
        # Ensure query is 2D array and float32
        if len(query_embedding.shape) == 1:
            query_embedding = query_embedding.reshape(1, -1)
        query_embedding = query_embedding.astype('float32')
        
        # Limit top_k to available documents
        top_k = min(top_k, self.index.ntotal)
        
        # Search
        distances, indices = self.index.search(query_embedding, top_k)
        
        # Convert L2 distances to similarity scores
        scores = [1.0 / (1.0 + float(d)) for d in distances[0]]
        
        # Get metadata for results
        results_metadata = [self.metadata[int(idx)] for idx in indices[0]]
        
        logger.info(f"Search returned {len(results_metadata)} results")
        return scores, results_metadata
    
    def save(self):
        """Save the index and metadata to disk"""
        try:
            Path(self.index_path).parent.mkdir(parents=True, exist_ok=True)
            Path(self.metadata_path).parent.mkdir(parents=True, exist_ok=True)
            
            faiss.write_index(self.index, self.index_path)
            
            with open(self.metadata_path, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved vector store to {self.index_path}")
        except Exception as e:
            logger.error(f"Failed to save vector store: {e}")
            raise
    
    def load(self):
        """Load the index and metadata from disk"""
        try:
            if not os.path.exists(self.index_path):
                logger.warning(f"Index file not found: {self.index_path}")
                return False
            
            if not os.path.exists(self.metadata_path):
                logger.warning(f"Metadata file not found: {self.metadata_path}")
                return False
            
            self.index = faiss.read_index(self.index_path)
            
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
            
            logger.info(f"Loaded vector store with {self.index.ntotal} documents")
            return True
        except Exception as e:
            logger.error(f"Failed to load vector store: {e}")
            return False
    
    def clear(self):
        """Clear all documents from the store"""
        self.index.reset()
        self.metadata = []
        logger.info("Cleared vector store")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        return {
            "total_documents": self.index.ntotal,
            "embedding_dimension": self.embedding_dimension,
            "index_size": self.index.ntotal * self.embedding_dimension * 4,
        }

# Global instance
_vector_store = None

def get_vector_store(embedding_dimension: int = None):
    """Get or create the global vector store instance"""
    global _vector_store
    if _vector_store is None:
        if embedding_dimension is None:
            embedding_dimension = int(os.getenv("EMBEDDING_DIMENSION", "384"))
        index_path = os.getenv("VECTOR_STORE_PATH", "./vector_store/faiss_index")
        metadata_path = os.getenv("METADATA_STORE_PATH", "./vector_store/metadata.json")
        _vector_store = VectorStore(embedding_dimension, index_path, metadata_path)
    return _vector_store
