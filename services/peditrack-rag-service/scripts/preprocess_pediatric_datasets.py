"""
Preprocess Pediatric-Specific Datasets
Processes symptom-disease mappings and pediatric QA data
"""
import json
import csv
from pathlib import Path
from tqdm import tqdm

print("=" * 70)
print("PREPROCESSING PEDIATRIC-SPECIFIC DATASETS")
print("=" * 70)
print()

def preprocess_disease_symptoms():
    """Preprocess Disease-Symptom dataset"""
    print("📝 PREPROCESSING: Disease-Symptom Dataset")
    print("-" * 70)
    
    input_dir = Path("data/raw_datasets/disease_symptoms")
    
    # Look for CSV files
    csv_files = list(input_dir.glob("*.csv"))
    
    if not csv_files:
        print(f"✗ No CSV files found in {input_dir}")
        print()
        return []
    
    processed_docs = []
    
    for csv_file in csv_files:
        print(f"Processing {csv_file.name}...")
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in tqdm(list(reader), desc="  Processing"):
                    disease = row.get('Disease', row.get('disease', ''))
                    
                    # Collect all symptoms
                    symptoms = []
                    for key, value in row.items():
                        if 'symptom' in key.lower() and value and value.strip():
                            symptoms.append(value.strip())
                    
                    if disease and symptoms:
                        # Create document
                        symptoms_text = ", ".join(symptoms)
                        text = f"Disease: {disease}\n\nSymptoms: {symptoms_text}\n\nThis condition may present with the following symptoms: {symptoms_text}. If a child shows these symptoms, medical evaluation may be needed."
                        
                        doc = {
                            'text': text,
                            'source': 'Disease-Symptom Database',
                            'metadata': {
                                'disease': disease,
                                'symptoms': symptoms,
                                'dataset': 'DiseaseSymptoms',
                                'type': 'symptom_mapping'
                            }
                        }
                        processed_docs.append(doc)
        
        except Exception as e:
            print(f"  Error processing {csv_file.name}: {e}")
    
    print(f"✓ Processed {len(processed_docs)} disease-symptom mappings")
    print()
    return processed_docs

def preprocess_symptom_checker():
    """Preprocess AI Symptom Checker dataset"""
    print("📝 PREPROCESSING: AI Symptom Checker")
    print("-" * 70)
    
    input_dir = Path("data/raw_datasets/symptom_checker")
    
    csv_files = list(input_dir.glob("*.csv"))
    
    if not csv_files:
        print(f"✗ No CSV files found in {input_dir}")
        print()
        return []
    
    processed_docs = []
    
    for csv_file in csv_files:
        print(f"Processing {csv_file.name}...")
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in tqdm(list(reader), desc="  Processing"):
                    disease = row.get('Disease', row.get('disease', ''))
                    description = row.get('Description', row.get('description', ''))
                    precaution = row.get('Precaution', row.get('precaution', ''))
                    
                    if disease:
                        # Create comprehensive text
                        text_parts = [f"Condition: {disease}"]
                        
                        if description:
                            text_parts.append(f"\nDescription: {description}")
                        
                        if precaution:
                            text_parts.append(f"\nPrecautions: {precaution}")
                        
                        text = "\n".join(text_parts)
                        
                        doc = {
                            'text': text,
                            'source': 'AI Symptom Checker Database',
                            'metadata': {
                                'disease': disease,
                                'has_description': bool(description),
                                'has_precaution': bool(precaution),
                                'dataset': 'SymptomChecker',
                                'type': 'disease_info'
                            }
                        }
                        processed_docs.append(doc)
        
        except Exception as e:
            print(f"  Error processing {csv_file.name}: {e}")
    
    print(f"✓ Processed {len(processed_docs)} symptom checker entries")
    print()
    return processed_docs

def preprocess_medical_qa():
    """Preprocess Medical QA dataset"""
    print("📝 PREPROCESSING: Medical QA Dataset")
    print("-" * 70)
    
    input_dir = Path("data/raw_datasets/medical_qa")
    
    # Look for CSV or JSON files
    data_files = list(input_dir.glob("*.csv")) + list(input_dir.glob("*.json"))
    
    if not data_files:
        print(f"✗ No data files found in {input_dir}")
        print()
        return []
    
    processed_docs = []
    pediatric_keywords = [
        'child', 'children', 'pediatric', 'infant', 'baby', 'toddler',
        'newborn', 'adolescent', 'teenager', 'kid', 'vaccination',
        'growth', 'development', 'milestone', 'breastfeeding'
    ]
    
    for data_file in data_files:
        print(f"Processing {data_file.name}...")
        
        try:
            if data_file.suffix == '.csv':
                with open(data_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    data = list(reader)
            else:  # JSON
                with open(data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            
            for item in tqdm(data, desc="  Processing"):
                question = item.get('question', item.get('Question', ''))
                answer = item.get('answer', item.get('Answer', ''))
                
                if not question or not answer:
                    continue
                
                # Filter for pediatric content
                combined_text = (question + " " + answer).lower()
                if not any(kw in combined_text for kw in pediatric_keywords):
                    continue
                
                text = f"Question: {question}\n\nAnswer: {answer}"
                
                doc = {
                    'text': text,
                    'source': 'Medical QA Database',
                    'metadata': {
                        'question': question,
                        'dataset': 'MedicalQA',
                        'type': 'qa_pair',
                        'pediatric_filtered': True
                    }
                }
                processed_docs.append(doc)
        
        except Exception as e:
            print(f"  Error processing {data_file.name}: {e}")
    
    print(f"✓ Processed {len(processed_docs)} pediatric Q&A pairs")
    print()
    return processed_docs

def preprocess_healthsearchqa():
    """Preprocess HealthSearchQA dataset"""
    print("📝 PREPROCESSING: HealthSearchQA")
    print("-" * 70)
    
    input_file = Path("data/raw_datasets/healthsearchqa/health_qa.json")
    
    if not input_file.exists():
        print(f"✗ File not found: {input_file}")
        print()
        return []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    processed_docs = []
    pediatric_keywords = [
        'child', 'children', 'pediatric', 'infant', 'baby', 'toddler',
        'newborn', 'adolescent', 'teenager', 'kid', 'vaccination',
        'growth', 'development', 'milestone', 'breastfeeding'
    ]
    
    for item in tqdm(data, desc="  Processing"):
        question = item.get('question', '')
        answer = item.get('answer', '')
        
        if not question or not answer:
            continue
        
        # Filter for pediatric content
        combined_text = (question + " " + answer).lower()
        if not any(kw in combined_text for kw in pediatric_keywords):
            continue
        
        text = f"Health Question: {question}\n\nAnswer: {answer}"
        
        doc = {
            'text': text,
            'source': 'HealthSearchQA',
            'metadata': {
                'question': question,
                'label': item.get('label', ''),
                'dataset': 'HealthSearchQA',
                'type': 'health_fact',
                'pediatric_filtered': True
            }
        }
        processed_docs.append(doc)
    
    print(f"✓ Processed {len(processed_docs)} health Q&A pairs")
    print()
    return processed_docs

def save_processed_data(documents, dataset_name):
    """Save processed documents to JSON"""
    if not documents:
        print(f"⚠ No documents to save for {dataset_name}")
        return
    
    output_dir = Path("data/processed")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = output_dir / f"{dataset_name}_processed.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(documents, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved to: {output_file}")

def main():
    print("Processing pediatric-specific datasets...")
    print()
    
    all_docs = []
    
    # Process each dataset
    docs = preprocess_disease_symptoms()
    if docs:
        save_processed_data(docs, 'disease_symptoms')
        all_docs.extend(docs)
    
    docs = preprocess_symptom_checker()
    if docs:
        save_processed_data(docs, 'symptom_checker')
        all_docs.extend(docs)
    
    docs = preprocess_medical_qa()
    if docs:
        save_processed_data(docs, 'medical_qa_pediatric')
        all_docs.extend(docs)
    
    docs = preprocess_healthsearchqa()
    if docs:
        save_processed_data(docs, 'healthsearchqa_pediatric')
        all_docs.extend(docs)
    
    # Save combined dataset
    if all_docs:
        save_processed_data(all_docs, 'pediatric_combined')
    
    # Summary
    print()
    print("=" * 70)
    print("PREPROCESSING SUMMARY")
    print("=" * 70)
    print(f"Total documents processed: {len(all_docs)}")
    print()
    print("✓ Preprocessing complete!")
    print()
    print("Next step:")
    print("  python scripts\\ingest_full_datasets.py")
    print()

if __name__ == "__main__":
    main()
