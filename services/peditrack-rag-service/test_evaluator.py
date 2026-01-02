from dotenv import load_dotenv
load_dotenv()

from tests.rag_evaluator import RAGEvaluator

evaluator = RAGEvaluator()
print(f"Retrieval service threshold: {evaluator.retrieval_service.similarity_threshold}")

# Test one query
query = "What are the common symptoms of fever in infants?"
docs, context = evaluator.retrieval_service.retrieve(query, top_k=5)
print(f"Retrieved {len(docs)} documents")
if docs:
    print(f"First doc score: {docs[0]['score']:.4f}")
