# Vector Space Visualization

## 📊 Visualization Generated

A 2D visualization of your RAG vector store has been generated at:
`data/vector_plot.png`

### **What this plot shows:**
- **Clusters**: Groups of dots represent semantically similar medical documents.
- **Colors**: Different colors indicate different datasets (HealthCareMagic, Symptom Checker, etc.).
- **Structure**: The spatial arrangement reveals how the model organizes medical concepts.

### **Interpretation:**
1. **Tight Clusters**: Indicate specific medical topics (e.g., "vaccination", "fever") where documents are very similar.
2. **Separation**: If datasets are well-separated, it means they cover different domains or have different writing styles.
3. **Overlap**: Overlap between datasets (e.g., HealthCareMagic and PediatricQA) is GOOD - it means they reinforce each other on similar topics.

### **Technical Details:**
- **Method**: t-SNE (t-Distributed Stochastic Neighbor Embedding)
- **Preprocessing**: PCA (Principal Component Analysis) to 50 dims
- **Sample Size**: 3,000 documents (sampled from 72,714)
- **Dimensions**: Reduced from 384 (BERT) to 2 (Plot)

---

## 🚀 How to View
Open `data/vector_plot.png` in your image viewer.

## 🔄 To Regenerate
```bash
python scripts\visualize_vectors.py
```
