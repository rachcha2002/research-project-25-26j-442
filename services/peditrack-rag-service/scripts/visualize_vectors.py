"""
Visualize Vector Store in 2D
Generates a 2D scatter plot of the RAG vector embeddings using t-SNE/PCA
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

def install_dependencies():
    """Install visualization dependencies if missing"""
    try:
        import matplotlib
        import sklearn
        import seaborn
        return True
    except ImportError:
        print("📦 Installing visualization dependencies...")
        os.system("pip install matplotlib scikit-learn seaborn pandas")
        return True

def visualize_vectors(output_file="data/vector_plot.png", sample_size=3000):
    """
    Visualize vectors in 2D space
    
    Args:
        output_file: Path to save the plot
        sample_size: Number of points to sample for t-SNE (it's slow on large datasets)
    """
    print("=" * 70)
    print("VECTOR STORE VISUALIZATION")
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
    print(f"✓ Loaded vector store with {total_vectors} vectors")
    
    if total_vectors == 0:
        print("✗ Vector store is empty")
        return

    # Extract vectors and metadata
    print("Extracting vectors and metadata...")
    
    # FAISS IndexFlatL2 allows direct access to vectors via reconstruct_n
    # We'll sample indices if dataset is large
    if total_vectors > sample_size:
        print(f"Dataset too large for t-SNE ({total_vectors}). Sampling {sample_size} points...")
        indices = np.random.choice(total_vectors, sample_size, replace=False)
    else:
        indices = np.arange(total_vectors)
        
    # Retrieve vectors
    vectors = []
    metadatas = []
    
    for idx in indices:
        # Reconstruct vector from FAISS
        # Note: idx must be int, not numpy type
        vec = vector_store.index.reconstruct(int(idx))
        vectors.append(vec)
        
        # Get metadata
        if int(idx) < len(vector_store.metadata):
            metadatas.append(vector_store.metadata[int(idx)])
        else:
            metadatas.append({"source": "Unknown"})
            
    X = np.array(vectors)
    
    # Extract sources for coloring
    sources = []
    for m in metadatas:
        # Simplify source names for cleaner legend
        src = m.get("source", "Unknown")
        if "HealthCareMagic" in src:
            sources.append("HealthCareMagic")
        elif "MedQuad" in src:
            sources.append("MedQuad")
        elif "MedDialog" in src:
            sources.append("MedDialog")
        elif "Symptom" in src:
            sources.append("Symptom Checker")
        elif "PediatricsMQA" in src:
            sources.append("PediatricsMQA")
        else:
            sources.append("Other")
            
    # Dimensionality Reduction
    print(f"Reducing dimensions for {len(X)} vectors...")
    
    # 1. PCA first to reduce noise (optional but good practice)
    pca = PCA(n_components=50)
    X_pca = pca.fit_transform(X)
    
    # 2. t-SNE for 2D visualization
    print("Running t-SNE (this may take a moment)...")
    tsne = TSNE(n_components=2, random_state=42, perplexity=30)
    X_2d = tsne.fit_transform(X_pca)
    
    # Create DataFrame for plotting
    df_plot = pd.DataFrame({
        'x': X_2d[:, 0],
        'y': X_2d[:, 1],
        'Source': sources
    })
    
    # Plotting
    print("Generating plot...")
    plt.figure(figsize=(12, 8))
    sns.set_style("whitegrid")
    
    # Scatter plot with coloring by source
    scatter = sns.scatterplot(
        data=df_plot,
        x='x',
        y='y',
        hue='Source',
        palette='viridis',
        alpha=0.7,
        s=60
    )
    
    plt.title(f'RAG Vector Space Visualization (t-SNE)\n{len(X)} Sampled Documents', fontsize=15)
    plt.xlabel('t-SNE dimension 1')
    plt.ylabel('t-SNE dimension 2')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    
    # Save
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    
    print(f"✓ Plot saved to: {output_path.absolute()}")
    print()
    print("Interpretation:")
    print("- Points closer together represent semantically similar medical documents")
    print("- Clusters indicate distinct medical topics or dataset characteristics")
    print("=" * 70)

if __name__ == "__main__":
    install_dependencies()
    visualize_vectors()
