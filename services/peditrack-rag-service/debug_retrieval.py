import sys
import os

# Force reload of modules
if 'services.retrieval_service' in sys.modules:
    del sys.modules['services.retrieval_service']
if 'services.embedding_service' in sys.modules:
    del sys.modules['services.embedding_service']
if 'services.vector_store' in sys.modules:
    del sys.modules['services.vector_store']

from services.embedding_service import get_embedding_service
from services.vector_store import get_vector_store

print("Direct test without retrieval service...")
emb_service = get_embedding_service()
emb_service.load_model()

vs = get_vector_store(emb_service.get_embedding_dimension())
vs.load()

query = "What are the common symptoms of fever in infants?"
query_embedding = emb_service.embed_text(query)
scores, metadata_list = vs.search(query_embedding, top_k=5)

print(f"\nDirect search results:")
print(f"Retrieved {len(scores)} documents")
print(f"Scores: {[f'{s:.4f}' for s in scores]}")

# Now test with retrieval service
print("\n" + "="*60)
print("Testing with RetrievalService...")

from services.retrieval_service import RetrievalService

# Create new instance (not using singleton)
rs = RetrievalService()
print(f"Similarity threshold: {rs.similarity_threshold}")

docs, context = rs.retrieve(query, top_k=5)
print(f"Retrieved {len(docs)} documents via RetrievalService")
if docs:
    print(f"First doc score: {docs[0]['score']:.4f}")
