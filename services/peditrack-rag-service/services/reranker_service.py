"""
Re-ranking Service for RAG
Uses cross-encoder model to re-rank retrieved documents
"""

from typing import List, Dict, Any, Tuple
from sentence_transformers import CrossEncoder
from utils.logger import setup_logger
import os

logger = setup_logger(__name__)


class RerankerService:
    """Service for re-ranking retrieved documents using cross-encoder"""
    
    def __init__(self, model_name: str = None):
        """
        Initialize the reranker service
        
        Args:
            model_name: Name of the cross-encoder model to use
        """
        self.model_name = model_name or os.getenv(
            "RERANKER_MODEL", 
            "cross-encoder/ms-marco-MiniLM-L-6-v2"
        )
        
        self.enabled = os.getenv("ENABLE_RERANKING", "false").lower() == "true"
        
        if self.enabled:
            logger.info(f"Loading reranker model: {self.model_name}")
            self.model = CrossEncoder(self.model_name)
            logger.info("✓ Reranker model loaded successfully")
        else:
            self.model = None
            logger.info("Reranking disabled")
    
    def rerank(
        self, 
        query: str, 
        documents: List[Dict[str, Any]], 
        top_k: int = None
    ) -> List[Dict[str, Any]]:
        """
        Re-rank documents using cross-encoder
        
        Args:
            query: The search query
            documents: List of retrieved documents
            top_k: Number of top documents to return (None = return all)
            
        Returns:
            Re-ranked list of documents with updated scores
        """
        if not self.enabled or not documents:
            return documents
        
        if len(documents) == 0:
            return documents
        
        # Prepare query-document pairs
        pairs = [[query, doc.get("text", "")] for doc in documents]
        
        # Get cross-encoder scores
        try:
            scores = self.model.predict(pairs)
            
            # Update documents with new scores
            for i, doc in enumerate(documents):
                doc["rerank_score"] = float(scores[i])
                doc["original_score"] = doc.get("score", 0.0)
                doc["score"] = float(scores[i])  # Replace with rerank score
            
            # Sort by new scores
            reranked = sorted(documents, key=lambda x: x["score"], reverse=True)
            
            # Return top_k if specified
            if top_k is not None:
                reranked = reranked[:top_k]
            
            logger.info(f"Re-ranked {len(documents)} documents, returning top {len(reranked)}")
            
            return reranked
            
        except Exception as e:
            logger.error(f"Error during re-ranking: {e}")
            return documents


# Global instance
_reranker_service = None


def get_reranker_service():
    """Get or create the global reranker service instance"""
    global _reranker_service
    if _reranker_service is None:
        _reranker_service = RerankerService()
    return _reranker_service
