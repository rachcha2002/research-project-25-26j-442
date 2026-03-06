import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, APP_CONFIG } from '@/config/config';

const API_BASE_URL = API_CONFIG.RISK_ASSESSMENT_URL;

export interface SkinFindings {
  predicted_class: string;
  confidence: number | null;
  model: string;
  version?: string | null;
}

export interface AssessmentPayload {
  userId?: string | null;
  child: {
    name: string | null;
    age_months: number | null;
    weight_kg: number | null;
  };
  vitals: {
    temperature_c: number | null;
    heart_rate_bpm: number | null;
    respiratory_rate_bpm: number | null;
    spo2_percent: number | null;
    avpu: 'Alert' | 'Voice' | 'Pain' | 'Unresponsive';
    pain_score: number;
  };
  symptoms: Array<{ key: string; severity: string; details: string }>;
  danger_signs: string[];
  feeding: {
    feeding_normally: 'yes' | 'no' | 'unknown';
    drinking_normally: 'yes' | 'no' | 'unknown';
    urine_output_last_12h: 'normal' | 'reduced' | 'none' | 'unknown';
  };
  context: {
    chronic_conditions: string;
    medications: string;
    recent_travel: string;
    environmental_exposures: string;
    onset: string;
    trend: string;
  };
  optional: {
    photo_uri?: string | null;
    timestamp: string;
  };
  skin_findings?: SkinFindings | null;
  immediate_flag?: boolean;
}

export interface BackendRecommendation {
  code: string;
  label: string;
  urgency: string;
}

export interface BackendResponse {
  assessment_id: string;
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  risk_scale?: string;
  immediate_flag?: boolean;
  reasons?: string[];
  recommendations?: BackendRecommendation[];
  timestamp?: string;
}

export interface AssessmentReportResponse {
  assessment_id: string;
  userId?: string | null;
  child: {
    name: string | null;
    age_months: number | null;
    weight_kg: number | null;
  };
  assessment: {
    date: string;
    risk: 'Low' | 'Medium' | 'High';
    score: number;
    summary: string;
    dangerSigns: string[];
    symptoms: Array<{ label: string; severity: string }>;
    vitals: {
      temperature: number | null;
      heartRate: number | null;
      respRate: number | null;
      spo2: number | null;
      avpu: string | null;
      pain: number | null;
    };
    feeding: {
      feedingNormally: string;
      drinkingNormally: string;
      urineOutput: string;
    };
    context: {
      chronicConditions: string;
      medications: string;
      recentTravel: string;
      exposures: string;
      onset: string;
      trend: string;
    };
    skinFindings?: {
      predictedClass: string | null;
      confidence: number | null;
      model: string | null;
      version: string | null;
    };
    reasons: string[];
    recommendations: BackendRecommendation[];
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Submit a risk assessment to the backend
 */
export const submitAssessment = async (
  payload: AssessmentPayload
): Promise<BackendResponse> => {
  try {
    const token = await SecureStore.getItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY);
    const response = await fetch(`${API_BASE_URL}/risk-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error submitting assessment:', error);
    throw error;
  }
};

/**
 * Classify rash/skin image with model behind risk-assessment-service.
 */
export const classifySkinImage = async (imageUri: string): Promise<SkinFindings> => {
  try {
    const token = await SecureStore.getItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY);

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'rash-image.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await fetch(`${API_BASE_URL}/skin/classify`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error classifying skin image:', error);
    throw error;
  }
};

/**
 * Get the latest risk assessments (for history or analytics)
 */
export const getAssessments = async (): Promise<BackendResponse[]> => {
  try {
    const token = await SecureStore.getItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY);
    const response = await fetch(`${API_BASE_URL}/assessments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching assessments:', error);
    throw error;
  }
};

/**
 * Get a persisted assessment report by assessment id
 */
export const getAssessmentReportById = async (
  assessmentId: string
): Promise<AssessmentReportResponse> => {
  try {
    const token = await SecureStore.getItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY);
    const response = await fetch(`${API_BASE_URL}/assessment-reports/${assessmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching assessment report:', error);
    throw error;
  }
};

/**
 * Get latest persisted assessment report, optionally by user id
 */
export const getLatestAssessmentReport = async (
  userId?: string
): Promise<AssessmentReportResponse> => {
  try {
    const token = await SecureStore.getItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY);
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${API_BASE_URL}/assessment-reports/latest${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching latest assessment report:', error);
    throw error;
  }
};

/**
 * Health check for the risk assessment service
 */
export const checkRiskAssessmentService = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/`);
    const data = await response.json();
    return data && data.includes('Peditrack Risk Assessment Service');
  } catch (error) {
    console.error('Risk assessment service health check failed:', error);
    return false;
  }
};
