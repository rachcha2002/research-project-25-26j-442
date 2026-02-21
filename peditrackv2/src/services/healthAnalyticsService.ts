// For Android Emulator: use 10.0.2.2
// For Physical Device: use your computer's IP address (check with ipconfig)
// Current Wi-Fi IP: 192.168.1.153 (Updated: 2026-01-05)
const API_BASE_URL = 'http://192.168.1.179:5001/api';

import * as SecureStore from 'expo-secure-store';
import { APP_CONFIG } from '../config/config';

/**
 * Health Analytics Service for PediTrack v2
 * Handles communication with the health-analytics-service microservice
 * 
 * NOTE: Baby profile management is handled by the User Service.
 * This service only manages health-related data (measurements, conditions, medications, etc.)
 */

// ==================== Helper Functions ====================

/**
 * Get JWT access token from secure storage
 */
const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Create headers with authentication
 */
const createHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// ==================== Interfaces ====================

export interface MeasurementValue {
  value: number;
  unit: string;
}

export interface Measurement {
  _id?: string;
  babyId: string;
  measurementDate: string;
  height: MeasurementValue;
  weight: MeasurementValue;
  headCircumference?: MeasurementValue;
  bmi?: number;
  location?: string;
  notes?: string;
  entryMode?: 'manual' | 'photo';
  createdAt?: string;
  updatedAt?: string;
}

export interface GrowthVelocity {
  velocity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  timeDiff: number;
}

export interface PredictionMetric {
  predicted: number;
  current: number;
  change: number;
  unit: string;
}

export interface InfluenceFactor {
  name: string;
  value: number;
}

export interface GrowthPrediction {
  timeframe: string;
  confidence: number;
  metrics: {
    height: PredictionMetric;
    weight: PredictionMetric;
  };
  influenceFactors: InfluenceFactor[];
}

export interface GrowthAnalytics {
  latest: Measurement;
  velocity: {
    height: GrowthVelocity;
    weight: GrowthVelocity;
  };
  predictions: {
    '3months': GrowthPrediction;
    '6months': GrowthPrediction;
    '12months': GrowthPrediction;
  };
  totalMeasurements: number;
}

export interface HealthCondition {
  _id?: string;
  babyId: string;
  conditionName: string;
  diagnosisDate: string;
  severity?: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'monitoring';
  symptoms?: string[];
  treatment?: string;
  doctorName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Symptom {
  _id?: string;
  babyId: string;
  conditionId?: string;
  symptomName: string;
  severity: 'mild' | 'moderate' | 'severe';
  startDate: string;
  endDate?: string;
  description?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Medication {
  _id?: string;
  babyId: string;
  conditionId?: string;
  name: string;
  dosage: {
    amount: number;
    unit: string;
  };
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: {
    doctorName: string;
    clinicName?: string;
    contactNumber?: string;
  };
  prescriptionNumber?: string;
  purpose?: string;
  reminderEnabled?: boolean;
  reminderTimes?: string[];
  status?: 'active' | 'completed' | 'discontinued';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vaccination {
  _id?: string;
  babyId: string;
  vaccineName: string;
  vaccineType?: string;
  doseNumber: number;
  totalDoses: number;
  scheduledDate?: string;
  administeredDate?: string;
  status: 'scheduled' | 'completed' | 'overdue' | 'skipped';
  location?: {
    clinic?: string;
    address?: string;
  };
  provider?: {
    name?: string;
    contact?: string;
  };
  batchNumber?: string;
  notes?: string;
  sideEffects?: string[];
  createdAt?: string;
  updatedAt?: string;
}


export interface AIInsight {
  _id?: string;
  babyId: string;
  insightType: 'growth' | 'health' | 'nutrition' | 'development';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'alert';
  recommendations?: string[];
  confidence?: number;
  createdAt?: string;
  dismissedAt?: string;
}

export interface ModelPerformance {
  modelName: string;
  accuracy: number;
  lastTrainedAt: string;
  dataPoints: number;
  version: string;
}

export interface VaccineType {
  _id?: string;
  name: string;
  description?: string;
  recommendedDoses: number;
  ageRecommendations?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SymptomEntry {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  isCustom: boolean;
}

export interface DailySymptom {
  _id?: string;
  babyId: string;
  symptoms: SymptomEntry[];
  recordedAt: string;
  notes?: string;
  temperature?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'moderate' | 'high';
  riskFactors: string[];
  recommendations: string[];
  confidenceScore: number;
}

export interface SleepLog {
  _id?: string;
  babyId: string;
  date: string;
  hours: number;
  quality: 'good' | 'fair' | 'poor';
  notes?: string;
  createdAt?: string;
}

// Health Record type matching backend model
export interface HealthRecord {
  _id?: string;
  babyId: string;
  recordDate: string;
  recordType: 'checkup' | 'illness' | 'vaccination' | 'emergency' | 'other';
  
  // Health metrics
  temperature?: {
    value: number;
    unit: 'C' | 'F';
  };
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  
  // Clinical information
  symptoms?: string[];
  diagnosis?: string;
  severity?: 'mild' | 'moderate' | 'severe' | '';
  status?: 'monitoring' | 'active' | 'resolved' | 'underTreatment' | '';
  
  // Medical professional info
  doctorName?: string;
  clinicName?: string;
  doctorNotes?: string;
  
  // Attachments
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  
  // Additional notes
  notes?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Health Records ====================

/**
 * Get health records for a baby
 */
export const getHealthRecords = async (
  babyId: string,
  type?: 'illness' | 'checkup' | 'vaccination' | 'emergency' | 'other'
): Promise<HealthRecord[]> => {
  try {
    console.log('[HealthAnalytics] getHealthRecords called', { babyId, type });
    const headers = await createHeaders();
    console.log('[HealthAnalytics] Headers created:', headers);
    
    const params = type ? `?recordType=${type}` : '';
    const url = `${API_BASE_URL}/health-records/baby/${babyId}${params}`;
    console.log('[HealthAnalytics] Fetching from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('[HealthAnalytics] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HealthAnalytics] Error response:',errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[HealthAnalytics] Data received:', data);
    return data;
  } catch (error) {
    console.error(`[HealthAnalytics] Error getting health records:`, error);
    throw error;
  }
};

/**
 * Get a specific health record by ID
 */
export const getHealthRecordById = async (recordId: string): Promise<HealthRecord> => {
  try {
    console.log('[HealthAnalytics] getHealthRecordById called for:', recordId);
    const headers = await createHeaders();
    const url = `${API_BASE_URL}/health-records/${recordId}`;
    console.log('[HealthAnalytics] Fetching from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('[HealthAnalytics] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HealthAnalytics] Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[HealthAnalytics] Record received:', data);
    return data;
  } catch (error) {
    console.error('[HealthAnalytics] Error getting health record by ID:', error);
    throw error;
  }
};

/**
 * Add a health record
 */
export const addHealthRecord = async (recordData: Partial<HealthRecord>): Promise<HealthRecord> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/health-records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(recordData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding health record:', error);
    throw error;
  }
};

/**
 * Update a health record
 */
export const updateHealthRecord = async (
  recordId: string,
  recordData: Partial<HealthRecord>
): Promise<HealthRecord> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/health-records/${recordId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(recordData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating health record:', error);
    throw error;
  }
};

/**
 * Delete a health record
 */
export const deleteHealthRecord = async (recordId: string): Promise<void> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/health-records/${recordId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting health record:', error);
    throw error;
  }
};

// ==================== Measurements ====================

/**
 * Add a new measurement
 */
export const addMeasurement = async (measurementData: Partial<Measurement>): Promise<Measurement> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/measurements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(measurementData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding measurement:', error);
    throw error;
  }
};

/**
 * Get measurements for a baby
 */
export const getMeasurements = async (
  babyId: string,
  options?: { limit?: number; startDate?: string; endDate?: string }
): Promise<Measurement[]> => {
  try {
    console.log('[HealthAnalytics] getMeasurements called for babyId:', babyId);
    const headers = await createHeaders();
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/measurements/baby/${babyId}${queryString ? `?${queryString}` : ''}`;
    console.log('[HealthAnalytics] Fetching measurements from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('[HealthAnalytics] Measurement response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HealthAnalytics] Measurement error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[HealthAnalytics] Measurements received:', data.length, 'items');
    return data;
  } catch (error) {
    console.error('Error getting measurements:', error);
    throw error;
  }
};

/**

/**
 * Get a specific measurement by ID
 */
export const getMeasurementById = async (babyId: string, measurementId: string): Promise<Measurement> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/measurements/${measurementId}?babyId=${babyId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting measurement:', error);
    throw error;
  }
};

/**
 * Update a measurement
 */
export const updateMeasurement = async (
  babyId: string,
  measurementId: string,
  measurementData: Partial<Measurement>
): Promise<Measurement> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/measurements/${measurementId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ...measurementData, babyId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating measurement:', error);
    throw error;
  }
};

/**
 * Get latest measurement for a baby
 */
export const getLatestMeasurement = async (babyId: string): Promise<Measurement | null> => {
  try {
    const headers = await createHeaders();
    const url = `${API_BASE_URL}/measurements/baby/${babyId}/latest`;
    console.log('[HealthAnalytics] Fetching latest measurement from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting latest measurement:', error);
    throw error;
  }
};

/**
 * Delete a measurement
 */
export const deleteMeasurement = async (babyId: string, measurementId: string): Promise<void> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/measurements/${measurementId}?babyId=${babyId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting measurement:', error);
    throw error;
  }
};

// ==================== Growth Data ====================

/**
 * Get growth data for a baby
 */
export const getGrowthData = async (
  babyId: string,
  options?: { period?: string; type?: string }
): Promise<GrowthAnalytics> => {
  try {
    const headers = await createHeaders();
    const params = new URLSearchParams();
    if (options?.period) params.append('period', options.period);
    if (options?.type) params.append('type', options.type);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/measurements/baby/${babyId}/analytics${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting growth data:', error);
    throw error;
  }
};

/**
 * Get growth percentiles for a baby
 */
export const getGrowthPercentiles = async (babyId: string): Promise<any> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/measurements/baby/${babyId}/percentiles`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting growth percentiles:', error);
    throw error;
  }
};

/**
 * Get growth chart data
 */
export const getGrowthChartData = async (
  babyId: string,
  type: string,
  period: string
): Promise<any> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(
      `${API_BASE_URL}/measurements/baby/${babyId}/chart?type=${type}&period=${period}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting growth chart data:', error);
    throw error;
  }
};

// ==================== Health Conditions ====================

/**
 * Add a health condition
 */
export const addHealthCondition = async (conditionData: Partial<HealthCondition>): Promise<HealthCondition> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/health-conditions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(conditionData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding health condition:', error);
    throw error;
  }
};

/**
 * Get health conditions for a baby
 */
export const getHealthConditions = async (babyId: string): Promise<HealthCondition[]> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/health-conditions/baby/${babyId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting health conditions:', error);
    throw error;
  }
};

/**
 * Get a health condition by ID
 */
export const getHealthConditionById = async (conditionId: string): Promise<HealthCondition> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/health-conditions/${conditionId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting health condition:', error);
    throw error;
  }
};

/**
 * Update a health condition
 */
export const updateHealthCondition = async (
  conditionId: string,
  conditionData: Partial<HealthCondition>
): Promise<HealthCondition> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/health-conditions/${conditionId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(conditionData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating health condition:', error);
    throw error;
  }
};

/**
 * Delete a health condition
 */
export const deleteHealthCondition = async (conditionId: string): Promise<void> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/health-conditions/${conditionId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting health condition:', error);
    throw error;
  }
};

/**
 * Get active health conditions
 */
export const getActiveConditions = async (babyId: string): Promise<HealthCondition[]> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/health-conditions/baby/${babyId}/active`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting active conditions:', error);
    throw error;
  }
};

// ==================== Symptoms ====================

/**
 * Add a symptom
 */
export const addSymptom = async (symptomData: Partial<Symptom>): Promise<Symptom> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/symptoms`, {
      method: 'POST',
      headers,
      body: JSON.stringify(symptomData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding symptom:', error);
    throw error;
  }
};

// ==================== Medications ====================

/**
 * Add a medication
 */
export const addMedication = async (medicationData: Partial<Medication>): Promise<Medication> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/medications`, {
      method: 'POST',
      headers,
      body: JSON.stringify(medicationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

/**
 * Get medications for a baby
 */
export const getMedications = async (
  babyId: string,
  options?: { status?: string }
): Promise<Medication[]> => {
  try {
    const headers = await createHeaders();
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/medications/baby/${babyId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting medications:', error);
    throw error;
  }
};

/**
 * Get a medication by ID
 */
export const getMedicationById = async (medicationId: string): Promise<Medication> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/medications/${medicationId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting medication:', error);
    throw error;
  }
};

/**
 * Update a medication
 */
export const updateMedication = async (
  medicationId: string,
  medicationData: Partial<Medication>
): Promise<Medication> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/medications/${medicationId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(medicationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

/**
 * Delete a medication
 */
export const deleteMedication = async (medicationId: string): Promise<void> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/medications/${medicationId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};

/**
 * Get active medications
 */
export const getActiveMedications = async (babyId: string): Promise<Medication[]> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/medications/baby/${babyId}/active`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting active medications:', error);
    throw error;
  }
};

// ==================== Vaccination Management ====================

/**
 * Get all vaccinations for a baby
 */
export const getVaccinations = async (
  babyId: string,
  options?: { status?: 'scheduled' | 'completed' | 'overdue' | 'skipped' }
): Promise<Vaccination[]> => {
  try {
    const headers = await createHeaders();
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/vaccinations/baby/${babyId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting vaccinations:', error);
    throw error;
  }
};

/**
 * Get completed vaccinations for a baby
 */
export const getCompletedVaccines = async (babyId: string): Promise<Vaccination[]> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/vaccinations/baby/${babyId}/completed`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting completed vaccines:', error);
    throw error;
  }
};

/**
 * Get upcoming vaccinations for a baby
 */
export const getUpcomingVaccines = async (babyId: string): Promise<Vaccination[]> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/vaccinations/baby/${babyId}/upcoming`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting upcoming vaccines:', error);
    throw error;
  }
};

/**
 * Get a specific vaccination by ID
 */
export const getVaccinationById = async (vaccinationId: string): Promise<Vaccination> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/vaccinations/${vaccinationId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting vaccination:', error);
    throw error;
  }
};

/**
 * Add a new vaccination
 */
export const addVaccination = async (vaccinationData: Partial<Vaccination>): Promise<Vaccination> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/vaccinations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(vaccinationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding vaccination:', error);
    throw error;
  }
};

/**
 * Update a vaccination
 */
export const updateVaccination = async (
  vaccinationId: string,
  vaccinationData: Partial<Vaccination>
): Promise<Vaccination> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/vaccinations/${vaccinationId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(vaccinationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating vaccination:', error);
    throw error;
  }
};

/**
 * Update vaccination status
 */
export const updateVaccinationStatus = async (
  vaccinationId: string,
  status: 'scheduled' | 'completed' | 'overdue' | 'skipped'
): Promise<Vaccination> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/vaccinations/${vaccinationId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating vaccination status:', error);
    throw error;
  }
};

/**
 * Delete a vaccination
 */
export const deleteVaccination = async (vaccinationId: string): Promise<void> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/vaccinations/${vaccinationId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting vaccination:', error);
    throw error;
  }
};

// ==================== AI Insights ====================

/**
 * Get health insights for a baby
 */
export const getHealthInsights = async (babyId: string): Promise<AIInsight[]> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/ai-insights/baby/${babyId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting health insights:', error);
    throw error;
  }
};

/**
 * Get growth predictions
 */
export const getGrowthPredictions = async (babyId: string): Promise<any> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/ai-insights/baby/${babyId}/predictions`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting growth predictions:', error);
    throw error;
  }
};

/**
 * Get risk assessment
 */
export const getRiskAssessment = async (babyId: string): Promise<RiskAssessment> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/ai-insights/baby/${babyId}/risk-assessment`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting risk assessment:', error);
    throw error;
  }
};

/**
 * Get model performance metrics
 */
export const getModelPerformance = async (): Promise<ModelPerformance> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/ai-insights/model-performance`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting model performance:', error);
    throw error;
  }
};

// ==================== DEPRECATED - Use User Service Instead ====================
// The following functions are maintained for backward compatibility but should not be used
// Baby profile management is now handled exclusively by the User Service

/**
 * @deprecated Use User Service BabyContext instead
 */
export const createBaby = async (): Promise<never> => {
  throw new Error('Baby management has moved to User Service. Use BabyContext.createBaby() instead.');
};

/**
 * @deprecated Use User Service BabyContext instead
 */
export const getBaby = async (): Promise<never> => {
  throw new Error('Baby management has moved to User Service. Use BabyContext.babies instead.');
};

// ==================== Deprecated Baby Management ====================

/**
 * @deprecated Use User Service BabyContext instead
 */
export const updateBaby = async (): Promise<never> => {
  throw new Error('Baby management has moved to User Service. Use BabyContext.updateBaby() instead.');
};

/**
 * @deprecated Use User Service BabyContext instead
 */
export const deleteBaby = async (): Promise<never> => {
  throw new Error('Baby management has moved to User Service. Use BabyContext.deleteBaby() instead.');
};

/**
 * @deprecated Use User Service BabyContext instead
 */
export const getAllBabies = async (): Promise<never> => {
  throw new Error('Baby management has moved to User Service. Use BabyContext.babies instead.');
};

// ==================== Vaccine Types Management ====================

/**
 * Get all active vaccine types
 */
export const getVaccineTypes = async (): Promise<VaccineType[]> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/vaccine-types`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting vaccine types:', error);
    throw error;
  }
};

/**
 * Seed vaccine types database with common vaccines
 */
export const seedVaccineTypes = async (): Promise<any> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/vaccine-types/seed`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error seeding vaccine types:', error);
    throw error;
  }
};

/**
 * Symptom Management Functions
 */

/**
 * Get all symptoms for a baby
 */
export const getSymptoms = async (babyId: string, startDate?: string, endDate?: string): Promise<DailySymptom[]> => {
  try {
    const headers = await createHeaders();
    let url = `${API_BASE_URL}/symptoms/baby/${babyId}`;
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting symptoms:', error);
    throw error;
  }
};

/**
 * Get recent symptoms (last 7 days)
 */
export const getRecentSymptoms = async (babyId: string): Promise<DailySymptom[]> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/symptoms/baby/${babyId}/recent`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting recent symptoms:', error);
    throw error;
  }
};

/**
 * Get single symptom record
 */
export const getSymptomById = async (id: string): Promise<DailySymptom> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/symptoms/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting symptom:', error);
    throw error;
  }
};

/**
 * Log new symptoms
 */
export const logSymptoms = async (symptomData: Partial<DailySymptom>): Promise<DailySymptom> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/symptoms`, {
      method: 'POST',
      headers,
      body: JSON.stringify(symptomData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging symptoms:', error);
    throw error;
  }
};

/**
 * Update symptom record
 */
export const updateSymptomRecord = async (id: string, symptomData: Partial<DailySymptom>): Promise<DailySymptom> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/symptoms/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(symptomData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating symptom:', error);
    throw error;
  }
};

/**
 * Delete symptom record
 */
export const deleteSymptomRecord = async (id: string): Promise<void> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/symptoms/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting symptom:', error);
    throw error;
  }
};

// ==================== Utility Functions ====================

/**
 * Check service health
 */
export const checkServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const data = await response.json();
    return data.status === 'OK';
  } catch (error) {
    console.error('Service health check failed:', error);
    return false;
  }
};

// ==================== WHO Growth Standards ====================

export interface WHOPercentileData {
  labels: string[];
  childData: number[];
  who5thData: number[];
  who50thData: number[];
  who95thData: number[];
}

/**
 * Get WHO growth percentiles for chart display
 */
export const getWHOPercentiles = async (
  gender: 'male' | 'female',
  birthDate: string,
  measurements: Array<{ date: string; height: number; weight: number; headCircumference?: number }>,
  metric: 'height' | 'weight' | 'bmi'
): Promise<WHOPercentileData> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/growth-standards/percentiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        gender,
        birthDate,
        measurements,
        metric,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching WHO percentiles:', error);
    throw error;
  }
};

// ==================== Sleep Tracking ====================

/**
 * Get sleep logs for a baby
 */
export const getSleepLogs = async (
  babyId: string,
  start?: string, // YYYY-MM-DD
  end?: string    // YYYY-MM-DD
): Promise<SleepLog[]> => {
  try {
    const headers = await createHeaders();
    let url = `${API_BASE_URL}/sleep/${babyId}`;
    
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error fetching sleep logs: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getSleepLogs:', error);
    throw error;
  }
};

/**
 * Log or Update sleep entry (Upsert)
 */
export const logSleep = async (sleepData: Partial<SleepLog>): Promise<SleepLog> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/sleep`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sleepData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to log sleep');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in logSleep:', error);
    throw error;
  }
};

// updateSleepLog is removed as POST handles upsert

/**
 * Delete sleep log
 */
export const deleteSleepLog = async (id: string): Promise<void> => {
  try {
    const headers = await createHeaders();
    const response = await fetch(`${API_BASE_URL}/sleep/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to delete sleep log');
    }
  } catch (error) {
    console.error('Error in deleteSleepLog:', error);
    throw error;
  }
};
