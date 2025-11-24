from services.retrieval_service import get_retrieval_service

print("Testing retrieval service...")
rs = get_retrieval_service()

query = "What are the common symptoms of fever in infants?"
print(f"\nQuery: {query}")

docs, context = rs.retrieve(query, top_k=5)

print(f"\nRetrieved {len(docs)} documents")
print(f"Context length: {len(context)} chars")

if docs:
    print(f"\nFirst document:")
    print(f"  Score: {docs[0]['score']:.4f}")
    print(f"  Source: {docs[0].get('source', 'Unknown')}")
    print(f"  Text preview: {docs[0]['text'][:200]}...")
else:
    print("\nNo documents retrieved!")
