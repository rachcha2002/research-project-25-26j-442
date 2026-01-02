# Health Analytics Service - API Documentation

Base URL: `http://localhost:5001`

All endpoints return JSON responses.

---

## 📋 Table of Contents

- [Baby Management](#baby-management)
- [Measurements](#measurements)
- [Health Records](#health-records)
- [Medications](#medications)
- [AI Insights](#ai-insights)
- [Error Responses](#error-responses)

---

## 👶 Baby Management

### Create Baby Profile

**POST** `/api/babies`

Create a new baby profile.

**Request Body:**
```json
{
  "accountId": "user123",
  "userId": "user123",
  "name": "Emma Johnson",
  "dateOfBirth": "2021-06-15",
  "gender": "female",
  "parentName": "Sarah Johnson",
  "parentEmail": "sarah@example.com",
  "parentPhone": "+1234567890",
  "bloodType": "O+",
  "allergies": ["peanuts", "dairy"]
}
```

**Response:** `201 Created`
```json
{
  "_id": "654321...",
  "accountId": "user123",
  "name": "Emma Johnson",
  "dateOfBirth": "2021-06-15T00:00:00.000Z",
  "gender": "female",
  "age": 41,
  "createdAt": "2024-11-25T...",
  ...
}
```

### Get All Babies

**GET** `/api/babies?accountId=user123`

Query Parameters:
- `accountId` (optional): Filter by account
- `userId` (optional): Filter by user

**Response:** `200 OK`
```json
[
  {
    "_id": "654321...",
    "name": "Emma Johnson",
    "age": 41,
    ...
  }
]
```

### Get Baby by ID

**GET** `/api/babies/:id`

**Response:** `200 OK`

### Update Baby

**PUT** `/api/babies/:id`

**Request Body:** Same as create (partial updates allowed)

### Delete Baby

**DELETE** `/api/babies/:id`

Soft deletes the baby profile (sets `isActive: false`).

---

## 📏 Measurements

### Add Measurement

**POST** `/api/measurements`

**Request Body:**
```json
{
  "babyId": "654321...",
  "measurementDate": "2024-11-25",
  "height": {
    "value": 95.5,
    "unit": "cm"
  },
  "weight": {
    "value": 14.2,
    "unit": "kg"
  },
  "headCircumference": {
    "value": 48.0,
    "unit": "cm"
  },
  "location": "Home",
  "notes": "Regular monthly measurement",
  "entryMode": "manual"
}
```

**Response:** `201 Created`
```json
{
  "_id": "765432...",
  "babyId": "654321...",
  "measurementDate": "2024-11-25T00:00:00.000Z",
  "height": { "value": 95.5, "unit": "cm" },
  "weight": { "value": 14.2, "unit": "kg" },
  "bmi": 15.6,
  "createdAt": "2024-11-25T...",
  ...
}
```

### Get All Measurements for Baby

**GET** `/api/measurements/baby/:babyId`

Returns measurements sorted by date (newest first).

### Get Latest Measurement

**GET** `/api/measurements/baby/:babyId/latest`

Returns the most recent measurement.

### Get Growth Analytics

**GET** `/api/measurements/baby/:babyId/analytics`

Returns comprehensive growth analytics including predictions.

**Response:** `200 OK`
```json
{
  "latest": { ... },
  "velocity": {
    "height": {
      "velocity": 0.8,
      "trend": "increasing",
      "timeDiff": 1
    },
    "weight": {
      "velocity": 0.3,
      "trend": "increasing",
      "timeDiff": 1
    }
  },
  "predictions": {
    "3months": {
      "timeframe": "3 months",
      "confidence": 78,
      "metrics": {
        "height": {
          "predicted": 98.0,
          "current": 95.5,
          "change": 2.5,
          "unit": "cm"
        },
        "weight": {
          "predicted": 14.8,
          "current": 14.2,
          "change": 0.6,
          "unit": "kg"
        }
      },
      "influenceFactors": [...]
    },
    "6months": { ... },
    "12months": { ... }
  },
  "totalMeasurements": 12
}
```

### Update Measurement

**PUT** `/api/measurements/:id`

### Delete Measurement

**DELETE** `/api/measurements/:id`

---

## 🏥 Health Records

### Add Health Record

**POST** `/api/health-records`

**Request Body:**
```json
{
  "babyId": "654321...",
  "recordDate": "2024-11-20",
  "recordType": "illness",
  "temperature": {
    "value": 38.5,
    "unit": "C"
  },
  "symptoms": ["fever", "cough"],
  "diagnosis": "Common cold",
  "severity": "mild",
  "doctorName": "Dr. Smith",
  "clinicName": "City Pediatric Clinic",
  "doctorNotes": "Rest and fluids recommended",
  "notes": "Started showing symptoms on Nov 18"
}
```

**Response:** `201 Created`

### Get Health Records

**GET** `/api/health-records/baby/:babyId?recordType=illness`

Query Parameters:
- `recordType` (optional): Filter by type (checkup, illness, vaccination, emergency, other)

### Update Health Record

**PUT** `/api/health-records/:id`

### Delete Health Record

**DELETE** `/api/health-records/:id`

---

## 💊 Medications

### Add Medication

**POST** `/api/medications`

**Request Body:**
```json
{
  "babyId": "654321...",
  "name": "Amoxicillin",
  "dosage": {
    "amount": 250,
    "unit": "mg"
  },
  "frequency": "3 times daily",
  "route": "oral",
  "startDate": "2024-11-20",
  "endDate": "2024-11-27",
  "prescribedBy": {
    "doctorName": "Dr. Smith",
    "clinicName": "City Pediatric Clinic"
  },
  "purpose": "Ear infection treatment",
  "reminderEnabled": true,
  "reminderTimes": ["08:00", "14:00", "20:00"]
}
```

**Response:** `201 Created`

### Get All Medications

**GET** `/api/medications/baby/:babyId`

### Get Active Medications Only

**GET** `/api/medications/baby/:babyId/active`

Returns only currently active medications (considering dates and status).

### Update Medication Status

**PATCH** `/api/medications/:id/status`

**Request Body:**
```json
{
  "status": "completed"
}
```

Status values: `active`, `completed`, `discontinued`

### Update Medication

**PUT** `/api/medications/:id`

### Delete Medication

**DELETE** `/api/medications/:id`

---

## 🤖 AI Insights

### Generate AI Insights

**POST** `/api/ai-insights/generate/:babyId`

Automatically generates AI insights based on measurement history.

**Response:** `201 Created`
```json
[
  {
    "_id": "876543...",
    "babyId": "654321...",
    "insightType": "growth_prediction",
    "title": "6-Month Growth Forecast",
    "description": "Based on 12 measurements, we predict...",
    "confidenceScore": 78,
    "severity": "info",
    "predictions": {
      "timeframe": "6 months",
      "confidence": 78,
      "metrics": { ... },
      "influenceFactors": [
        { "name": "Growth Velocity", "value": 28 },
        { "name": "Nutrition Patterns", "value": 25 },
        ...
      ]
    },
    "status": "active",
    ...
  }
]
```

### Get All Insights

**GET** `/api/ai-insights/baby/:babyId`

### Get Active Insights Only

**GET** `/api/ai-insights/baby/:babyId/active`

Returns only active, non-expired insights.

### Get Specific Insight

**GET** `/api/ai-insights/:id`

Includes populated related measurements and health records.

### Update Insight Status

**PATCH** `/api/ai-insights/:id/status`

**Request Body:**
```json
{
  "status": "acted_upon",
  "action": "Scheduled pediatrician appointment",
  "notes": "Appointment on Dec 1"
}
```

Status values: `active`, `dismissed`, `acted_upon`, `expired`

### Delete Insight

**DELETE** `/api/ai-insights/:id`

---

## ❌ Error Responses

All errors return appropriate HTTP status codes with error details:

**400 Bad Request**
```json
{
  "error": "Validation error message"
}
```

**404 Not Found**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Error message",
  "stack": "..." // Only in development
}
```

---

## 🧪 Testing with cURL

### Example: Create a Baby and Add Measurement

```bash
# 1. Create baby
curl -X POST http://localhost:5001/api/babies \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "test123",
    "userId": "test123",
    "name": "Test Baby",
    "dateOfBirth": "2021-06-15",
    "gender": "female"
  }'

# Save the returned _id, then:

# 2. Add measurement
curl -X POST http://localhost:5001/api/measurements \
  -H "Content-Type: application/json" \
  -d '{
    "babyId": "<BABY_ID_FROM_STEP_1>",
    "height": { "value": 95.5, "unit": "cm" },
    "weight": { "value": 14.2, "unit": "kg" },
    "measurementDate": "2024-11-25"
  }'

# 3. Get analytics
curl http://localhost:5001/api/measurements/baby/<BABY_ID>/analytics
```

---

## 📱 Integration with Frontend

All endpoints accept and return JSON. Make sure to:
1. Set `Content-Type: application/json` header for POST/PUT requests
2. Handle error responses appropriately
3. Store `babyId` after creating a baby profile
4. Use the analytics endpoint to display growth charts and predictions

For the React Native app, use `axios` or `fetch`:

```javascript
const API_URL = 'http://localhost:5001/api';

// Create measurement
const response = await fetch(`${API_URL}/measurements`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(measurementData),
});
const data = await response.json();
```

---

For questions or issues, refer to the main README or check the server logs.
