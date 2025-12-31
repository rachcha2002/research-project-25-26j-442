from dotenv import load_dotenv
load_dotenv()

from services.retrieval_service import RetrievalService

# Create fresh instance
rs = RetrievalService()
print(f"Similarity threshold: {rs.similarity_threshold}")

query = "What are the common symptoms of fever in infants?"
print(f"\nQuery: {query}")

docs, context = rs.retrieve(query, top_k=5)
print(f"\nRetrieved {len(docs)} documents")

if docs:
    print(f"\nTop 3 results:")
    for i, doc in enumerate(docs[:3], 1):
        print(f"{i}. Score: {doc['score']:.4f}")
        print(f"   Source: {doc.get('source', 'Unknown')}")
        print(f"   Text: {doc['text'][:100]}...")
        print()
else:
    print("No documents retrieved!")
