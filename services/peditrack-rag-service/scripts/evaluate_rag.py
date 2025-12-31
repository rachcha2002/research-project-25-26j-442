"""
Script to run RAG evaluation and generate reports
"""

import sys
import os
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests.rag_evaluator import RAGEvaluator
from utils.logger import setup_logger

logger = setup_logger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Evaluate RAG system accuracy")
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Number of documents to retrieve (default: 5)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="tests/evaluation_results",
        help="Directory to save evaluation results (default: tests/evaluation_results)"
    )
    parser.add_argument(
        "--ground-truth",
        type=str,
        default="tests/test_data/ground_truth_qa.json",
        help="Path to ground truth Q&A dataset"
    )
    
    args = parser.parse_args()
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info("Initializing RAG Evaluator...")
    evaluator = RAGEvaluator(ground_truth_path=args.ground_truth)
    
    # Run full evaluation
    logger.info("Running full evaluation suite...")
    results = evaluator.run_full_evaluation(top_k=args.top_k)
    
    # Save detailed results to JSON
    results_file = output_dir / f"evaluation_results_{results['evaluation_timestamp'].replace(':', '-').replace(' ', '_')}.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    logger.info(f"Detailed results saved to: {results_file}")
    
    # Generate and save summary report
    summary_report = evaluator.generate_summary_report(results)
    report_file = output_dir / f"evaluation_report_{results['evaluation_timestamp'].replace(':', '-').replace(' ', '_')}.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(summary_report)
    logger.info(f"Summary report saved to: {report_file}")
    
    # Print summary to console
    print("\n" + summary_report)
    
    # Save latest results as well
    latest_results_file = output_dir / "latest_evaluation.json"
    with open(latest_results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    latest_report_file = output_dir / "latest_report.txt"
    with open(latest_report_file, 'w', encoding='utf-8') as f:
        f.write(summary_report)
    
    logger.info("Evaluation complete!")
    
    return results


if __name__ == "__main__":
    main()
