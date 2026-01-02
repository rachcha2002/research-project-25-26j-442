from typing import List, Dict, Any
from services.embedding_service import get_embedding_service
from services.vector_store import get_vector_store
from models.schemas import Document
from utils.logger import setup_logger
import json

logger = setup_logger(__name__)

class IngestionService:
    """Service for ingesting documents into the vector store"""
    
    def __init__(self):
        """Initialize the ingestion service"""
        self.embedding_service = get_embedding_service()
        self.vector_store = get_vector_store(self.embedding_service.get_embedding_dimension())
        logger.info("Initialized IngestionService")
    
    def ingest_documents(self, documents: List[Document]) -> int:
        """Ingest a list of documents into the vector store"""
        if not documents:
            logger.warning("No documents to ingest")
            return 0
        
        logger.info(f"Ingesting {len(documents)} documents")
        
        try:
            texts = [doc.text for doc in documents]
            metadata_list = []
            
            for i, doc in enumerate(documents):
                meta = {
                    "text": doc.text,
                    "source": doc.source or f"document_{i}",
                    "doc_id": doc.doc_id or f"doc_{i}",
                    **(doc.metadata or {})
                }
                metadata_list.append(meta)
            
            embeddings = self.embedding_service.embed_batch(texts, show_progress=True)
            self.vector_store.add_documents(embeddings, metadata_list)
            self.vector_store.save()
            
            logger.info(f"Successfully ingested {len(documents)} documents")
            return len(documents)
            
        except Exception as e:
            logger.error(f"Error during ingestion: {e}")
            raise
    
    def ingest_from_json(self, json_path: str) -> int:
        """Ingest documents from a JSON file"""
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            documents = []
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        doc = Document(
                            text=item.get("text", ""),
                            metadata=item.get("metadata", {}),
                            source=item.get("source"),
                            doc_id=item.get("doc_id")
                        )
                        documents.append(doc)
            
            return self.ingest_documents(documents)
            
        except Exception as e:
            logger.error(f"Error ingesting from JSON: {e}")
            raise
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks"""
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start = end - overlap
        
        return chunks

# Global instance
_ingestion_service = None

def get_ingestion_service():
    """Get or create the global ingestion service instance"""
    global _ingestion_service
    if _ingestion_service is None:
        _ingestion_service = IngestionService()
    return _ingestion_service
