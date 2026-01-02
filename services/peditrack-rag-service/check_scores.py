from services.embedding_service import get_embedding_service
from services.vector_store import get_vector_store

emb_service = get_embedding_service()
emb_service.load_model()

vs = get_vector_store(emb_service.get_embedding_dimension())
vs.load()

query = "What are the common symptoms of fever in infants?"

query_embedding = emb_service.embed_text(query)
scores, metadata_list = vs.search(query_embedding, top_k=5)

print("SCORES:")
for i, score in enumerate(scores, 1):
    print(f"{i}. {score:.6f}")
