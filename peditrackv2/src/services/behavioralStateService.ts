import { API_CONFIG } from '@/config/config';

export type BehavioralState = {
  disliked_ingredients: string[];
  liked_ingredients: string[];
};

const BASE_URL = API_CONFIG.MEAL_RECOMMENDATION_SERVICE_URL;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const getBehavioralState = async (
  childId: string,
): Promise<BehavioralState> => {
  const url = `${BASE_URL}/behavioral-state?childId=${encodeURIComponent(childId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<BehavioralState>(response);
};
