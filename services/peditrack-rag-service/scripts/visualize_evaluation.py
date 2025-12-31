"""
Visualization script for RAG evaluation results
"""

import sys
import os
import json
import argparse
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.logger import setup_logger

logger = setup_logger(__name__)

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (16, 12)


def load_evaluation_results(results_path: str) -> dict:
    """Load evaluation results from JSON file"""
    with open(results_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def plot_similarity_distribution(results: dict, output_dir: Path):
    """Plot distribution of similarity scores"""
    semantic = results["semantic_similarity_metrics"]
    scores = [s["similarity"] for s in semantic["similarity_scores"] if s["similarity"] > 0]
    
    plt.figure(figsize=(10, 6))
    plt.hist(scores, bins=20, edgecolor='black', alpha=0.7, color='#3498db')
    plt.axvline(np.mean(scores), color='red', linestyle='--', linewidth=2, label=f'Mean: {np.mean(scores):.3f}')
    plt.xlabel('Semantic Similarity Score', fontsize=12)
    plt.ylabel('Frequency', fontsize=12)
    plt.title('Distribution of Semantic Similarity Scores', fontsize=14, fontweight='bold')
    plt.legend()
    plt.tight_layout()
    
    output_file = output_dir / "similarity_distribution.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    logger.info(f"Saved similarity distribution plot to: {output_file}")
    plt.close()


def plot_category_performance(results: dict, output_dir: Path):
    """Plot performance by category"""
    category_data = results["category_performance"]
    
    categories = list(category_data.keys())
    similarities = [category_data[cat]["avg_similarity"] for cat in categories]
    success_rates = [category_data[cat]["success_rate"] * 100 for cat in categories]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
    
    # Similarity by category
    bars1 = ax1.barh(categories, similarities, color='#2ecc71', alpha=0.8)
    ax1.set_xlabel('Average Similarity Score', fontsize=12)
    ax1.set_title('Average Similarity by Category', fontsize=14, fontweight='bold')
    ax1.set_xlim(0, 1)
    
    # Add value labels
    for i, bar in enumerate(bars1):
        width = bar.get_width()
        ax1.text(width + 0.02, bar.get_y() + bar.get_height()/2, 
                f'{width:.3f}', ha='left', va='center', fontsize=10)
    
    # Success rate by category
    bars2 = ax2.barh(categories, success_rates, color='#e74c3c', alpha=0.8)
    ax2.set_xlabel('Success Rate (%)', fontsize=12)
    ax2.set_title('Success Rate by Category', fontsize=14, fontweight='bold')
    ax2.set_xlim(0, 100)
    
    # Add value labels
    for i, bar in enumerate(bars2):
        width = bar.get_width()
        ax2.text(width + 2, bar.get_y() + bar.get_height()/2, 
                f'{width:.1f}%', ha='left', va='center', fontsize=10)
    
    plt.tight_layout()
    output_file = output_dir / "category_performance.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    logger.info(f"Saved category performance plot to: {output_file}")
    plt.close()


def plot_difficulty_performance(results: dict, output_dir: Path):
    """Plot performance by difficulty level"""
    difficulty_data = results["difficulty_performance"]
    
    difficulty_order = ["easy", "medium", "hard"]
    difficulties = [d for d in difficulty_order if d in difficulty_data]
    
    similarities = [difficulty_data[d]["avg_similarity"] for d in difficulties]
    success_rates = [difficulty_data[d]["success_rate"] * 100 for d in difficulties]
    counts = [difficulty_data[d]["count"] for d in difficulties]
    
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    
    colors = ['#2ecc71', '#f39c12', '#e74c3c']
    
    # Similarity by difficulty
    bars1 = axes[0].bar(difficulties, similarities, color=colors, alpha=0.8)
    axes[0].set_ylabel('Average Similarity Score', fontsize=12)
    axes[0].set_title('Similarity by Difficulty', fontsize=14, fontweight='bold')
    axes[0].set_ylim(0, 1)
    
    for i, bar in enumerate(bars1):
        height = bar.get_height()
        axes[0].text(bar.get_x() + bar.get_width()/2, height + 0.02,
                    f'{height:.3f}', ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    # Success rate by difficulty
    bars2 = axes[1].bar(difficulties, success_rates, color=colors, alpha=0.8)
    axes[1].set_ylabel('Success Rate (%)', fontsize=12)
    axes[1].set_title('Success Rate by Difficulty', fontsize=14, fontweight='bold')
    axes[1].set_ylim(0, 100)
    
    for i, bar in enumerate(bars2):
        height = bar.get_height()
        axes[1].text(bar.get_x() + bar.get_width()/2, height + 2,
                    f'{height:.1f}%', ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    # Query count by difficulty
    bars3 = axes[2].bar(difficulties, counts, color=colors, alpha=0.8)
    axes[2].set_ylabel('Number of Queries', fontsize=12)
    axes[2].set_title('Query Distribution by Difficulty', fontsize=14, fontweight='bold')
    
    for i, bar in enumerate(bars3):
        height = bar.get_height()
        axes[2].text(bar.get_x() + bar.get_width()/2, height + 0.2,
                    f'{int(height)}', ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    plt.tight_layout()
    output_file = output_dir / "difficulty_performance.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    logger.info(f"Saved difficulty performance plot to: {output_file}")
    plt.close()


def plot_quality_breakdown(results: dict, output_dir: Path):
    """Plot quality breakdown pie chart"""
    semantic = results["semantic_similarity_metrics"]
    
    labels = ['High Quality\n(>0.7)', 'Medium Quality\n(0.5-0.7)', 'Low Quality\n(<0.5)']
    sizes = [
        semantic["high_similarity_count"],
        semantic["medium_similarity_count"],
        semantic["low_similarity_count"]
    ]
    colors = ['#2ecc71', '#f39c12', '#e74c3c']
    explode = (0.1, 0, 0)
    
    plt.figure(figsize=(10, 8))
    plt.pie(sizes, explode=explode, labels=labels, colors=colors, autopct='%1.1f%%',
            shadow=True, startangle=90, textprops={'fontsize': 12, 'fontweight': 'bold'})
    plt.title('RAG Response Quality Breakdown', fontsize=16, fontweight='bold', pad=20)
    
    output_file = output_dir / "quality_breakdown.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    logger.info(f"Saved quality breakdown plot to: {output_file}")
    plt.close()


def plot_retrieval_performance(results: dict, output_dir: Path):
    """Plot retrieval performance metrics"""
    retrieval = results["retrieval_metrics"]
    
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    
    # Success vs Failure
    success_data = [retrieval["queries_with_results"], retrieval["queries_without_results"]]
    success_labels = ['Success', 'No Results']
    colors1 = ['#2ecc71', '#e74c3c']
    
    axes[0, 0].pie(success_data, labels=success_labels, colors=colors1, autopct='%1.1f%%',
                   startangle=90, textprops={'fontsize': 11, 'fontweight': 'bold'})
    axes[0, 0].set_title('Query Success Rate', fontsize=13, fontweight='bold')
    
    # Keyword match rate
    match_data = [retrieval["keyword_match_rate"] * 100, (1 - retrieval["keyword_match_rate"]) * 100]
    match_labels = ['Keyword Match', 'No Match']
    colors2 = ['#3498db', '#95a5a6']
    
    axes[0, 1].pie(match_data, labels=match_labels, colors=colors2, autopct='%1.1f%%',
                   startangle=90, textprops={'fontsize': 11, 'fontweight': 'bold'})
    axes[0, 1].set_title('Keyword Match Rate', fontsize=13, fontweight='bold')
    
    # Average retrieval time
    avg_time_ms = retrieval["avg_retrieval_time"] * 1000
    axes[1, 0].bar(['Avg Retrieval Time'], [avg_time_ms], color='#9b59b6', alpha=0.8)
    axes[1, 0].set_ylabel('Time (ms)', fontsize=11)
    axes[1, 0].set_title('Average Retrieval Time', fontsize=13, fontweight='bold')
    axes[1, 0].text(0, avg_time_ms + 5, f'{avg_time_ms:.2f}ms', 
                    ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    # Average similarity score
    avg_sim = retrieval["avg_similarity_score"]
    axes[1, 1].bar(['Avg Similarity'], [avg_sim], color='#1abc9c', alpha=0.8)
    axes[1, 1].set_ylabel('Score', fontsize=11)
    axes[1, 1].set_ylim(0, 1)
    axes[1, 1].set_title('Average Retrieval Similarity', fontsize=13, fontweight='bold')
    axes[1, 1].text(0, avg_sim + 0.02, f'{avg_sim:.3f}', 
                    ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    plt.tight_layout()
    output_file = output_dir / "retrieval_performance.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    logger.info(f"Saved retrieval performance plot to: {output_file}")
    plt.close()


def plot_top_queries(results: dict, output_dir: Path, top_n: int = 10):
    """Plot top and bottom performing queries"""
    semantic = results["semantic_similarity_metrics"]
    scores = semantic["similarity_scores"]
    
    # Sort by similarity
    sorted_scores = sorted(scores, key=lambda x: x["similarity"], reverse=True)
    
    # Get top and bottom queries
    top_queries = sorted_scores[:top_n]
    bottom_queries = sorted_scores[-top_n:]
    
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10))
    
    # Top performing queries
    top_questions = [q["question"][:50] + "..." if len(q["question"]) > 50 else q["question"] 
                     for q in top_queries]
    top_sims = [q["similarity"] for q in top_queries]
    
    bars1 = ax1.barh(range(len(top_questions)), top_sims, color='#2ecc71', alpha=0.8)
    ax1.set_yticks(range(len(top_questions)))
    ax1.set_yticklabels(top_questions, fontsize=9)
    ax1.set_xlabel('Similarity Score', fontsize=11)
    ax1.set_title(f'Top {top_n} Best Performing Queries', fontsize=13, fontweight='bold')
    ax1.set_xlim(0, 1)
    
    for i, bar in enumerate(bars1):
        width = bar.get_width()
        ax1.text(width + 0.02, bar.get_y() + bar.get_height()/2,
                f'{width:.3f}', ha='left', va='center', fontsize=9)
    
    # Bottom performing queries
    bottom_questions = [q["question"][:50] + "..." if len(q["question"]) > 50 else q["question"] 
                        for q in bottom_queries]
    bottom_sims = [q["similarity"] for q in bottom_queries]
    
    bars2 = ax2.barh(range(len(bottom_questions)), bottom_sims, color='#e74c3c', alpha=0.8)
    ax2.set_yticks(range(len(bottom_questions)))
    ax2.set_yticklabels(bottom_questions, fontsize=9)
    ax2.set_xlabel('Similarity Score', fontsize=11)
    ax2.set_title(f'Top {top_n} Worst Performing Queries', fontsize=13, fontweight='bold')
    ax2.set_xlim(0, 1)
    
    for i, bar in enumerate(bars2):
        width = bar.get_width()
        ax2.text(width + 0.02, bar.get_y() + bar.get_height()/2,
                f'{width:.3f}', ha='left', va='center', fontsize=9)
    
    plt.tight_layout()
    output_file = output_dir / "top_bottom_queries.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    logger.info(f"Saved top/bottom queries plot to: {output_file}")
    plt.close()


def create_dashboard(results: dict, output_dir: Path):
    """Create a comprehensive dashboard with all metrics"""
    fig = plt.figure(figsize=(20, 12))
    gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
    
    # Overall metrics
    ax1 = fig.add_subplot(gs[0, :])
    ax1.axis('off')
    
    semantic = results["semantic_similarity_metrics"]
    retrieval = results["retrieval_metrics"]
    
    metrics_text = f"""
    RAG SYSTEM EVALUATION DASHBOARD
    Timestamp: {results['evaluation_timestamp']}
    
    OVERALL PERFORMANCE:
    • Average Semantic Similarity: {semantic['avg_similarity']:.3f}
    • Query Success Rate: {retrieval['queries_with_results']}/{retrieval['total_queries']} ({retrieval['queries_with_results']/retrieval['total_queries']*100:.1f}%)
    • Average Retrieval Time: {retrieval['avg_retrieval_time']*1000:.2f}ms
    • Keyword Match Rate: {retrieval['keyword_match_rate']*100:.1f}%
    
    QUALITY BREAKDOWN:
    • High Quality (>0.7): {semantic['high_similarity_count']} queries ({semantic['high_similarity_count']/semantic['total_queries']*100:.1f}%)
    • Medium Quality (0.5-0.7): {semantic['medium_similarity_count']} queries ({semantic['medium_similarity_count']/semantic['total_queries']*100:.1f}%)
    • Low Quality (<0.5): {semantic['low_similarity_count']} queries ({semantic['low_similarity_count']/semantic['total_queries']*100:.1f}%)
    """
    
    ax1.text(0.1, 0.5, metrics_text, fontsize=12, verticalalignment='center',
             fontfamily='monospace', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3))
    
    # Quality pie chart
    ax2 = fig.add_subplot(gs[1, 0])
    sizes = [semantic["high_similarity_count"], semantic["medium_similarity_count"], semantic["low_similarity_count"]]
    colors = ['#2ecc71', '#f39c12', '#e74c3c']
    ax2.pie(sizes, labels=['High', 'Medium', 'Low'], colors=colors, autopct='%1.1f%%', startangle=90)
    ax2.set_title('Quality Distribution', fontweight='bold')
    
    # Similarity distribution
    ax3 = fig.add_subplot(gs[1, 1:])
    scores = [s["similarity"] for s in semantic["similarity_scores"] if s["similarity"] > 0]
    ax3.hist(scores, bins=15, edgecolor='black', alpha=0.7, color='#3498db')
    ax3.axvline(np.mean(scores), color='red', linestyle='--', linewidth=2, label=f'Mean: {np.mean(scores):.3f}')
    ax3.set_xlabel('Similarity Score')
    ax3.set_ylabel('Frequency')
    ax3.set_title('Similarity Score Distribution', fontweight='bold')
    ax3.legend()
    
    # Category performance
    ax4 = fig.add_subplot(gs[2, :])
    category_data = results["category_performance"]
    categories = list(category_data.keys())
    similarities = [category_data[cat]["avg_similarity"] for cat in categories]
    
    bars = ax4.bar(categories, similarities, color='#9b59b6', alpha=0.8)
    ax4.set_ylabel('Average Similarity')
    ax4.set_title('Performance by Category', fontweight='bold')
    ax4.set_ylim(0, 1)
    plt.setp(ax4.xaxis.get_majorticklabels(), rotation=45, ha='right')
    
    for bar in bars:
        height = bar.get_height()
        ax4.text(bar.get_x() + bar.get_width()/2, height + 0.02,
                f'{height:.2f}', ha='center', va='bottom', fontsize=9)
    
    output_file = output_dir / "evaluation_dashboard.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    logger.info(f"Saved evaluation dashboard to: {output_file}")
    plt.close()


def main():
    parser = argparse.ArgumentParser(description="Visualize RAG evaluation results")
    parser.add_argument(
        "--results",
        type=str,
        default="tests/evaluation_results/latest_evaluation.json",
        help="Path to evaluation results JSON file"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="tests/evaluation_results/visualizations",
        help="Directory to save visualization plots"
    )
    
    args = parser.parse_args()
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load results
    logger.info(f"Loading evaluation results from: {args.results}")
    results = load_evaluation_results(args.results)
    
    # Generate all visualizations
    logger.info("Generating visualizations...")
    
    plot_similarity_distribution(results, output_dir)
    plot_category_performance(results, output_dir)
    plot_difficulty_performance(results, output_dir)
    plot_quality_breakdown(results, output_dir)
    plot_retrieval_performance(results, output_dir)
    plot_top_queries(results, output_dir)
    create_dashboard(results, output_dir)
    
    logger.info(f"All visualizations saved to: {output_dir}")
    print(f"\n✅ Visualizations complete! Check {output_dir} for all plots.")


if __name__ == "__main__":
    main()
