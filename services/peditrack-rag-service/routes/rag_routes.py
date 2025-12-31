from fastapi import APIRouter, HTTPException, status
from models.schemas import (
    RetrievalRequest, RetrievalResponse, RetrievedDocument,
    IngestionRequest, IngestionResponse,
    StatsResponse
)
from services.retrieval_service import get_retrieval_service
from services.ingestion_service import get_ingestion_service
from services.vector_store import get_vector_store
from services.embedding_service import get_embedding_service
from utils.logger import setup_logger, log_audit
import os

logger = setup_logger(__name__)
router = APIRouter(prefix="/api/rag", tags=["RAG"])

@router.post("/retrieve", response_model=RetrievalResponse)
async def retrieve_documents(request: RetrievalRequest):
    """Retrieve relevant documents for a query"""
    try:
        logger.info(f"Retrieval request: query='{request.query[:50]}...', top_k={request.top_k}")
        
        if os.getenv("ENABLE_AUDIT_LOG", "true").lower() == "true":
            log_audit("retrieval_request", {
                "query_length": len(request.query),
                "top_k": request.top_k
            })
        
        retrieval_service = get_retrieval_service()
        
        documents, context = retrieval_service.retrieve(
            query=request.query,
            top_k=request.top_k,
            similarity_threshold=request.similarity_threshold
        )
        
        retrieved_docs = [
            RetrievedDocument(
                text=doc["text"],
                score=doc["score"],
                metadata=doc["metadata"],
                source=doc.get("source")
            )
            for doc in documents
        ]
        
        return RetrievalResponse(
            success=True,
            query=request.query,
            documents=retrieved_docs,
            count=len(retrieved_docs),
            context=context
        )
        
    except Exception as e:
        logger.error(f"Retrieval error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval failed: {str(e)}"
        )

@router.post("/ingest", response_model=IngestionResponse)
async def ingest_documents(request: IngestionRequest):
    """Ingest new documents into the vector store"""
    try:
        logger.info(f"Ingestion request: {len(request.documents)} documents")
        
        if os.getenv("ENABLE_AUDIT_LOG", "true").lower() == "true":
            log_audit("ingestion_request", {
                "document_count": len(request.documents)
            })
        
        ingestion_service = get_ingestion_service()
        count = ingestion_service.ingest_documents(request.documents)
        
        return IngestionResponse(
            success=True,
            message=f"Successfully ingested {count} documents",
            documents_added=count
        )
        
    except Exception as e:
        logger.error(f"Ingestion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}"
        )

@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get statistics about the vector store"""
    try:
        vector_store = get_vector_store()
        embedding_service = get_embedding_service()
        
        stats = vector_store.get_stats()
        
        return StatsResponse(
            success=True,
            total_documents=stats["total_documents"],
            index_size=stats["index_size"],
            embedding_dimension=stats["embedding_dimension"],
            model_name=embedding_service.model_name
        )
        
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}"
        )

@router.delete("/clear")
async def clear_index():
    """Clear all documents from the vector store"""
    try:
        logger.warning("Clearing vector store")
        
        if os.getenv("ENABLE_AUDIT_LOG", "true").lower() == "true":
            log_audit("clear_index", {})
        
        vector_store = get_vector_store()
        vector_store.clear()
        vector_store.save()
        
        return {"success": True, "message": "Vector store cleared"}
        
    except Exception as e:
        logger.error(f"Clear error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear index: {str(e)}"
        )
