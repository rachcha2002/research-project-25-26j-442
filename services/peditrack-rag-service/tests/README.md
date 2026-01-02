# RAG System Accuracy Validation

This directory contains tools for evaluating the accuracy and performance of the PediTrack RAG (Retrieval-Augmented Generation) system.

## 📊 Overview

The RAG evaluation system measures:
- **Retrieval Accuracy**: How well the system retrieves relevant documents
- **Semantic Similarity**: How closely retrieved content matches expected answers
- **Category Performance**: Performance across different medical topics
- **Difficulty Analysis**: Performance on easy, medium, and hard questions
- **Response Quality**: Distribution of high, medium, and low quality responses

## 🗂️ Directory Structure

```
tests/
├── __init__.py
├── rag_evaluator.py              # Core evaluation module
├── test_data/
│   └── ground_truth_qa.json      # 20 ground truth Q&A pairs
└── evaluation_results/           # Generated evaluation results
    ├── latest_evaluation.json    # Latest detailed results
    ├── latest_report.txt          # Latest summary report
    └── visualizations/            # Generated charts and plots
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Activate virtual environment
venv\Scripts\activate

# Install required packages
pip install -r requirements.txt
```

### 2. Run Evaluation

**Option A: Using Batch Script (Recommended)**
```bash
evaluate_rag.bat
```

**Option B: Using Python Directly**
```bash
python scripts\evaluate_rag.py --top-k 5
```

### 3. Generate Visualizations

**Option A: Using Batch Script (Recommended)**
```bash
visualize_evaluation.bat
```

**Option B: Using Python Directly**
```bash
python scripts\visualize_evaluation.py
```

## 📈 Evaluation Metrics

### 1. Retrieval Metrics
- **Query Success Rate**: Percentage of queries that retrieved results
- **Average Retrieval Time**: Time taken to retrieve documents (in milliseconds)
- **Keyword Match Rate**: Percentage of queries where expected keywords were found
- **Average Similarity Score**: Average cosine similarity of retrieved documents

### 2. Semantic Similarity Metrics
- **Average Similarity**: Mean semantic similarity between retrieved context and expected answers
- **Quality Distribution**:
  - High Quality (>0.7): Excellent match
  - Medium Quality (0.5-0.7): Adequate match
  - Low Quality (<0.5): Poor match

### 3. Category Performance
Performance breakdown by medical category:
- Fever
- Vaccination
- Skin Conditions
- Dehydration
- Development
- Respiratory
- Ear Infection
- Nutrition
- Digestive
- Infectious Disease
- Dental
- Safety
- Vital Signs
- First Aid

### 4. Difficulty Performance
Performance breakdown by question difficulty:
- Easy: Basic pediatric health questions
- Medium: Moderate complexity questions
- Hard: Complex medical scenarios

## 📊 Generated Visualizations

The visualization script creates the following plots:

1. **evaluation_dashboard.png**: Comprehensive overview dashboard
2. **similarity_distribution.png**: Distribution of similarity scores
3. **category_performance.png**: Performance by medical category
4. **difficulty_performance.png**: Performance by difficulty level
5. **quality_breakdown.png**: Pie chart of response quality
6. **retrieval_performance.png**: Retrieval metrics overview
7. **top_bottom_queries.png**: Best and worst performing queries

## 📝 Ground Truth Dataset

The evaluation uses 20 carefully curated pediatric health questions covering:
- Common symptoms and conditions
- Vaccination schedules
- Developmental milestones
- Emergency situations
- Nutrition and feeding
- Safety guidelines

Each question includes:
- **Question**: The query to test
- **Expected Answer**: The ideal response
- **Category**: Medical topic category
- **Difficulty**: Easy, medium, or hard
- **Keywords**: Key terms that should appear in results

## 🔧 Advanced Usage

### Custom Top-K Value

Retrieve more or fewer documents:
```bash
python scripts\evaluate_rag.py --top-k 10
```

### Custom Ground Truth Dataset

Use your own Q&A dataset:
```bash
python scripts\evaluate_rag.py --ground-truth path/to/your/qa.json
```

### Custom Output Directory

Save results to a different location:
```bash
python scripts\evaluate_rag.py --output-dir path/to/output
```

### Visualize Specific Results

Visualize a specific evaluation run:
```bash
python scripts\visualize_evaluation.py --results tests/evaluation_results/evaluation_results_2025-11-24_16-30-00.json
```

## 📖 Understanding Results

### Interpreting Similarity Scores

- **0.9 - 1.0**: Excellent - Nearly perfect match
- **0.7 - 0.9**: Good - Strong semantic similarity
- **0.5 - 0.7**: Fair - Moderate similarity
- **0.3 - 0.5**: Poor - Weak similarity
- **0.0 - 0.3**: Very Poor - Little to no similarity

### Overall Assessment Criteria

The system provides an overall assessment based on average similarity:
- **≥ 0.7**: EXCELLENT - RAG system performing very well
- **≥ 0.6**: GOOD - RAG system performing adequately
- **≥ 0.5**: FAIR - RAG system needs improvement
- **< 0.5**: POOR - RAG system requires significant improvement

## 🔍 Sample Output

```
================================================================================
RAG SYSTEM EVALUATION REPORT
================================================================================
Timestamp: 2025-11-24 16:07:48
Total Queries Tested: 20
Top-K Documents: 5
Total Evaluation Time: 45.23s

RETRIEVAL PERFORMANCE
--------------------------------------------------------------------------------
Queries with Results: 20/20 (100.0%)
Average Retrieval Time: 125.45ms
Keyword Match Rate: 85.0%
Average Similarity Score: 0.742

SEMANTIC SIMILARITY ANALYSIS
--------------------------------------------------------------------------------
Average Similarity: 0.685
High Quality (>0.7): 12 (60.0%)
Medium Quality (0.5-0.7): 6 (30.0%)
Low Quality (<0.5): 2 (10.0%)

PERFORMANCE BY CATEGORY
--------------------------------------------------------------------------------
FEVER: Avg Similarity=0.720, Success Rate=100.0%
VACCINATION: Avg Similarity=0.680, Success Rate=100.0%
DEVELOPMENT: Avg Similarity=0.695, Success Rate=100.0%
...

PERFORMANCE BY DIFFICULTY
--------------------------------------------------------------------------------
EASY: Avg Similarity=0.745, Success Rate=100.0%
MEDIUM: Avg Similarity=0.670, Success Rate=100.0%
HARD: Avg Similarity=0.625, Success Rate=100.0%

OVERALL ASSESSMENT
--------------------------------------------------------------------------------
GOOD - RAG system is performing adequately
================================================================================
```

## 🛠️ Adding More Test Cases

To add more ground truth questions, edit `tests/test_data/ground_truth_qa.json`:

```json
{
  "id": "q21",
  "question": "Your question here",
  "expected_answer": "The ideal answer",
  "category": "category_name",
  "difficulty": "easy|medium|hard",
  "keywords": ["keyword1", "keyword2"]
}
```

## 📚 API Reference

### RAGEvaluator Class

```python
from tests.rag_evaluator import RAGEvaluator

# Initialize evaluator
evaluator = RAGEvaluator(ground_truth_path="tests/test_data/ground_truth_qa.json")

# Run full evaluation
results = evaluator.run_full_evaluation(top_k=5)

# Generate report
report = evaluator.generate_summary_report(results)
print(report)
```

### Individual Evaluation Methods

```python
# Evaluate retrieval only
retrieval_results = evaluator.evaluate_retrieval(top_k=5)

# Evaluate semantic similarity only
similarity_results = evaluator.evaluate_semantic_similarity(top_k=5)

# Evaluate by category
category_results = evaluator.evaluate_by_category(top_k=5)

# Evaluate by difficulty
difficulty_results = evaluator.evaluate_by_difficulty(top_k=5)
```

## 🔄 Continuous Evaluation

For continuous monitoring, you can:

1. **Schedule Regular Evaluations**: Run evaluation daily/weekly
2. **Track Performance Over Time**: Compare results across different dates
3. **Monitor After Updates**: Re-evaluate after adding new datasets
4. **A/B Testing**: Compare different retrieval parameters

## 🐛 Troubleshooting

### Issue: "No module named 'tests'"
**Solution**: Make sure you're running from the RAG service root directory

### Issue: "Ground truth file not found"
**Solution**: Ensure `tests/test_data/ground_truth_qa.json` exists

### Issue: "Vector store not loaded"
**Solution**: Make sure the RAG service has been initialized with `init.bat`

### Issue: Low similarity scores
**Possible causes**:
- Vector store needs more relevant documents
- Embedding model mismatch
- Ground truth questions too specific
- Need to adjust retrieval parameters

## 📞 Support

For issues or questions about RAG evaluation:
1. Check the logs in `logs/` directory
2. Review the detailed JSON results
3. Examine individual query performance in the results

## 🎯 Next Steps

After running evaluation:

1. **Review Results**: Check the summary report and visualizations
2. **Identify Weak Areas**: Look at low-performing categories
3. **Improve Dataset**: Add more documents for weak categories
4. **Adjust Parameters**: Tune `top_k` and `similarity_threshold`
5. **Re-evaluate**: Run evaluation again after improvements
6. **Monitor Trends**: Track performance over time

---

**Last Updated**: 2025-11-24  
**Version**: 1.0.0  
**Status**: Ready for Production ✅
