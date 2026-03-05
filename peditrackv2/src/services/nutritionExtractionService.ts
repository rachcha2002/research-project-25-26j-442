import { API_CONFIG } from '@/config/config';

const BASE_URL = API_CONFIG.NUTRITION_EXTRACTION_SERVICE_URL;

export interface ChildMedicalProfile {
  allergies: string[];
  medical_conditions: string[];
  medications: string[];
}

export interface ClinicalSafetyResponse {
  food_identified: string;
  detection_confidence?: number;
  nutrients?: string[];
  safety_status: 'Safe' | 'Warning' | 'Danger' | string;
  clinical_reasoning: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const buildCandidateBaseUrls = (): string[] => {
  const candidates: string[] = [BASE_URL];

  try {
    const parsedUrl = new URL(BASE_URL);
    const normalizedPath = parsedUrl.pathname === '/' ? '' : parsedUrl.pathname;
    const candidateHosts = [parsedUrl.hostname, '10.0.2.2', 'localhost', '127.0.0.1'];

    candidateHosts.forEach((host) => {
      candidates.push(`${parsedUrl.protocol}//${host}${parsedUrl.port ? `:${parsedUrl.port}` : ''}${normalizedPath}`);
    });
  } catch {
    return [BASE_URL];
  }

  return Array.from(new Set(candidates));
};

const isNetworkError = (error: unknown): boolean => {
  return (
    error instanceof TypeError ||
    (error instanceof Error && /network request failed|network error|failed to fetch/i.test(error.message))
  );
};

const requestWithFallback = async <T>(
  endpoint: string,
  initFactory: () => RequestInit,
): Promise<T> => {
  const baseUrls = buildCandidateBaseUrls();
  let lastError: unknown;

  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, initFactory());
      return await handleResponse<T>(response);
    } catch (error) {
      lastError = error;
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  throw new Error(
    `Unable to reach Nutrition Extraction Service. Tried: ${baseUrls.join(', ')}. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`,
  );
};

export const scanFoodText = async (
  foodQuery: string,
  childProfile: ChildMedicalProfile,
): Promise<ClinicalSafetyResponse> => {
  return requestWithFallback<ClinicalSafetyResponse>('/scan-text', () => ({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      food_query: foodQuery,
      child_profile: childProfile,
    }),
  }));
};

export const scanFoodVision = async (
  imageUri: string,
  childProfile: ChildMedicalProfile,
  userTextHint?: string,
): Promise<ClinicalSafetyResponse> => {
  return requestWithFallback<ClinicalSafetyResponse>('/scan-vision', () => {
    const filename = imageUri.split('/').pop() || 'meal.jpg';
    const extensionMatch = /\.([a-zA-Z0-9]+)$/.exec(filename);
    const fileType = extensionMatch ? `image/${extensionMatch[1].toLowerCase()}` : 'image/jpeg';

    const formData = new FormData();
    formData.append(
      'image',
      {
        uri: imageUri,
        type: fileType,
        name: filename,
      } as any,
    );
    formData.append('profile_json', JSON.stringify(childProfile));

    const normalizedHint = userTextHint?.trim();
    if (normalizedHint) {
      formData.append('user_text_hint', normalizedHint);
    }

    return {
      method: 'POST',
      body: formData,
    };
  });
};
