const API_BASE_URL = 'http://192.168.1.179:4000/api';

export interface AssessmentPayload {
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

/**
 * Submit a risk assessment to the backend
 */
export const submitAssessment = async (
  payload: AssessmentPayload
): Promise<BackendResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/risk-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
 * Get the latest risk assessments (for history or analytics)
 */
export const getAssessments = async (): Promise<BackendResponse[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments`);
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
