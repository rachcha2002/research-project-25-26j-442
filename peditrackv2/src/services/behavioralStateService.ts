import { API_CONFIG } from '@/config/config';

export type BehavioralState = {
  disliked_ingredients: string[];
  liked_ingredients: string[];
};

export type BehavioralMealsListResponse = {
  child_id: string;
  meals: string[];
};

type ListType = 'accepted' | 'rejected';

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
  const url = `${BASE_URL}/behavioral-state/?childId=${encodeURIComponent(childId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<BehavioralState>(response);
};

export const getAcceptedMeals = async (
  childId: string,
): Promise<BehavioralMealsListResponse> => {
  const url = `${BASE_URL}/behavioral-state/accepted?childId=${encodeURIComponent(childId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<BehavioralMealsListResponse>(response);
};

export const getRejectedMeals = async (
  childId: string,
): Promise<BehavioralMealsListResponse> => {
  const url = `${BASE_URL}/behavioral-state/rejected?childId=${encodeURIComponent(childId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<BehavioralMealsListResponse>(response);
};

export const removeBehavioralItems = async (
  childId: string,
  listType: ListType,
  items: string[],
): Promise<BehavioralMealsListResponse> => {
  const response = await fetch(`${BASE_URL}/behavioral-state/remove-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      child_id: childId,
      list_type: listType,
      items,
    }),
  });

  return handleResponse<BehavioralMealsListResponse>(response);
};
