# 🎯 RAG Evaluation Quick Reference

## Run Evaluation (3 Simple Steps)

### Step 1: Ensure RAG Service is Ready
```bash
# Make sure vector store is loaded
start.bat
```

### Step 2: Run Evaluation
```bash
# Double-click or run:
evaluate_rag.bat
```

### Step 3: View Results
```bash
# Double-click or run:
visualize_evaluation.bat
```

## 📊 What Gets Evaluated?

| Metric | What it Measures | Good Score |
|--------|------------------|------------|
| **Semantic Similarity** | How well retrieved content matches expected answers | > 0.7 |
| **Success Rate** | % of queries that got results | > 95% |
| **Retrieval Time** | Speed of document retrieval | < 200ms |
| **Keyword Match** | % of queries with relevant keywords found | > 80% |

## 📈 Understanding Your Results

### Overall Assessment
- **EXCELLENT** (≥0.7): Your RAG is performing great! 🎉
- **GOOD** (≥0.6): Solid performance, minor improvements possible ✅
- **FAIR** (≥0.5): Needs improvement 🔧
- **POOR** (<0.5): Requires significant work ⚠️

### Quality Breakdown
- **High Quality (>0.7)**: Perfect! These queries are working great
- **Medium Quality (0.5-0.7)**: Acceptable, but could be better
- **Low Quality (<0.5)**: Need attention - check these queries

## 🔍 Where to Find Results

After running evaluation:
```
tests/
└── evaluation_results/
    ├── latest_report.txt          ← Read this first!
    ├── latest_evaluation.json     ← Detailed metrics
    └── visualizations/
        ├── evaluation_dashboard.png    ← Overview
        ├── similarity_distribution.png ← Score distribution
        ├── category_performance.png    ← By topic
        ├── difficulty_performance.png  ← By difficulty
        ├── quality_breakdown.png       ← Quality pie chart
        ├── retrieval_performance.png   ← Retrieval stats
        └── top_bottom_queries.png      ← Best/worst queries
```

## 🛠️ Common Commands

```bash
# Basic evaluation
evaluate_rag.bat

# Evaluate with more documents
python scripts\evaluate_rag.py --top-k 10

# Generate visualizations
visualize_evaluation.bat

# View latest report
type tests\evaluation_results\latest_report.txt
```

## 🎨 Visualization Guide

### 1. Dashboard (evaluation_dashboard.png)
- **Top Section**: Overall metrics summary
- **Pie Chart**: Quality distribution
- **Histogram**: Similarity score spread
- **Bar Chart**: Performance by category

### 2. Category Performance (category_performance.png)
- **Left Chart**: Average similarity by medical topic
- **Right Chart**: Success rate by topic
- Shows which medical areas need improvement

### 3. Difficulty Performance (difficulty_performance.png)
- **Left**: Similarity by difficulty (easy/medium/hard)
- **Middle**: Success rate by difficulty
- **Right**: Number of queries per difficulty

### 4. Top/Bottom Queries (top_bottom_queries.png)
- **Top**: Best performing queries (learn from these!)
- **Bottom**: Worst performing queries (need improvement)

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Vector store not found" | Run `init.bat` first |
| "Module not found" | Run `pip install -r requirements.txt` |
| Low scores | Add more relevant documents to vector store |
| Slow retrieval | Check `top_k` value (lower = faster) |

## 💡 Tips for Better Results

1. **Add More Documents**: More relevant data = better results
2. **Tune Top-K**: Try different values (3, 5, 10)
3. **Check Categories**: Focus on low-performing topics
4. **Update Ground Truth**: Add more test questions
5. **Monitor Trends**: Run evaluation regularly

## 📞 Quick Help

**Q: What's a good similarity score?**  
A: Aim for >0.7 average. Above 0.6 is acceptable.

**Q: How often should I run evaluation?**  
A: After any major changes to the vector store or retrieval logic.

**Q: Can I add my own test questions?**  
A: Yes! Edit `tests/test_data/ground_truth_qa.json`

**Q: What if all scores are low?**  
A: Check if vector store is properly loaded and contains relevant pediatric data.

---

**Need detailed docs?** See `tests/README.md`  
**Last Updated**: 2025-11-24
