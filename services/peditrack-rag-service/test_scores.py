from services.embedding_service import get_embedding_service
from services.vector_store import get_vector_store

print("Testing vector store search...")
emb_service = get_embedding_service()
emb_service.load_model()

vs = get_vector_store(emb_service.get_embedding_dimension())
vs.load()

query = "What are the common symptoms of fever in infants?"
print(f"\nQuery: {query}")

query_embedding = emb_service.embed_text(query)
scores, metadata_list = vs.search(query_embedding, top_k=5)

print(f"\nTop 5 results:")
for i, (score, metadata) in enumerate(zip(scores, metadata_list), 1):
    print(f"\n{i}. Score: {score:.4f}")
    print(f"   Source: {metadata.get('source', 'Unknown')}")
    print(f"   Text: {metadata.get('text', '')[:150]}...")
