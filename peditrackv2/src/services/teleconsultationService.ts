const API_BASE_URL = 'http://192.168.1.6:4000/api/teleconsultation';

export interface TeleconsultationRequestPayload {
  patient: {
    name: string;
    age_months: number;
    weight_kg: number;
    assessment_id: string;
  };
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  assessment_id: string;
}

export interface TeleconsultationRequest {
  _id: string;
  patient: {
    name: string;
    age_months: number;
    weight_kg: number;
    assessment_id: string;
  };
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  status: 'pending' | 'accepted' | 'completed';
  requestedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  videoRoom?: string;
  doctorId?: string;
}

export const requestTeleconsultation = async (payload: TeleconsultationRequestPayload): Promise<TeleconsultationRequest> => {
  try {
    const response = await fetch(`${API_BASE_URL}/request`, {
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
    console.error('Error requesting teleconsultation:', error);
    throw error;
  }
};

export const getTeleconsultationRequest = async (requestId: string): Promise<TeleconsultationRequest> => {
  try {
    const response = await fetch(`${API_BASE_URL}/request/${requestId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching teleconsultation request:', error);
    throw error;
  }
};

export const getQueuePosition = async (requestId: string): Promise<{ position: number; estWait: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/queue-position/${requestId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching queue position:', error);
    throw error;
  }
};

export const getVideoToken = async (identity: string, room: string): Promise<{ token: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/video-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identity, room }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching video token:', error);
    throw error;
  }
};
