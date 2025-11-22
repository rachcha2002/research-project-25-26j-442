from typing import List, Dict, Any, Tuple
from services.embedding_service import get_embedding_service
from services.vector_store import get_vector_store
from utils.logger import setup_logger
import os

logger = setup_logger(__name__)

class RetrievalService:
    """Service for retrieving relevant documents using RAG"""
    
    def __init__(self):
        """Initialize the retrieval service"""
        self.embedding_service = get_embedding_service()
        self.vector_store = get_vector_store(self.embedding_service.get_embedding_dimension())
        self.default_top_k = int(os.getenv("DEFAULT_TOP_K", "5"))
        self.max_top_k = int(os.getenv("MAX_TOP_K", "20"))
        self.similarity_threshold = float(os.getenv("SIMILARITY_THRESHOLD", "0.5"))
        logger.info("Initialized RetrievalService")
    
    def retrieve(self, query: str, top_k: int = None, similarity_threshold: float = None) -> Tuple[List[Dict[str, Any]], str]:
        """Retrieve relevant documents for a query"""
        if top_k is None:
            top_k = self.default_top_k
        if similarity_threshold is None:
            similarity_threshold = self.similarity_threshold
        
        top_k = min(top_k, self.max_top_k)
        
        logger.info(f"Retrieving documents for query: '{query[:50]}...' (top_k={top_k})")
        
        try:
            query_embedding = self.embedding_service.embed_text(query)
            scores, metadata_list = self.vector_store.search(query_embedding, top_k)
            
            retrieved_docs = []
            for score, metadata in zip(scores, metadata_list):
                if score >= similarity_threshold:
                    retrieved_docs.append({
                        "text": metadata.get("text", ""),
                        "score": score,
                        "metadata": metadata,
                        "source": metadata.get("source")
                    })
            
            logger.info(f"Retrieved {len(retrieved_docs)} documents above threshold {similarity_threshold}")
            
            context = self._build_context(retrieved_docs)
            
            return retrieved_docs, context
            
        except Exception as e:
            logger.error(f"Error during retrieval: {e}")
            raise
    
    def _build_context(self, documents: List[Dict[str, Any]]) -> str:
        """Build a context string from retrieved documents"""
        if not documents:
            return ""
        
        context_parts = []
        for i, doc in enumerate(documents, 1):
            source = doc.get("source", "Unknown")
            text = doc.get("text", "")
            context_parts.append(f"[Source {i}: {source}]\n{text}\n")
        
        return "\n".join(context_parts)

# Global instance
_retrieval_service = None

def get_retrieval_service():
    """Get or create the global retrieval service instance"""
    global _retrieval_service
    if _retrieval_service is None:
        _retrieval_service = RetrievalService()
    return _retrieval_service
