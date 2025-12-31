"""
Visualize Actual Vector Store in 2D with Dataset Labels
Generates a detailed 2D scatter plot showing different datasets and categories
"""
import sys
import os
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from pathlib import Path
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
import seaborn as sns

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.vector_store import get_vector_store
from services.embedding_service import get_embedding_service
from utils.logger import setup_logger

logger = setup_logger(__name__)

def visualize_vector_space(output_file="data/vector_space_detailed.png", sample_size=3000):
    """
    Visualize vectors in 2D space with detailed dataset and category labels
    
    Args:
        output_file: Path to save the plot
        sample_size: Number of points to sample for t-SNE
    """
    print("=" * 70)
    print("DETAILED VECTOR SPACE VISUALIZATION")
    print("=" * 70)
    
    # Initialize services
    print("Initializing services...")
    embedding_service = get_embedding_service()
    vector_store = get_vector_store(embedding_service.get_embedding_dimension())
    
    # Load data
    if not vector_store.load():
        print("✗ Could not load vector store. Is it initialized?")
        return
    
    total_vectors = vector_store.index.ntotal
    print(f"✓ Loaded vector store with {total_vectors:,} vectors")
    
    if total_vectors == 0:
        print("✗ Vector store is empty")
        return

    # Extract vectors and metadata
    print("Extracting vectors and metadata...")
    
    # Sample indices if dataset is large
    if total_vectors > sample_size:
        print(f"Sampling {sample_size:,} points from {total_vectors:,} total...")
        indices = np.random.choice(total_vectors, sample_size, replace=False)
    else:
        indices = np.arange(total_vectors)
        sample_size = total_vectors
        
    # Retrieve vectors and metadata
    vectors = []
    metadatas = []
    
    for idx in indices:
        vec = vector_store.index.reconstruct(int(idx))
        vectors.append(vec)
        
        if int(idx) < len(vector_store.metadata):
            metadatas.append(vector_store.metadata[int(idx)])
        else:
            metadatas.append({"source": "Unknown", "metadata": {}})
            
    X = np.array(vectors)
    
    # Extract dataset sources and categories
    sources = []
    categories = []
    
    for m in metadatas:
        # Determine source dataset
        src = m.get("source", "Unknown")
        if "HealthCareMagic" in src:
            sources.append("HealthCareMagic")
        elif "PediatricsMQA" in src:
            sources.append("PediatricsMQA")
        elif "Symptom" in src or "Disease" in src:
            sources.append("Symptom Checker")
        elif "Medical QA" in src:
            sources.append("Medical QA")
        else:
            sources.append("Other")
        
        # Determine category from metadata
        meta = m.get("metadata", {})
        if isinstance(meta, dict):
            if meta.get("type") == "medical_qa_exam":
                categories.append("Exam Q&A")
            elif meta.get("type") == "symptom_mapping":
                categories.append("Symptoms")
            elif meta.get("type") == "disease_info":
                categories.append("Diseases")
            elif meta.get("type") == "qa_pair":
                categories.append("General Q&A")
            else:
                categories.append("Medical Dialogue")
        else:
            categories.append("Medical Dialogue")
    
    # Dimensionality Reduction
    print(f"Reducing dimensions for {len(X):,} vectors...")
    
    # Step 1: PCA to reduce noise
    print("  Running PCA...")
    pca = PCA(n_components=50)
    X_pca = pca.fit_transform(X)
    
    # Step 2: t-SNE for 2D visualization
    print("  Running t-SNE (this may take a few minutes)...")
    tsne = TSNE(n_components=2, random_state=42, perplexity=30, verbose=1)
    X_2d = tsne.fit_transform(X_pca)
    
    # Create DataFrame for plotting
    df_plot = pd.DataFrame({
        'x': X_2d[:, 0],
        'y': X_2d[:, 1],
        'Dataset': sources,
        'Category': categories
    })
    
    # Count statistics
    dataset_counts = df_plot['Dataset'].value_counts()
    category_counts = df_plot['Category'].value_counts()
    
    print("\n" + "=" * 70)
    print("DATASET DISTRIBUTION")
    print("=" * 70)
    for dataset, count in dataset_counts.items():
        print(f"  {dataset}: {count:,} documents ({count/len(df_plot)*100:.1f}%)")
    
    print("\n" + "=" * 70)
    print("CATEGORY DISTRIBUTION")
    print("=" * 70)
    for category, count in category_counts.items():
        print(f"  {category}: {count:,} documents ({count/len(df_plot)*100:.1f}%)")
    print("=" * 70)
    
    # Create visualization
    print("\nGenerating detailed plot...")
    
    # Set style
    sns.set_style("whitegrid")
    plt.rcParams['figure.facecolor'] = 'white'
    
    # Create figure with two subplots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(20, 8))
    
    # Plot 1: Color by Dataset
    palette1 = {'HealthCareMagic': '#2E86AB', 
                'PediatricsMQA': '#F77F00',
                'Symptom Checker': '#06A77D',
                'Medical QA': '#9B59B6',
                'Other': '#95A5A6'}
    
    for dataset in df_plot['Dataset'].unique():
        mask = df_plot['Dataset'] == dataset
        ax1.scatter(df_plot[mask]['x'], df_plot[mask]['y'], 
                   c=palette1.get(dataset, '#95A5A6'),
                   label=f"{dataset} ({dataset_counts[dataset]:,})",
                   alpha=0.6, s=30, edgecolors='none')
    
    ax1.set_title('Vector Space by Dataset Source', fontsize=16, fontweight='bold', pad=20)
    ax1.set_xlabel('t-SNE Dimension 1', fontsize=12)
    ax1.set_ylabel('t-SNE Dimension 2', fontsize=12)
    ax1.legend(loc='upper right', frameon=True, fancybox=True, shadow=True)
    ax1.grid(True, alpha=0.3)
    
    # Plot 2: Color by Category
    palette2 = {'Exam Q&A': '#E74C3C',
                'Symptoms': '#3498DB',
                'Diseases': '#2ECC71',
                'General Q&A': '#F39C12',
                'Medical Dialogue': '#9B59B6'}
    
    for category in df_plot['Category'].unique():
        mask = df_plot['Category'] == category
        ax2.scatter(df_plot[mask]['x'], df_plot[mask]['y'],
                   c=palette2.get(category, '#95A5A6'),
                   label=f"{category} ({category_counts[category]:,})",
                   alpha=0.6, s=30, edgecolors='none')
    
    ax2.set_title('Vector Space by Content Category', fontsize=16, fontweight='bold', pad=20)
    ax2.set_xlabel('t-SNE Dimension 1', fontsize=12)
    ax2.set_ylabel('t-SNE Dimension 2', fontsize=12)
    ax2.legend(loc='upper right', frameon=True, fancybox=True, shadow=True)
    ax2.grid(True, alpha=0.3)
    
    # Add overall title
    fig.suptitle(f'PediTrack RAG Vector Space Visualization\n{sample_size:,} Documents Sampled from {total_vectors:,} Total', 
                 fontsize=18, fontweight='bold', y=0.98)
    
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    
    # Save
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    
    print(f"\n✓ Plot saved to: {output_path.absolute()}")
    print()
    print("=" * 70)
    print("INTERPRETATION GUIDE")
    print("=" * 70)
    print("• Points close together = Semantically similar medical content")
    print("• Distinct clusters = Different medical topics or document types")
    print("• Overlap between datasets = Complementary information")
    print("• Left plot shows which dataset each document came from")
    print("• Right plot shows what type of medical content it is")
    print("=" * 70)

if __name__ == "__main__":
    visualize_vector_space()
