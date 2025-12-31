from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.rag_routes import router as rag_router
from models.schemas import HealthResponse
from services.vector_store import get_vector_store
from services.embedding_service import get_embedding_service
from utils.logger import setup_logger
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Setup logger
logger = setup_logger(__name__, log_file=os.getenv("LOG_FILE"))

# Create FastAPI app
app = FastAPI(
    title="PediTrack RAG Service",
    description="Retrieval-Augmented Generation service for pediatric health information",
    version="1.0.0"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(rag_router)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting PediTrack RAG Service...")
    
    try:
        # Initialize embedding service
        embedding_service = get_embedding_service()
        embedding_service.load_model()
        logger.info(f"Loaded embedding model: {embedding_service.model_name}")
        
        # Initialize vector store
        vector_store = get_vector_store(embedding_service.get_embedding_dimension())
        
        # Try to load existing index
        if vector_store.load():
            logger.info(f"Loaded existing vector store with {vector_store.index.ntotal} documents")
        else:
            logger.info("No existing vector store found. Starting with empty index.")
            logger.info("Run the initialization script to load sample data:")
            logger.info("  python scripts/init_vector_store.py")
        
        logger.info("RAG Service startup complete")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down RAG Service...")
    
    try:
        # Save vector store
        vector_store = get_vector_store()
        vector_store.save()
        logger.info("Vector store saved")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check"""
    return HealthResponse(
        status="healthy",
        service="PediTrack RAG Service",
        version="1.0.0"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="PediTrack RAG Service",
        version="1.0.0"
    )

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("SERVICE_PORT", "3002"))
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )
