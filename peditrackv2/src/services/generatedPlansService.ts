import { API_CONFIG } from '@/config/config';

export type MealPlanEntry = {
  meal_type: string;
  plate: Record<string, string>;
  calories: number;
};

export type DailyGeneratedMealPlan = Record<string, MealPlanEntry>;

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
): Promise<DailyGeneratedMealPlan | null> => {
  const url = `${BASE_URL}/generated-plans/today?childId=${encodeURIComponent(childId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 404) {
    return null;
  }

  return handleResponse<DailyGeneratedMealPlan>(response);
};
