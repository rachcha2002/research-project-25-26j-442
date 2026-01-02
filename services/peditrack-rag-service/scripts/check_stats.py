import sys
sys.path.insert(0, '.')
from services.vector_store import get_vector_store
from services.embedding_service import get_embedding_service

es = get_embedding_service()
vs = get_vector_store(es.get_embedding_dimension())
vs.load()
stats = vs.get_stats()

print("=" * 70)
print("CURRENT RAG SYSTEM STATUS")
print("=" * 70)
print(f"Total documents: {stats.get('total_documents', 0):,}")
print(f"Embedding dimension: {stats.get('embedding_dimension', 0)}")
print(f"Index size: {stats.get('index_size', 0):,} bytes")
print("=" * 70)
