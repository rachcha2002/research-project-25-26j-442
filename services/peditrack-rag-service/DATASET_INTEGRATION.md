# Dataset Integration Guide for RAG System

## Overview

This guide explains how to integrate various pediatric health datasets into your RAG (Retrieval-Augmented Generation) system.

## Supported Dataset Formats

The RAG system can ingest data from:
1. **JSON files** (recommended)
2. **CSV files**
3. **Text files**
4. **PDF documents** (requires additional setup)
5. **API endpoints**

## Method 1: JSON Files (Easiest)

### Step 1: Prepare Your JSON Data

Create a JSON file with the following structure:

```json
[
  {
    "text": "Your pediatric health content here...",
    "source": "Source name (e.g., CDC, AAP, WHO)",
    "metadata": {
      "category": "symptoms|vaccinations|development|nutrition|etc",
      "age_group": "infant|toddler|preschool|all",
      "urgency": "low|moderate|high|critical",
      "language": "en",
      "date_published": "2024-01-01"
    }
  }
]
```

### Step 2: Save to Data Directory

Save your JSON file to:
```
services/peditrack-rag-service/data/your_dataset.json
```

### Step 3: Ingest via Script

Run the ingestion script:

```bash
cd services/peditrack-rag-service
python scripts/ingest_dataset.py --file data/your_dataset.json
```

## Method 2: Via API (For Dynamic Updates)

### Ingest Documents via REST API

```bash
curl -X POST http://localhost:3002/api/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "text": "Fever in children...",
        "source": "CDC Guidelines",
        "metadata": {"category": "symptoms"}
      }
    ]
  }'
```

### Python Script Example

```python
import requests
import json

# Load your dataset
with open('your_data.json', 'r') as f:
    documents = json.load(f)

# Send to RAG service
response = requests.post(
    'http://localhost:3002/api/rag/ingest',
    json={'documents': documents}
)

print(f"Ingested {response.json()['documents_added']} documents")
```

## Method 3: CSV Files

### Step 1: Create CSV Converter Script

Create `services/peditrack-rag-service/scripts/convert_csv.py`:

```python
import csv
import json
import sys

def csv_to_json(csv_file, output_file):
    documents = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            doc = {
                "text": row['text'],
                "source": row.get('source', 'Unknown'),
                "metadata": {
                    "category": row.get('category', ''),
                    "age_group": row.get('age_group', 'all')
                }
            }
            documents.append(doc)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(documents, f, indent=2)
    
    print(f"Converted {len(documents)} documents")

if __name__ == "__main__":
    csv_to_json(sys.argv[1], sys.argv[2])
```

### Step 2: Convert and Ingest

```bash
python scripts/convert_csv.py data/your_data.csv data/your_data.json
python scripts/ingest_dataset.py --file data/your_data.json
```

## Method 4: Large Datasets with Chunking

For large documents (e.g., medical textbooks, guidelines), use chunking:

### Create Chunking Script

Create `services/peditrack-rag-service/scripts/ingest_large_docs.py`:

```python
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.ingestion_service import get_ingestion_service
from models.schemas import Document

def chunk_text(text, chunk_size=500, overlap=50):
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks

def ingest_large_document(file_path, source_name, metadata=None):
    """Ingest a large document with chunking"""
    
    # Read the document
    with open(file_path, 'r', encoding='utf-8') as f:
        full_text = f.read()
    
    # Chunk the text
    chunks = chunk_text(full_text, chunk_size=500, overlap=50)
    
    # Create Document objects
    documents = []
    for i, chunk in enumerate(chunks):
        doc = Document(
            text=chunk,
            source=f"{source_name} (Part {i+1}/{len(chunks)})",
            metadata=metadata or {},
            doc_id=f"{source_name}_{i}"
        )
        documents.append(doc)
    
    # Ingest
    ingestion_service = get_ingestion_service()
    count = ingestion_service.ingest_documents(documents)
    print(f"Ingested {count} chunks from {source_name}")

if __name__ == "__main__":
    ingest_large_document(
        sys.argv[1],
        sys.argv[2],
        {"category": "guidelines", "age_group": "all"}
    )
```

### Usage

```bash
python scripts/ingest_large_docs.py data/pediatric_guidelines.txt "AAP Guidelines 2024"
```

## Method 5: Web Scraping (For Online Resources)

### Create Web Scraper

Create `services/peditrack-rag-service/scripts/scrape_web_content.py`:

```python
import requests
from bs4 import BeautifulSoup
import json

def scrape_webpage(url, source_name):
    """Scrape content from a webpage"""
    
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Extract text (adjust selectors based on website structure)
    paragraphs = soup.find_all('p')
    text = ' '.join([p.get_text() for p in paragraphs])
    
    document = {
        "text": text,
        "source": source_name,
        "metadata": {
            "url": url,
            "scraped_date": "2024-11-22"
        }
    }
    
    return document

# Example usage
if __name__ == "__main__":
    doc = scrape_webpage(
        "https://www.cdc.gov/vaccines/schedules/hcp/imz/child-adolescent.html",
        "CDC Vaccination Schedule"
    )
    
    # Save to JSON
    with open('data/scraped_content.json', 'w') as f:
        json.dump([doc], f, indent=2)
```

## Recommended Datasets for Pediatric Health

### 1. MedDialog Dataset
- **Source**: https://github.com/UCSD-AI4H/Medical-Dialogue-System
- **Content**: Medical dialogues and Q&A
- **Format**: JSON
- **Integration**: Download, filter for pediatric content, convert to RAG format

### 2. OpenWHO Courses
- **Source**: https://openwho.org/
- **Content**: WHO health education materials
- **Format**: Text/PDF
- **Integration**: Extract text, chunk, and ingest

### 3. CDC Guidelines
- **Source**: https://www.cdc.gov/
- **Content**: Vaccination schedules, disease information
- **Format**: Web pages
- **Integration**: Web scraping or manual extraction

### 4. AAP (American Academy of Pediatrics)
- **Source**: https://www.aap.org/
- **Content**: Clinical guidelines, parent resources
- **Format**: PDF/Web
- **Integration**: PDF extraction or web scraping

### 5. PubMed Articles
- **Source**: https://pubmed.ncbi.nlm.nih.gov/
- **Content**: Medical research papers
- **Format**: XML/JSON via API
- **Integration**: Use PubMed API to fetch pediatric articles

## Example: Ingesting MedDialog Dataset

### Step 1: Download Dataset

```bash
git clone https://github.com/UCSD-AI4H/Medical-Dialogue-System
```

### Step 2: Convert to RAG Format

```python
import json

# Load MedDialog data
with open('Medical-Dialogue-System/data/train.json', 'r') as f:
    meddialog = json.load(f)

# Convert to RAG format
documents = []
for dialogue in meddialog:
    # Filter for pediatric content
    if 'child' in dialogue['description'].lower() or 'pediatric' in dialogue['description'].lower():
        doc = {
            "text": f"Q: {dialogue['utterances'][0]}\nA: {dialogue['utterances'][1]}",
            "source": "MedDialog Dataset",
            "metadata": {
                "category": "dialogue",
                "dataset": "meddialog"
            }
        }
        documents.append(doc)

# Save
with open('data/meddialog_pediatric.json', 'w') as f:
    json.dump(documents, f, indent=2)
```

### Step 3: Ingest

```bash
python scripts/ingest_dataset.py --file data/meddialog_pediatric.json
```

## Monitoring and Verification

### Check Ingestion Status

```bash
curl http://localhost:3002/api/rag/stats
```

### Test Retrieval

```bash
curl -X POST http://localhost:3002/api/rag/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "What are fever symptoms?", "top_k": 3}'
```

### View Logs

```bash
tail -f services/peditrack-rag-service/logs/rag_service.log
```

## Best Practices

1. **Data Quality**:
   - Use trusted medical sources only
   - Verify accuracy before ingestion
   - Include source attribution

2. **Chunking**:
   - Keep chunks 300-500 characters for optimal retrieval
   - Use 50-100 character overlap to maintain context

3. **Metadata**:
   - Always include category, age_group, and source
   - Add urgency levels for medical content
   - Include publication dates

4. **Incremental Updates**:
   - Don't clear the index when adding new data
   - Use the `/ingest` endpoint for additions
   - Periodically rebuild index for optimization

5. **Testing**:
   - Test retrieval after each ingestion
   - Verify similarity scores are reasonable (>0.5 for relevant docs)
   - Check for duplicate content

## Troubleshooting

**Issue**: Documents not being retrieved
- **Solution**: Lower similarity threshold or check if documents were actually ingested

**Issue**: Out of memory during ingestion
- **Solution**: Process in smaller batches (100-500 documents at a time)

**Issue**: Poor retrieval quality
- **Solution**: Improve document chunking, add more metadata, or use better source documents

## Next Steps

1. Identify your data sources
2. Convert to JSON format
3. Ingest using one of the methods above
4. Test retrieval quality
5. Iterate and refine

For questions or issues, check the logs at `services/peditrack-rag-service/logs/`
