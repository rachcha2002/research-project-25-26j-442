import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =
  // prefer runtime config (app.config.ts -> extra) then fallback
  (Constants as any)?.expoConfig?.extra?.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || 'https://your-backend.example.com/api';

const PENDING_KEY = 'peditrack_pending_assessments_v1';

export type AssessmentPayload = {
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
    capillary_refill_sec: number | null;
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
};

export type BackendRecommendation = {
  code: string;
  label: string;
  urgency: string;
};

export type BackendResponse = {
  assessment_id: string;
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  risk_scale?: string;
  immediate_flag?: boolean;
  reasons?: string[];
  recommendations?: BackendRecommendation[];
  timestamp?: string;
};

async function readPending(): Promise<Array<{ id: string; payload: AssessmentPayload }>> {
  try {
    const raw = await SecureStore.getItemAsync(PENDING_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Array<{ id: string; payload: AssessmentPayload }>;
  } catch (e) {
    console.warn('readPending error', e);
    return [];
  }
}

async function writePending(list: Array<{ id: string; payload: AssessmentPayload }>) {
  try {
    await SecureStore.setItemAsync(PENDING_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('writePending error', e);
  }
}

function makeLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Minimal ETAT/AVPU fallback check — returns true if immediate flag should be set
 */
export function fallbackImmediateCheck(payload: AssessmentPayload): boolean {
  if (Array.isArray(payload.danger_signs) && payload.danger_signs.length > 0) return true;
  if (payload.vitals && payload.vitals.avpu && payload.vitals.avpu !== 'Alert') return true;
  return false;
}

/**
 * Submit assessment to backend. On network failure, stores it encrypted locally for retry.
 * token optional for production JWT; in dev can be omitted.
 */
export async function submitAssessment(
  payload: AssessmentPayload,
  token?: string
): Promise<BackendResponse> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/risk-score`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const data = (await res.json()) as BackendResponse;
    return data;
  } catch (err) {
    // store locally for retry
    try {
      const pending = await readPending();
      const id = makeLocalId();
      pending.push({ id, payload });
      await writePending(pending);
      console.warn('submit failed — saved locally for retry', err);
    } catch (e) {
      console.error('failed saving pending assessment', e);
    }
    throw err;
  }
}

/**
 * Upload a photo for a completed assessment. The server endpoint is expected to accept multipart/form-data
 * at `/assessments/{assessmentId}/media` or similar. Adjust path as needed.
 */
export async function uploadAssessmentPhoto(
  assessmentId: string,
  photoUri: string,
  token?: string
): Promise<boolean> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/assessments/${assessmentId}/media`;
  try {
    const form = new FormData();
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    const fileType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // @ts-ignore - React Native FormData file
    form.append('file', { uri: photoUri, name: filename, type: fileType });

    const res = await fetch(url, {
      method: 'POST',
      body: form,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // DO NOT set 'Content-Type' header; let fetch/runtime set the boundary
      } as any,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload HTTP ${res.status}: ${text}`);
    }

    return true;
  } catch (err) {
    console.warn('uploadAssessmentPhoto error', err);
    return false;
  }
}

/**
 * Get pending assessments stored locally
 */
export async function getPendingAssessments() {
  return readPending();
}

/**
 * Retry pending submissions. Call this when network is available or app resumes.
 */
export async function retryPendingSubmissions(token?: string) {
  const pending = await readPending();
  if (!pending.length) return { success: true, retried: 0 };

  let retried = 0;
  const remaining: Array<{ id: string; payload: AssessmentPayload }> = [];

  for (const item of pending) {
    try {
      const res = await submitAssessment(item.payload, token);
      // if success, optionally handle res (e.g., upload photo if present)
      retried += 1;
    } catch (err) {
      // keep it for later
      remaining.push(item);
    }
  }

  await writePending(remaining);
  return { success: remaining.length === 0, retried };
}

/**
 * Remove a specific pending item by id (used if you want to delete after manual handling)
 */
export async function removePendingById(id: string) {
  const pending = await readPending();
  const filtered = pending.filter((p) => p.id !== id);
  await writePending(filtered);
}

export default {
  submitAssessment,
  uploadAssessmentPhoto,
  fallbackImmediateCheck,
  getPendingAssessments,
  retryPendingSubmissions,
  removePendingById,
};
