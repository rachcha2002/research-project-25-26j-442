/**
 * aiService.ts — PediTrack AI/ML API calls
 *
 * Connects to health-analytics-service /api/ai/* which bridges to the Python ml-service.
 * Separate from riskAssessmentService.ts (that is a different clinical triage service).
 */
import * as SecureStore from 'expo-secure-store';
import { APP_CONFIG } from '../config/config';

const API_BASE_URL = 'http://10.174.51.59:5001/api';

// ─────────────────────────────────────────────────────────────────────────────
// Shared auth helper (same pattern as healthAnalyticsService.ts)
// ─────────────────────────────────────────────────────────────────────────────

const getToken = async (): Promise<string | null> => {
  try { return await SecureStore.getItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY); }
  catch { return null; }
};

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiFetch = async (path: string): Promise<any> => {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'moderate' | 'high';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface RiskScore {
  score: number;          // 0–1
  level: RiskLevel;
  color: string;          // hex
}

export interface RiskScores {
  growth_disorder:        RiskScore;
  developmental_delay:    RiskScore;
  nutritional_deficiency: RiskScore;
  behavioral_issue:       RiskScore;
}

export interface Recommendation {
  priority: 'urgent' | 'high' | 'medium' | 'low';
  icon: string;
  title: string;
  description: string;
  actions: string[];
}

export interface Warning {
  type: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  message: string;
}

// ── Health Score ─────────────────────────────────────────────────────────────

export interface HealthScoreResponse {
  healthScore: number;          // 0–100
  riskLevel: RiskLevel;
  confidence: number;           // 0–1
  confidenceLevel: ConfidenceLevel;
  modelUsed: 'DNN' | 'LSTM';
  cached: boolean;
  factors: {
    growth: number;             // 0–100
    nutrition: number;
    development: number;
    behavior: number;
  };
  lastCalculated: string;
}

// ── Predictions ──────────────────────────────────────────────────────────────

export interface MonthPoint {
  month: number;
  age_months: number;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  confidence: number;
}

export interface PredictionsResponse {
  current: {
    height: number;
    weight: number;
    bmi: number;
    date: string;
    ageMonths: number;
  };
  predictions: {
    threeMonths: MonthPoint | null;
    sixMonths: MonthPoint | null;
    twelveMonths: MonthPoint | null;
  };
  trajectory: {
    months: (number | string | null)[];
    heights: number[];
    weights: number[];
    confidences: number[];
  };
  riskScores: RiskScores;
  healthScore: number;
  recommendations: Recommendation[];
  warnings: Warning[];
  cached: boolean;
  lastCalculated: string;
}

// ── Risks ─────────────────────────────────────────────────────────────────────

export interface RisksResponse {
  overallRisk: RiskLevel;
  overallScore: number;        // 0–100 (avg risk × 100)
  healthScore: number;
  riskCategories: {
    growth:      RiskScore;
    nutrition:   RiskScore;
    development: RiskScore;
    behavioral:  RiskScore;
  };
  recommendations: Recommendation[];
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  modelUsed: 'DNN' | 'LSTM';
  cached: boolean;
  lastCalculated: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────────────────────────────────────

export const getHealthScore = async (babyId: string): Promise<HealthScoreResponse> =>
  apiFetch(`/ai/health-score/${babyId}`);

export const getGrowthPredictions = async (babyId: string): Promise<PredictionsResponse> =>
  apiFetch(`/ai/predictions/${babyId}`);

export const getRiskAssessment = async (babyId: string): Promise<RisksResponse> =>
  apiFetch(`/ai/risks/${babyId}`);

export const checkMLServiceStatus = async (): Promise<{ status: string; models_loaded: { dnn: boolean; lstm: boolean } }> =>
  apiFetch(`/ai/status`);

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

export function riskLevelColor(level: RiskLevel): string {
  return level === 'low' ? '#10B981' : level === 'moderate' ? '#F59E0B' : '#EF4444';
}

export function confidenceBadge(level: ConfidenceLevel): { label: string; color: string } {
  if (level === 'high')   return { label: 'High Confidence ●',   color: '#10B981' };
  if (level === 'medium') return { label: 'Medium Confidence ●', color: '#F59E0B' };
  return                         { label: 'Limited Data ●',       color: '#F97316' };
}

export function hoursAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
