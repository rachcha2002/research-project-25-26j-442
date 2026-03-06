import * as SecureStore from 'expo-secure-store';
import userService from '@/services/userService';
import { APP_CONFIG, API_CONFIG } from '@/config/config';

const API_BASE_URL = API_CONFIG.TELECONSULTATION_URL;
const AUTH_USER_API_BASE_URL = API_CONFIG.AUTH_USER_URL;

const buildHeaders = async (headers?: HeadersInit): Promise<Record<string, string>> => {
  const token = await SecureStore.getItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY);
  const normalized: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (token) {
    normalized.Authorization = `Bearer ${token}`;
  }

  return normalized;
};

const fetchWithAuth = async (url: string, options: RequestInit): Promise<Response> => {
  const requestWithToken = async (overrideToken?: string) => {
    const headers = await buildHeaders(options.headers);
    if (overrideToken) {
      headers.Authorization = `Bearer ${overrideToken}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  let response = await requestWithToken();

  if (response.status === 401) {
    const refreshedToken = await userService.refreshAccessToken();
    response = await requestWithToken(refreshedToken);
  }

  return response;
};

export interface TeleconsultationRequestPayload {
  userId?: string;
  patient: {
    name: string;
    userId: string;
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
  userId?: string;
  patient: {
    name: string;
    userId?: string;
    age_months: number;
    weight_kg: number;
    assessment_id: string;
  };
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  requestedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  videoRoom?: string;
  doctorId?: string;
  doctorName?: string | null;
}

export interface DoctorPublicProfile {
  doctor_id: string;
  first_name?: string;
  last_name?: string;
  specialization?: string;
  profile_photo_url?: string;
  availability_status?: string;
}

export const requestTeleconsultation = async (payload: TeleconsultationRequestPayload): Promise<TeleconsultationRequest> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/request`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}${body ? `: ${body}` : ''}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error requesting teleconsultation:', error);
    throw error;
  }
};

export const getTeleconsultationRequest = async (requestId: string): Promise<TeleconsultationRequest> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/request/${requestId}`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching teleconsultation request:', error);
    throw error;
  }
};

export const getMyTeleconsultationRequests = async (limit = 5): Promise<TeleconsultationRequest[]> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/my-requests?limit=${limit}`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching my teleconsultation requests:', error);
    throw error;
  }
};

export const getQueuePosition = async (requestId: string): Promise<{ position: number; estWait: number }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/queue-position/${requestId}`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching queue position:', error);
    throw error;
  }
};

export const getVideoToken = async (identity: string, room: string): Promise<{ token: string; url?: string }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/video-token`, {
      method: 'POST',
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

export const completeTeleconsultationRequest = async (requestId: string): Promise<TeleconsultationRequest> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/${requestId}/complete`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error completing teleconsultation request:', error);
    throw error;
  }
};

export const cancelTeleconsultationRequest = async (requestId: string): Promise<TeleconsultationRequest> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/${requestId}/cancel`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error cancelling teleconsultation request:', error);
    throw error;
  }
};

export const getDoctorPublicProfile = async (doctorId: string): Promise<DoctorPublicProfile | null> => {
  try {
    const response = await fetch(`${AUTH_USER_API_BASE_URL}/${encodeURIComponent(doctorId)}/public`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data?.doctor || null;
  } catch (error) {
    console.error('Error fetching doctor public profile:', error);
    return null;
  }
};
