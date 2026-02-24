export type RiskLevel = 'low' | 'medium' | 'high';

export interface TeleconsultationRequest {
  _id: string;
  patient: {
    name: string;
    age_months?: number;
    weight_kg?: number;
    assessment_id?: string;
  };
  risk_level: RiskLevel;
  risk_priority?: number;
  risk_score: number;
  status: 'pending' | 'accepted' | 'completed';
  requestedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  videoRoom?: string;
  doctorId?: string;
}

interface ApiError extends Error {
  status?: number;
}

const API_BASE_URL =
  import.meta.env.VITE_TELECONSULTATION_API_URL ||
  'http://localhost:4001/api/teleconsultation';

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    const error: ApiError = new Error(message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function getPendingQueue(): Promise<TeleconsultationRequest[]> {
  const response = await fetch(`${API_BASE_URL}/queue`);
  return parseResponse<TeleconsultationRequest[]>(response);
}

export async function acceptTeleconsultationRequest(
  requestId: string,
  doctorId: string
): Promise<TeleconsultationRequest> {
  const response = await fetch(`${API_BASE_URL}/${requestId}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ doctorId }),
  });
  return parseResponse<TeleconsultationRequest>(response);
}

export async function getVideoToken(identity: string, room: string): Promise<{ token: string; url?: string }> {
  const response = await fetch(`${API_BASE_URL}/video-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identity, room }),
  });

  return parseResponse<{ token: string; url?: string }>(response);
}

export async function completeTeleconsultationRequest(requestId: string): Promise<TeleconsultationRequest> {
  const response = await fetch(`${API_BASE_URL}/${requestId}/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseResponse<TeleconsultationRequest>(response);
}

export async function getDoctorActiveRequest(doctorId: string): Promise<TeleconsultationRequest | null> {
  const response = await fetch(`${API_BASE_URL}/doctor/${doctorId}/active`);

  if (response.status === 404) {
    return null;
  }

  return parseResponse<TeleconsultationRequest>(response);
}
