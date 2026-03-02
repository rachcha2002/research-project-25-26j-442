import { API_CONFIG } from '@/config/config';

export type MealPlanEntry = {
  meal_type: string;
  plate: Record<string, string>;
  calories: number;
};

export type DailyGeneratedMealPlan = Record<string, MealPlanEntry>;

export type MealFeedbackEntry = {
  status: 'accepted' | 'rejected' | string;
  actioned_items: string[];
  new_meal: boolean;
  updated_at?: string;
};

export type MealFeedbackMap = Record<string, MealFeedbackEntry>;

export type TodayGeneratedPlanResponse = {
  plan: DailyGeneratedMealPlan;
  meal_feedback: MealFeedbackMap;
};

export type MealFeedbackPayload = {
  child_id: string;
  meal_type: string;
  action: 'accept' | 'reject';
  new_meal: boolean;
  actioned_items: string[];
};

export type MealFeedbackResponse = {
  message: string;
  current_state: {
    disliked_ingredients: string[];
    liked_ingredients: string[];
  };
  meal_feedback?: MealFeedbackMap;
  meal_type?: string;
  updated_meal?: MealPlanEntry;
  updated_plan?: DailyGeneratedMealPlan;
};

export type GenerateMealPlanPayload = {
  child_id: string;
  health_data: {
    age_months: number;
    weight_kg: number;
    height_cm: number;
    gender: string;
    activity_level: string;
    medical_conditions: string[];
    medications: string[];
    daily_calorie_target: number;
  };
  preferences: {
    diet_type: string;
    allergies: string[];
    budget_level: string;
  };
  lifestyle: {
    meals_per_day: number;
  };
  behavioral_state: {
    disliked_ingredients: string[];
    liked_ingredients: string[];
  };
};

const BASE_URL = API_CONFIG.MEAL_RECOMMENDATION_SERVICE_URL;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const getTodayGeneratedPlan = async (
  childId: string,
): Promise<TodayGeneratedPlanResponse | null> => {
  const url = `${BASE_URL}/generated-plans/today?childId=${encodeURIComponent(childId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 404) {
    return null;
  }

  return handleResponse<TodayGeneratedPlanResponse>(response);
};

export const generateMealPlan = async (
  payload: GenerateMealPlanPayload,
): Promise<DailyGeneratedMealPlan> => {
  const response = await fetch(`${BASE_URL}/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{ message: string; data: { daily_plan: DailyGeneratedMealPlan } }>(response);
  return data.data.daily_plan;
};

export const submitMealFeedback = async (
  payload: MealFeedbackPayload,
): Promise<MealFeedbackResponse> => {
  const response = await fetch(`${BASE_URL}/meal-feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse<MealFeedbackResponse>(response);
};
