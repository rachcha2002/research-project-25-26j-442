# Health Analytics Service

A comprehensive Node.js/Express backend service for the PediTrack health analytics platform. This service manages baby health data including growth measurements, health records, medications, and AI-powered insights.

## 🚀 Features

- **Baby Profile Management**: Create and manage baby/child profiles
- **Growth Tracking**: Record height, weight, head circumference with auto-calculated BMI
- **Health Records**: Track medical visits, symptoms, diagnoses
- **Medication Management**: Monitor medications with dosage tracking and reminders
- **AI Insights**: Automated growth predictions and health alerts
- **Analytics**: Growth velocity, trends, and percentile calculations

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (Local installation or MongoDB Atlas account)

## 🛠️ Installation

1. **Navigate to the service directory:**
   ```bash
   cd services/health-analytics-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup MongoDB:**
   
   Follow the detailed guide in [MONGODB_SETUP.md](./MONGODB_SETUP.md)

4. **Configure environment:**
   
   Copy `.env.example` to `.env` and update:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your MongoDB connection string.

## 🏃 Running the Service

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The service will start on **port 5001** (configurable in `.env`).

You should see:
```
✅ MongoDB connected successfully
🚀 Health Analytics Service running on port 5001
📍 Environment: development
🔗 Health check: http://localhost:5001/health
```

## 📚 API Documentation

See [API_DOCS.md](./API_DOCS.md) for complete API reference.

### Quick Start Example

```bash
# Test health endpoint
curl http://localhost:5001/health

# Create a baby profile
curl -X POST http://localhost:5001/api/babies \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "user123",
    "userId": "user123",
    "name": "Emma",
    "dateOfBirth": "2021-06-15",
    "gender": "female"
  }'
```

## 📁 Project Structure

```
health-analytics-service/
├── models/              # Database models
│   ├── Baby.js
│   ├── Measurement.js
│   ├── HealthRecord.js
│   ├── Medication.js
│   └── AIInsight.js
├── routes/              # API routes
│   ├── babies.js
│   ├── measurements.js
│   ├── healthRecords.js
│   ├── medications.js
│   └── aiInsights.js
├── utils/               # Utility functions
│   └── calculations.js
├── server.js            # Main application file
├── .env                 # Environment configuration
├── .env.example         # Environment template
└── package.json
```

## 🔌 API Endpoints

### Babies
- `POST /api/babies` - Create baby profile
- `GET /api/babies` - Get all babies
- `GET /api/babies/:id` - Get specific baby
- `PUT /api/babies/:id` - Update baby
- `DELETE /api/babies/:id` - Delete baby

### Measurements
- `POST /api/measurements` - Add measurement
- `GET /api/measurements/baby/:babyId` - Get all measurements
- `GET /api/measurements/baby/:babyId/latest` - Get latest
- `GET /api/measurements/baby/:babyId/analytics` - Get analytics with predictions

### Health Records
- `POST /api/health-records` - Add record
- `GET /api/health-records/baby/:babyId` - Get records

### Medications
- `POST /api/medications` - Add medication
- `GET /api/medications/baby/:babyId/active` - Get active medications
- `PATCH /api/medications/:id/status` - Update status

### AI Insights
- `POST /api/ai-insights/generate/:babyId` - Generate insights
- `GET /api/ai-insights/baby/:babyId/active` - Get active insights

## 🧪 Testing

Use Postman, cURL, or any HTTP client to test the endpoints.

Example workflow:
1. Create a baby profile
2. Add 3-4 measurements over time
3. Get analytics to see predictions
4. Generate AI insights

## 🔒 Security Notes

⚠️ **Important**: This initial implementation does not include authentication. For production:

1. Add JWT-based authentication
2. Validate user ownership of baby profiles
3. Use environment-specific security settings
4. Enable HTTPS
5. Implement rate limiting

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Verify MongoDB is running
- Check connection string in `.env`
- See [MONGODB_SETUP.md](./MONGODB_SETUP.md)

**Port Already in Use:**
- Change `PORT` in `.env` file

**Module Not Found:**
- Run `npm install`

## 📝 License

ISC

## 👤 Author

PediTrack Development Team
