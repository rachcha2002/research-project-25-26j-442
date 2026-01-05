# Health Analytics API Integration Guide

## Overview

The `AddMeasurementScreen.tsx` has been successfully integrated with the health analytics service API. This document explains how the integration works and how to use it.

## Service Layer (`healthAnalyticsService.ts`)

### Location
`peditrackv2/src/services/healthAnalyticsService.ts`

### Features
The service provides comprehensive functions for:
- **Baby Management**: Create, read, update, delete baby profiles
- **Measurements**: Add, retrieve, update, and delete growth measurements
- **Growth Analytics**: Get growth predictions and velocity calculations
- **Health Records**: Track medical visits, illnesses, checkups
- **Medications**: Manage medication schedules and reminders
- **AI Insights**: Generate and retrieve AI-powered health insights

### Configuration
Update the `API_BASE_URL` in the service file to match your network setup:

```typescript
// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:5001/api';

// For Physical Device (update with your computer's IP)
const API_BASE_URL = 'http://192.168.1.2:5001/api';

// For iOS Simulator
const API_BASE_URL = 'http://localhost:5001/api';
```

## AddMeasurementScreen Integration

### What Was Added

1. **State Management**
   - `loading`: Boolean to track API request state
   - `measurementDate`: Date object for measurement timestamp
   - `babyId`: String to identify which baby the measurement belongs to

2. **Save Functionality**
   - `saveMeasurement(saveAndAddAnother: boolean)`: Async function that:
     - Validates required fields (height, weight, babyId)
     - Formats data according to API requirements
     - Calls the `addMeasurement` API
     - Shows success/error feedback
     - Resets form or navigates back based on user choice

3. **UI Enhancements**
   - Loading indicators on save buttons
   - Disabled state during API calls
   - Dynamic date display from state
   - Error handling with user-friendly alerts

### How to Use

#### Step 1: Get Baby ID
The baby ID is currently hardcoded as a placeholder. You need to get this from:
- **Route Parameters**: Pass it when navigating to this screen
- **Context/Redux**: Store the current baby in global state
- **AsyncStorage**: Persist the selected baby

Example with route params (using expo-router):
```typescript
// Navigate from parent screen
router.push({
  pathname: '/health-analytics/add-measurement',
  params: { babyId: 'actual-baby-id-here' }
});

// In AddMeasurementScreen.tsx
import { useLocalSearchParams } from 'expo-router';

const { babyId } = useLocalSearchParams<{ babyId: string }>();
```

#### Step 2: Start the Health Analytics Service
Make sure the backend service is running:

```bash
cd services/health-analytics-service
npm start
```

The service should be running on `http://localhost:5001`.

#### Step 3: Update IP Address (for physical device)
If testing on a physical device, update the IP in `healthAnalyticsService.ts`:

```bash
# Get your IP address
ipconfig  # Windows
ifconfig  # Mac/Linux
```

#### Step 4: Test the Integration
1. Open the AddMeasurementScreen
2. Enter height and weight values
3. Optionally add head circumference and notes
4. Tap "Save Measurement" or "Save & Add Another"
5. Watch for loading indicators and success/error alerts

### API Request Format

The measurement data is sent in this format:

```json
{
  "babyId": "674525cc0a8a8b29b8a2bf9c",
  "measurementDate": "2025-11-30",
  "height": {
    "value": 95.5,
    "unit": "cm"
  },
  "weight": {
    "value": 14.2,
    "unit": "kg"
  },
  "headCircumference": {
    "value": 50.0,
    "unit": "cm"
  },
  "location": "Home",
  "notes": "Regular monthly measurement",
  "entryMode": "manual"
}
```

### API Response Format

On success, the API returns the created measurement:

```json
{
  "_id": "675432abc123...",
  "babyId": "674525cc0a8a8b29b8a2bf9c",
  "measurementDate": "2025-11-30T00:00:00.000Z",
  "height": { "value": 95.5, "unit": "cm" },
  "weight": { "value": 14.2, "unit": "kg" },
  "headCircumference": { "value": 50.0, "unit": "cm" },
  "bmi": 15.6,
  "location": "Home",
  "notes": "Regular monthly measurement",
  "entryMode": "manual",
  "createdAt": "2025-11-30T16:23:45.000Z",
  "updatedAt": "2025-11-30T16:23:45.000Z"
}
```

## Error Handling

The integration includes comprehensive error handling:

### Validation Errors
- Missing baby ID
- Height or weight ≤ 0
- Shown as Alert before API call

### Network Errors
- Connection failures
- Timeout issues
- Backend server not running
- Caught and shown to user with alert

### API Errors
- 400 Bad Request (validation errors)
- 404 Not Found (baby not found)
- 500 Server Error (backend issues)
- Error messages extracted from response and shown to user

## Other Available Functions

The `healthAnalyticsService.ts` provides many other functions you can use:

### Get All Measurements
```typescript
import { getMeasurements } from '@/services/healthAnalyticsService';

const measurements = await getMeasurements(babyId);
```

### Get Latest Measurement
```typescript
import { getLatestMeasurement } from '@/services/healthAnalyticsService';

const latest = await getLatestMeasurement(babyId);
```

### Get Growth Analytics
```typescript
import { getGrowthAnalytics } from '@/services/healthAnalyticsService';

const analytics = await getGrowthAnalytics(babyId);
// Returns: latest measurement, growth velocity, predictions (3mo, 6mo, 12mo)
```

### Create Baby Profile
```typescript
import { createBaby } from '@/services/healthAnalyticsService';

const baby = await createBaby({
  accountId: 'user123',
  userId: 'user123',
  name: 'Emma Johnson',
  dateOfBirth: '2021-06-15',
  gender: 'female',
});
```

### Generate AI Insights
```typescript
import { generateAIInsights } from '@/services/healthAnalyticsService';

const insights = await generateAIInsights(babyId);
```

## Next Steps

1. **Pass Baby ID Properly**: Update navigation to pass real baby IDs
2. **Add Date Picker**: Implement date picker for measurement date
3. **Add Location Picker**: Create dropdown for location selection
4. **Implement Photo Mode**: Add camera integration for photo analysis
5. **Show Real-time Percentiles**: Calculate percentiles based on WHO standards
6. **Display Growth Charts**: Visualize measurement history with charts

## Testing Checklist

- [ ] Backend service is running
- [ ] IP address is correctly configured
- [ ] Can save measurements successfully
- [ ] Loading states display correctly
- [ ] Success alerts show
- [ ] Error handling works (try with service stopped)
- [ ] "Save & Add Another" resets form
- [ ] "Save Measurement" navigates back
- [ ] All required fields validated
- [ ] Optional fields (head circumference, notes) work

## Troubleshooting

### "Network request failed"
- Ensure backend service is running
- Check IP address configuration
- Verify firewall settings
- Test backend health: `http://YOUR_IP:5001/health`

### "Baby ID is required"
- Implement proper baby ID passing via route params or context

### "Failed to save measurement"
- Check backend logs for detailed error
- Verify MongoDB connection
- Ensure valid baby ID exists in database

## Resources

- Backend API Docs: `services/health-analytics-service/API_DOCS.md`
- MongoDB Setup: `services/health-analytics-service/MONGODB_SETUP.md`
- Service README: `services/health-analytics-service/README.md`
