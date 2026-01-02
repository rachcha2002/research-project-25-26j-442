# Pediatric-Specific Datasets Guide

## 🎯 Overview

These datasets are specifically chosen for **pediatric triage, symptom checking, and parent guidance** - perfect for your PediTrack voice-based health assistant!

---

## 📊 Datasets to Integrate

### **1. Disease-Symptom Dataset** ⭐
- **Source**: Kaggle - `niyarrbarman/symptom2disease`
- **Content**: 
  - 773 unique diseases
  - 377 symptoms
  - Symptom severity levels
- **Size**: ~246,000 rows
- **Format**: CSV
- **Use Cases**:
  - Symptom-to-disease mapping
  - Triage decision support
  - "What could this be?" queries
- **Example**: "Child has fever + cough + fatigue" → Possible conditions

---

### **2. AI Symptom Checker Dataset** ⭐
- **Source**: Kaggle - `itachi9604/disease-symptom-description-dataset`
- **Content**:
  - Disease descriptions
  - Precautions and care advice
  - Urgency indicators (Mild/Severe)
- **Format**: CSV
- **Use Cases**:
  - Home care vs. emergency decisions
  - Treatment precautions
  - Parent education
- **Example**: "When should I take my child to ER for fever?"

---

### **3. Medical QA Dataset (MedQuAD)**
- **Source**: Kaggle - `thedevastator/comprehensive-medical-q-a-dataset`
- **Content**:
  - 43,000+ medical Q&A pairs
  - From NIH trusted sources
  - 31 question categories
- **Format**: CSV
- **Use Cases**:
  - Direct parent questions
  - Medical information lookup
  - Vaccination guidance
- **Pediatric Filtering**: Applied to extract child-related Q&A

---

### **4. HealthSearchQA**
- **Source**: HuggingFace - `bigbio/health_fact`
- **Content**:
  - 3,173 consumer health questions
  - Common search queries
  - Fact-checked answers
- **Format**: JSON
- **Use Cases**:
  - Common parent concerns
  - Quick health facts
  - Voice query matching
- **Example**: "How do you know if your baby has reflux?"

---

## 🎯 Why These Datasets Are Perfect for PediTrack

### **1. Symptom-Based Triage** ✅
```
Parent: "My child has fever and rash"
System: 
  1. Maps symptoms to possible conditions
  2. Checks severity levels
  3. Recommends: home care vs. doctor visit vs. ER
```

### **2. Voice-Friendly Q&A** ✅
```
Parent: "When should I worry about a cough?"
System: Retrieves relevant Q&A from medical databases
```

### **3. Urgency Assessment** ✅
```
Symptoms → Severity Level → Action Recommendation
- Mild: Home care advice
- Moderate: Schedule doctor visit
- Severe: Seek immediate care
```

### **4. Parent Education** ✅
```
Topics covered:
- Vaccination schedules
- Developmental milestones
- Nutrition guidance
- Injury prevention
```

---

## 📥 How to Download & Integrate

### **Quick Start (One Command)**
```bash
cd d:\research-project-25-26j-442\services\peditrack-rag-service
integrate_pediatric_datasets.bat
```

### **Manual Steps**

#### **Step 1: Setup Kaggle API**
1. Create account at [Kaggle.com](https://www.kaggle.com)
2. Go to Account Settings → API
3. Click "Create New API Token"
4. Save `kaggle.json` to: `C:\Users\<YourUsername>\.kaggle\`

#### **Step 2: Download Datasets**
```bash
python scripts\download_pediatric_datasets.py
```

#### **Step 3: Preprocess**
```bash
python scripts\preprocess_pediatric_datasets.py
```

#### **Step 4: Ingest**
```bash
python scripts\ingest_full_datasets.py
```

---

## 📊 Expected Results

### **Dataset Sizes (Estimated)**
- Disease-Symptom: ~5,000-10,000 documents
- Symptom Checker: ~1,000-2,000 documents
- Medical QA (Pediatric): ~5,000-8,000 documents
- HealthSearchQA (Pediatric): ~500-1,000 documents

### **Total Addition**: ~12,000-21,000 new documents

### **Combined with Existing**
- Current: 24,855 documents
- After integration: ~37,000-46,000 documents

---

## 🎯 Use Cases in PediTrack

### **1. Symptom Checker**
```
Voice Input: "My 3-year-old has a fever of 102 and won't eat"
RAG Retrieves:
  - Fever management guidelines
  - Loss of appetite in toddlers
  - When to seek medical care
  - Home remedies
```

### **2. Triage Assistant**
```
Voice Input: "Should I take my baby to the ER?"
RAG Retrieves:
  - Emergency warning signs
  - Urgency assessment criteria
  - When to call 911
  - Alternative care options
```

### **3. Parent Q&A**
```
Voice Input: "What vaccines does my 6-month-old need?"
RAG Retrieves:
  - Vaccination schedule
  - Vaccine descriptions
  - Side effects
  - Importance of vaccines
```

### **4. Development Tracking**
```
Voice Input: "Is it normal for my 18-month-old to not talk yet?"
RAG Retrieves:
  - Speech milestones
  - Normal variation ranges
  - When to consult specialist
  - Stimulation activities
```

---

## 🔧 Configuration

### **Pediatric Filtering**
The preprocessing script automatically filters for pediatric content using keywords:
- child, children, pediatric, infant, baby, toddler
- newborn, adolescent, teenager, kid
- vaccination, growth, development, milestone
- breastfeeding, formula, diaper

### **Urgency Levels**
Datasets include severity/urgency indicators:
- **Mild**: Home care, monitor
- **Moderate**: Schedule doctor visit
- **Severe**: Seek immediate medical attention
- **Emergency**: Call 911 / Go to ER

---

## 📝 Data Quality

### **Advantages**
✅ **Verified Sources**: From medical databases and NIH
✅ **Structured Data**: CSV format with clear fields
✅ **Symptom Mappings**: Direct symptom-to-disease relationships
✅ **Urgency Levels**: Built-in severity indicators
✅ **Parent-Friendly**: Written for consumer understanding

### **Limitations**
⚠️ **Not Pediatric-Exclusive**: Requires filtering
⚠️ **General Guidance**: Not personalized medical advice
⚠️ **Requires Validation**: Should be reviewed by medical professionals

---

## 🚀 Next Steps After Integration

### **1. Test Symptom Queries**
```bash
curl -X POST http://localhost:3002/api/rag/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "fever and rash in toddler", "top_k": 5}'
```

### **2. Test Urgency Assessment**
```bash
curl -X POST http://localhost:3002/api/rag/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "when to go to ER for child fever", "top_k": 3}'
```

### **3. Integrate with Chat Service**
Update your chat service to:
- Send symptom queries to RAG
- Parse urgency levels from responses
- Provide actionable recommendations

---

## 📚 Additional Resources

### **Manual Download Links**
1. **Disease-Symptom**: https://www.kaggle.com/datasets/niyarrbarman/symptom2disease
2. **Symptom Checker**: https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset
3. **Medical QA**: https://www.kaggle.com/datasets/thedevastator/comprehensive-medical-q-a-dataset

### **Documentation**
- Kaggle API Docs: https://www.kaggle.com/docs/api
- HuggingFace Datasets: https://huggingface.co/docs/datasets

---

## ✅ Summary

These pediatric-specific datasets will transform your PediTrack RAG service into a powerful **symptom checker and triage assistant** that can:

✅ Map symptoms to possible conditions
✅ Assess urgency levels
✅ Recommend appropriate care (home/doctor/ER)
✅ Answer common parent questions
✅ Provide evidence-based guidance

**Perfect for voice-based pediatric health assistance!**

---

*Created: 2025-11-24*
*For: PediTrack RAG Service*
