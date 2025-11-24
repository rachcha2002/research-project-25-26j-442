from dotenv import load_dotenv
load_dotenv()

from services.retrieval_service import RetrievalService

rs = RetrievalService()
print(f"Vector store total documents: {rs.vector_store.index.ntotal}")
print(f"Similarity threshold: {rs.similarity_threshold}")

# Try direct search
from services.embedding_service import get_embedding_service
emb = get_embedding_service()

query = "What are the common symptoms of fever in infants?"
query_emb = emb.embed_text(query)

scores, metadata = rs.vector_store.search(query_emb, top_k=5)
print(f"\nDirect vector store search: {len(scores)} results")
if scores:
    print(f"Scores: {scores}")

# Try through retrieve method
docs, context = rs.retrieve(query, top_k=5)
print(f"\nThrough retrieve method: {len(docs)} documents")
