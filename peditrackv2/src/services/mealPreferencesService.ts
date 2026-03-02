import { API_CONFIG } from '@/config/config';

export type MealPreference = {
  parent_id: string;
  child_id: string;
  diet_type: string | null;
  budget_level: string | null;
  meals_per_day: number | null;
  activity_level: string | null;
};

type GetMealPreferenceParams = {
  parentId: string;
  childId: string;
};

const BASE_URL = API_CONFIG.MEAL_RECOMMENDATION_SERVICE_URL;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const getMealPreference = async ({
  parentId,
  childId,
}: GetMealPreferenceParams): Promise<MealPreference | null> => {
  const url = `${BASE_URL}/meal-preferences?parentId=${encodeURIComponent(parentId)}&childId=${encodeURIComponent(childId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<MealPreference | null>(response);
};

export const createMealPreference = async (
  payload: MealPreference,
): Promise<MealPreference> => {
  const response = await fetch(`${BASE_URL}/meal-preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse<MealPreference>(response);
};

export const updateMealPreference = async (
  payload: MealPreference,
): Promise<MealPreference> => {
  const response = await fetch(`${BASE_URL}/meal-preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse<MealPreference>(response);
};
