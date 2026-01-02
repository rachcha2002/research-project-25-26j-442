from dotenv import load_dotenv
load_dotenv()

from services.embedding_service import get_embedding_service
from services.vector_store import get_vector_store

emb = get_embedding_service()
emb.load_model()

vs = get_vector_store(emb.get_embedding_dimension())
vs.load()

query = "What are the common symptoms of fever in infants?"
query_emb = emb.embed_text(query)

scores, metadata_list = vs.search(query_emb, top_k=5)

print(f"Vector store search returned:")
print(f"  Scores: {len(scores)} items")
print(f"  Metadata: {len(metadata_list)} items")
print(f"\nScores: {scores}")
print(f"\nFirst metadata keys: {list(metadata_list[0].keys()) if metadata_list else 'None'}")
print(f"\nFirst metadata text length: {len(metadata_list[0].get('text', '')) if metadata_list else 0}")

# Now test retrieval service filtering
print("\n" + "="*60)
print("Testing retrieval service filtering...")

threshold = 0.0
retrieved_docs = []
for score, metadata in zip(scores, metadata_list):
    print(f"Score: {score:.4f}, Threshold: {threshold}, Pass: {score >= threshold}")
    if score >= threshold:
        retrieved_docs.append({
            "text": metadata.get("text", ""),
            "score": score,
            "metadata": metadata,
            "source": metadata.get("source")
        })

print(f"\nFiltered docs: {len(retrieved_docs)}")
