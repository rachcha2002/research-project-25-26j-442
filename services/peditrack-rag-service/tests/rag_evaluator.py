"""
RAG Evaluation Module
Evaluates the accuracy and performance of the RAG system
"""

import json
import numpy as np
from typing import List, Dict, Any, Tuple
from sentence_transformers import SentenceTransformer, util
from services.retrieval_service import get_retrieval_service
from utils.logger import setup_logger
import time

logger = setup_logger(__name__)


class RAGEvaluator:
    """Evaluates RAG system performance using various metrics"""
    
    def __init__(self, ground_truth_path: str = "tests/test_data/ground_truth_qa.json"):
        """
        Initialize the RAG evaluator
        
        Args:
            ground_truth_path: Path to ground truth Q&A dataset
        """
        self.ground_truth_path = ground_truth_path
        self.retrieval_service = get_retrieval_service()
        
        # Load semantic similarity model for answer evaluation
        logger.info("Loading semantic similarity model...")
        self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Load ground truth data
        self.ground_truth = self._load_ground_truth()
        logger.info(f"Loaded {len(self.ground_truth)} ground truth Q&A pairs")
    
    def _load_ground_truth(self) -> List[Dict[str, Any]]:
        """Load ground truth Q&A pairs from JSON file"""
        try:
            with open(self.ground_truth_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading ground truth data: {e}")
            raise
    
    def evaluate_retrieval(self, top_k: int = 5) -> Dict[str, Any]:
        """
        Evaluate retrieval performance
        
        Args:
            top_k: Number of documents to retrieve
            
        Returns:
            Dictionary containing retrieval metrics
        """
        logger.info(f"Evaluating retrieval performance (top_k={top_k})...")
        
        results = {
            "total_queries": len(self.ground_truth),
            "top_k": top_k,
            "retrieval_scores": [],
            "avg_retrieval_time": 0,
            "keyword_match_rate": 0,
            "category_match_rate": 0,
            "avg_similarity_score": 0,
            "queries_with_results": 0,
            "queries_without_results": 0
        }
        
        total_time = 0
        keyword_matches = 0
        category_matches = 0
        total_similarity = 0
        
        for qa in self.ground_truth:
            query = qa["question"]
            expected_keywords = qa.get("keywords", [])
            expected_category = qa.get("category", "")
            
            # Measure retrieval time
            start_time = time.time()
            try:
                retrieved_docs, context = self.retrieval_service.retrieve(query, top_k=top_k)
                retrieval_time = time.time() - start_time
                total_time += retrieval_time
                
                if retrieved_docs:
                    results["queries_with_results"] += 1
                    
                    # Calculate average similarity score
                    avg_score = np.mean([doc["score"] for doc in retrieved_docs])
                    total_similarity += avg_score
                    
                    # Check keyword matches
                    retrieved_text = " ".join([doc["text"].lower() for doc in retrieved_docs])
                    keyword_found = any(kw.lower() in retrieved_text for kw in expected_keywords)
                    if keyword_found:
                        keyword_matches += 1
                    
                    # Check category match (if metadata contains category)
                    category_found = any(
                        expected_category.lower() in str(doc.get("metadata", {})).lower() 
                        for doc in retrieved_docs
                    )
                    if category_found:
                        category_matches += 1
                    
                    results["retrieval_scores"].append({
                        "query_id": qa["id"],
                        "question": query,
                        "num_results": len(retrieved_docs),
                        "avg_score": float(avg_score),
                        "retrieval_time": retrieval_time,
                        "keyword_match": keyword_found,
                        "category_match": category_found
                    })
                else:
                    results["queries_without_results"] += 1
                    logger.warning(f"No results for query: {query}")
                    
            except Exception as e:
                logger.error(f"Error retrieving for query '{query}': {e}")
                results["queries_without_results"] += 1
        
        # Calculate aggregate metrics
        if results["queries_with_results"] > 0:
            results["avg_retrieval_time"] = total_time / len(self.ground_truth)
            results["keyword_match_rate"] = keyword_matches / results["queries_with_results"]
            results["category_match_rate"] = category_matches / results["queries_with_results"]
            results["avg_similarity_score"] = total_similarity / results["queries_with_results"]
        
        logger.info(f"Retrieval evaluation complete. Success rate: {results['queries_with_results']}/{results['total_queries']}")
        
        return results
    
    def evaluate_semantic_similarity(self, top_k: int = 5) -> Dict[str, Any]:
        """
        Evaluate semantic similarity between retrieved context and expected answers
        
        Args:
            top_k: Number of documents to retrieve
            
        Returns:
            Dictionary containing semantic similarity metrics
        """
        logger.info(f"Evaluating semantic similarity (top_k={top_k})...")
        
        results = {
            "total_queries": len(self.ground_truth),
            "top_k": top_k,
            "similarity_scores": [],
            "avg_similarity": 0,
            "high_similarity_count": 0,  # similarity > 0.7
            "medium_similarity_count": 0,  # 0.5 < similarity <= 0.7
            "low_similarity_count": 0  # similarity <= 0.5
        }
        
        total_similarity = 0
        
        for qa in self.ground_truth:
            query = qa["question"]
            expected_answer = qa["expected_answer"]
            
            try:
                retrieved_docs, context = self.retrieval_service.retrieve(query, top_k=top_k)
                
                if context:
                    # Calculate semantic similarity between context and expected answer
                    context_embedding = self.similarity_model.encode(context, convert_to_tensor=True)
                    answer_embedding = self.similarity_model.encode(expected_answer, convert_to_tensor=True)
                    
                    similarity = util.cos_sim(context_embedding, answer_embedding).item()
                    total_similarity += similarity
                    
                    # Categorize similarity
                    if similarity > 0.7:
                        results["high_similarity_count"] += 1
                        quality = "high"
                    elif similarity > 0.5:
                        results["medium_similarity_count"] += 1
                        quality = "medium"
                    else:
                        results["low_similarity_count"] += 1
                        quality = "low"
                    
                    results["similarity_scores"].append({
                        "query_id": qa["id"],
                        "question": query,
                        "similarity": float(similarity),
                        "quality": quality,
                        "num_docs_retrieved": len(retrieved_docs)
                    })
                else:
                    logger.warning(f"No context retrieved for query: {query}")
                    results["similarity_scores"].append({
                        "query_id": qa["id"],
                        "question": query,
                        "similarity": 0.0,
                        "quality": "no_results",
                        "num_docs_retrieved": 0
                    })
                    
            except Exception as e:
                logger.error(f"Error evaluating similarity for query '{query}': {e}")
        
        # Calculate average similarity
        if results["similarity_scores"]:
            valid_scores = [s["similarity"] for s in results["similarity_scores"] if s["similarity"] > 0]
            results["avg_similarity"] = np.mean(valid_scores) if valid_scores else 0
        
        logger.info(f"Semantic similarity evaluation complete. Avg similarity: {results['avg_similarity']:.3f}")
        
        return results
    
    def evaluate_by_category(self, top_k: int = 5) -> Dict[str, Any]:
        """
        Evaluate performance broken down by category
        
        Args:
            top_k: Number of documents to retrieve
            
        Returns:
            Dictionary containing category-wise metrics
        """
        logger.info("Evaluating performance by category...")
        
        category_results = {}
        
        for qa in self.ground_truth:
            category = qa.get("category", "unknown")
            
            if category not in category_results:
                category_results[category] = {
                    "count": 0,
                    "total_similarity": 0,
                    "total_retrieval_score": 0,
                    "queries_with_results": 0
                }
            
            category_results[category]["count"] += 1
            
            try:
                query = qa["question"]
                expected_answer = qa["expected_answer"]
                
                retrieved_docs, context = self.retrieval_service.retrieve(query, top_k=top_k)
                
                if retrieved_docs:
                    category_results[category]["queries_with_results"] += 1
                    
                    # Average retrieval score
                    avg_score = np.mean([doc["score"] for doc in retrieved_docs])
                    category_results[category]["total_retrieval_score"] += avg_score
                    
                    # Semantic similarity
                    if context:
                        context_embedding = self.similarity_model.encode(context, convert_to_tensor=True)
                        answer_embedding = self.similarity_model.encode(expected_answer, convert_to_tensor=True)
                        similarity = util.cos_sim(context_embedding, answer_embedding).item()
                        category_results[category]["total_similarity"] += similarity
                        
            except Exception as e:
                logger.error(f"Error evaluating category '{category}': {e}")
        
        # Calculate averages
        for category, data in category_results.items():
            if data["queries_with_results"] > 0:
                data["avg_similarity"] = data["total_similarity"] / data["queries_with_results"]
                data["avg_retrieval_score"] = data["total_retrieval_score"] / data["queries_with_results"]
                data["success_rate"] = data["queries_with_results"] / data["count"]
            else:
                data["avg_similarity"] = 0
                data["avg_retrieval_score"] = 0
                data["success_rate"] = 0
        
        logger.info(f"Category evaluation complete for {len(category_results)} categories")
        
        return category_results
    
    def evaluate_by_difficulty(self, top_k: int = 5) -> Dict[str, Any]:
        """
        Evaluate performance broken down by difficulty level
        
        Args:
            top_k: Number of documents to retrieve
            
        Returns:
            Dictionary containing difficulty-wise metrics
        """
        logger.info("Evaluating performance by difficulty...")
        
        difficulty_results = {}
        
        for qa in self.ground_truth:
            difficulty = qa.get("difficulty", "unknown")
            
            if difficulty not in difficulty_results:
                difficulty_results[difficulty] = {
                    "count": 0,
                    "total_similarity": 0,
                    "total_retrieval_score": 0,
                    "queries_with_results": 0
                }
            
            difficulty_results[difficulty]["count"] += 1
            
            try:
                query = qa["question"]
                expected_answer = qa["expected_answer"]
                
                retrieved_docs, context = self.retrieval_service.retrieve(query, top_k=top_k)
                
                if retrieved_docs:
                    difficulty_results[difficulty]["queries_with_results"] += 1
                    
                    # Average retrieval score
                    avg_score = np.mean([doc["score"] for doc in retrieved_docs])
                    difficulty_results[difficulty]["total_retrieval_score"] += avg_score
                    
                    # Semantic similarity
                    if context:
                        context_embedding = self.similarity_model.encode(context, convert_to_tensor=True)
                        answer_embedding = self.similarity_model.encode(expected_answer, convert_to_tensor=True)
                        similarity = util.cos_sim(context_embedding, answer_embedding).item()
                        difficulty_results[difficulty]["total_similarity"] += similarity
                        
            except Exception as e:
                logger.error(f"Error evaluating difficulty '{difficulty}': {e}")
        
        # Calculate averages
        for difficulty, data in difficulty_results.items():
            if data["queries_with_results"] > 0:
                data["avg_similarity"] = data["total_similarity"] / data["queries_with_results"]
                data["avg_retrieval_score"] = data["total_retrieval_score"] / data["queries_with_results"]
                data["success_rate"] = data["queries_with_results"] / data["count"]
            else:
                data["avg_similarity"] = 0
                data["avg_retrieval_score"] = 0
                data["success_rate"] = 0
        
        logger.info(f"Difficulty evaluation complete for {len(difficulty_results)} levels")
        
        return difficulty_results
    
    def run_full_evaluation(self, top_k: int = 5) -> Dict[str, Any]:
        """
        Run complete evaluation suite
        
        Args:
            top_k: Number of documents to retrieve
            
        Returns:
            Dictionary containing all evaluation results
        """
        logger.info("=" * 60)
        logger.info("Starting Full RAG Evaluation")
        logger.info("=" * 60)
        
        start_time = time.time()
        
        results = {
            "evaluation_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "top_k": top_k,
            "total_ground_truth_queries": len(self.ground_truth),
            "retrieval_metrics": self.evaluate_retrieval(top_k),
            "semantic_similarity_metrics": self.evaluate_semantic_similarity(top_k),
            "category_performance": self.evaluate_by_category(top_k),
            "difficulty_performance": self.evaluate_by_difficulty(top_k),
            "total_evaluation_time": 0
        }
        
        results["total_evaluation_time"] = time.time() - start_time
        
        logger.info("=" * 60)
        logger.info(f"Full Evaluation Complete in {results['total_evaluation_time']:.2f}s")
        logger.info("=" * 60)
        
        return results
    
    def generate_summary_report(self, results: Dict[str, Any]) -> str:
        """
        Generate a human-readable summary report
        
        Args:
            results: Evaluation results from run_full_evaluation
            
        Returns:
            Formatted summary report string
        """
        report = []
        report.append("=" * 80)
        report.append("RAG SYSTEM EVALUATION REPORT")
        report.append("=" * 80)
        report.append(f"Timestamp: {results['evaluation_timestamp']}")
        report.append(f"Total Queries Tested: {results['total_ground_truth_queries']}")
        report.append(f"Top-K Documents: {results['top_k']}")
        report.append(f"Total Evaluation Time: {results['total_evaluation_time']:.2f}s")
        report.append("")
        
        # Retrieval Metrics
        retrieval = results["retrieval_metrics"]
        report.append("RETRIEVAL PERFORMANCE")
        report.append("-" * 80)
        report.append(f"Queries with Results: {retrieval['queries_with_results']}/{retrieval['total_queries']} ({retrieval['queries_with_results']/retrieval['total_queries']*100:.1f}%)")
        report.append(f"Average Retrieval Time: {retrieval['avg_retrieval_time']*1000:.2f}ms")
        report.append(f"Keyword Match Rate: {retrieval['keyword_match_rate']*100:.1f}%")
        report.append(f"Average Similarity Score: {retrieval['avg_similarity_score']:.3f}")
        report.append("")
        
        # Semantic Similarity
        semantic = results["semantic_similarity_metrics"]
        report.append("SEMANTIC SIMILARITY ANALYSIS")
        report.append("-" * 80)
        report.append(f"Average Similarity: {semantic['avg_similarity']:.3f}")
        report.append(f"High Quality (>0.7): {semantic['high_similarity_count']} ({semantic['high_similarity_count']/semantic['total_queries']*100:.1f}%)")
        report.append(f"Medium Quality (0.5-0.7): {semantic['medium_similarity_count']} ({semantic['medium_similarity_count']/semantic['total_queries']*100:.1f}%)")
        report.append(f"Low Quality (<0.5): {semantic['low_similarity_count']} ({semantic['low_similarity_count']/semantic['total_queries']*100:.1f}%)")
        report.append("")
        
        # Category Performance
        report.append("PERFORMANCE BY CATEGORY")
        report.append("-" * 80)
        for category, data in sorted(results["category_performance"].items()):
            report.append(f"{category.upper()}: Avg Similarity={data['avg_similarity']:.3f}, Success Rate={data['success_rate']*100:.1f}%")
        report.append("")
        
        # Difficulty Performance
        report.append("PERFORMANCE BY DIFFICULTY")
        report.append("-" * 80)
        difficulty_order = ["easy", "medium", "hard"]
        for difficulty in difficulty_order:
            if difficulty in results["difficulty_performance"]:
                data = results["difficulty_performance"][difficulty]
                report.append(f"{difficulty.upper()}: Avg Similarity={data['avg_similarity']:.3f}, Success Rate={data['success_rate']*100:.1f}%")
        report.append("")
        
        # Overall Assessment
        report.append("OVERALL ASSESSMENT")
        report.append("-" * 80)
        avg_sim = semantic['avg_similarity']
        if avg_sim >= 0.7:
            assessment = "EXCELLENT - RAG system is performing very well"
        elif avg_sim >= 0.6:
            assessment = "GOOD - RAG system is performing adequately"
        elif avg_sim >= 0.5:
            assessment = "FAIR - RAG system needs improvement"
        else:
            assessment = "POOR - RAG system requires significant improvement"
        report.append(assessment)
        report.append("=" * 80)
        
        return "\n".join(report)
