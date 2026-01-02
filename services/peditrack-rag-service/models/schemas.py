from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Document(BaseModel):
    """Represents a document in the knowledge base"""
    text: str = Field(..., description="The document text content")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Document metadata")
    source: Optional[str] = Field(None, description="Source of the document")
    doc_id: Optional[str] = Field(None, description="Unique document identifier")

class RetrievalRequest(BaseModel):
    """Request model for retrieving relevant documents"""
    query: str = Field(..., description="The user's query text", min_length=1)
    top_k: Optional[int] = Field(5, description="Number of documents to retrieve", ge=1, le=20)
    similarity_threshold: Optional[float] = Field(0.0, description="Minimum similarity score", ge=0.0, le=1.0)

class RetrievedDocument(BaseModel):
    """A retrieved document with similarity score"""
    text: str
    score: float
    metadata: Dict[str, Any]
    source: Optional[str] = None

class RetrievalResponse(BaseModel):
    """Response model for document retrieval"""
    success: bool
    query: str
    documents: List[RetrievedDocument]
    count: int
    context: str = Field(..., description="Concatenated context from retrieved documents")

class IngestionRequest(BaseModel):
    """Request model for ingesting documents"""
    documents: List[Document] = Field(..., description="List of documents to ingest")

class IngestionResponse(BaseModel):
    """Response model for document ingestion"""
    success: bool
    message: str
    documents_added: int

class StatsResponse(BaseModel):
    """Response model for index statistics"""
    success: bool
    total_documents: int
    index_size: int
    embedding_dimension: int
    model_name: str

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
