from typing import List, Dict, Any, Tuple
from services.embedding_service import get_embedding_service
from services.vector_store import get_vector_store
from utils.logger import setup_logger
import os
import re

logger = setup_logger(__name__)

class RetrievalService:
    """Service for retrieving relevant documents using RAG"""
    
    def __init__(self):
        """Initialize the retrieval service"""
        self.embedding_service = get_embedding_service()
        self.vector_store = get_vector_store(self.embedding_service.get_embedding_dimension())
        
        # Load the vector store
        if not self.vector_store.load():
            logger.warning("Vector store not loaded - starting with empty index")
        else:
            logger.info(f"Vector store loaded with {self.vector_store.index.ntotal} documents")
        
        # Initialize reranker (lazy loading)
        self._reranker = None
        self.enable_reranking = os.getenv("ENABLE_RERANKING", "false").lower() == "true"
        
        self.default_top_k = int(os.getenv("DEFAULT_TOP_K", "5"))
        self.max_top_k = int(os.getenv("MAX_TOP_K", "20"))
        self.similarity_threshold = float(os.getenv("DEFAULT_SIMILARITY_THRESHOLD", "0.0"))
        self.enable_preprocessing = os.getenv("ENABLE_QUERY_PREPROCESSING", "true").lower() == "true"
        logger.info(f"Initialized RetrievalService (top_k={self.default_top_k}, threshold={self.similarity_threshold}, preprocessing={self.enable_preprocessing}, reranking={self.enable_reranking})")
    
    def retrieve(self, query: str, top_k: int = None, similarity_threshold: float = None) -> Tuple[List[Dict[str, Any]], str]:
        """Retrieve relevant documents for a query"""
        if top_k is None:
            top_k = self.default_top_k
        if similarity_threshold is None:
            similarity_threshold = self.similarity_threshold
        
        top_k = min(top_k, self.max_top_k)
        
        # Preprocess query
        original_query = query
        if self.enable_preprocessing:
            query = self._preprocess_query(query)
            if query != original_query:
                logger.debug(f"Query preprocessed: '{original_query[:50]}...' -> '{query[:50]}...'")
        
        logger.info(f"Retrieving documents for query: '{query[:50]}...' (top_k={top_k}, threshold={similarity_threshold})")
        
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
            
            # Apply re-ranking if enabled
            if self.enable_reranking and retrieved_docs:
                retrieved_docs = self._get_reranker().rerank(query, retrieved_docs, top_k=top_k)
                logger.info(f"Re-ranked to {len(retrieved_docs)} documents")
            
            context = self._build_context(retrieved_docs)
            
            return retrieved_docs, context
            
        except Exception as e:
            logger.error(f"Error during retrieval: {e}")
            raise
    
    def _get_reranker(self):
        """Lazy load reranker service"""
        if self._reranker is None:
            from services.reranker_service import get_reranker_service
            self._reranker = get_reranker_service()
        return self._reranker
    
    def _preprocess_query(self, query: str) -> str:
        """Preprocess query for better retrieval"""
        # Remove extra whitespace
        query = ' '.join(query.split())
        
        # Remove special characters but keep medical terms
        # Keep alphanumeric, spaces, hyphens, apostrophes
        query = re.sub(r'[^a-zA-Z0-9\s\-\'\?]', '', query)
        
        # Normalize common abbreviations
        abbreviations = {
            r'\bdr\.?\s': 'doctor ',
            r'\btemp\b': 'temperature',
            r'\bmeds?\b': 'medication',
            r'\bsymptoms?\b': 'symptom',
        }
        
        for pattern, replacement in abbreviations.items():
            query = re.sub(pattern, replacement, query, flags=re.IGNORECASE)
        
        return query.strip()
    
    def _build_context(self, documents: List[Dict[str, Any]]) -> str:
        """Build a context string from retrieved documents"""
        if not documents:
            return ""
        
        context_parts = []
        for i, doc in enumerate(documents, 1):
            source = doc.get("source", "Unknown")
            text = doc.get("text", "")
            score = doc.get("score", 0.0)
            context_parts.append(f"[Source {i}: {source} (relevance: {score:.3f})]\n{text}\n")
        
        return "\n".join(context_parts)

# Global instance
_retrieval_service = None

def get_retrieval_service():
    """Get or create the global retrieval service instance"""
    global _retrieval_service
    if _retrieval_service is None:
        _retrieval_service = RetrievalService()
    return _retrieval_service
