import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, APP_CONFIG } from '../config/config';

/**
 * User Service API Client
 * Handles all communication with the user-service backend
 */

// ==================== Interfaces ====================

export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  googleId?: string;
  defaultBabyProfile?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BabyProfile {
  _id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies?: string[];
  photo?: string;
  isDefault?: boolean;
  age?: number;
  // Birth & prematurity data (Survey Q5a, Q5b)
  birthWeight?: number;
  isPremature?: boolean | null;
  gestationalWeeks?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// ==================== Axios Instance ====================

class UserService {
  private api: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.USER_SERVICE_URL,
      timeout: API_CONFIG.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        // Skip adding auth headers for public endpoints
        const isPublicEndpoint = 
          config.url?.includes('/auth/login') ||
          config.url?.includes('/auth/register') ||
          config.url?.includes('/auth/refresh');
        
        if (!isPublicEndpoint) {
          const token = await this.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // Skip token refresh for public endpoints
        const isPublicEndpoint = 
          originalRequest?.url?.includes('/auth/login') ||
          originalRequest?.url?.includes('/auth/register') ||
          originalRequest?.url?.includes('/auth/refresh');

        // If error is 401 and we haven't tried to refresh yet, and it's not a public endpoint
        if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
          if (this.isRefreshing) {
            // Wait for the refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.api(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Add timeout to prevent infinite hanging
            const refreshPromise = this.refreshAccessToken();
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Token refresh timeout')), 10000)
            );

            const newToken = await Promise.race([refreshPromise, timeoutPromise]);
            this.isRefreshing = false;
            this.onRefreshed(newToken);
            this.refreshSubscribers = [];
            
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            console.error('[UserService] Token refresh failed:', refreshError);
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            // Clear tokens and redirect to login
            await this.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
  }

  // ==================== Token Management ====================

  private async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading access token:', error);
      return null;
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(APP_CONFIG.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading refresh token:', error);
      return null;
    }
  }

  private async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      console.log('[UserService] Attempting to save tokens...');
      console.log('[UserService] accessToken type:', typeof accessToken, 'value:', accessToken);
      console.log('[UserService] refreshToken type:', typeof refreshToken, 'value:', refreshToken);
      
      // Validate tokens are strings
      if (!accessToken || typeof accessToken !== 'string') {
        throw new Error('Invalid access token: must be a non-empty string');
      }
      
      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new Error('Invalid refresh token: must be a non-empty string');
      }
      
      await SecureStore.setItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY, accessToken);
      console.log('[UserService] Access token saved successfully');
      
      await SecureStore.setItemAsync(APP_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
      console.log('[UserService] Refresh token saved successfully');
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(APP_CONFIG.REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(APP_CONFIG.USER_DATA_KEY);
      await SecureStore.deleteItemAsync(APP_CONFIG.SELECTED_BABY_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // ==================== Authentication ====================

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/register', {
        name,
        email,
        password,
      });
      
      console.log('[UserService] Register response:', JSON.stringify(response.data, null, 2));
      console.log('[UserService] accessToken type:', typeof response.data.accessToken);
      console.log('[UserService] refreshToken type:', typeof response.data.refreshToken);
      
      await this.saveTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      
      console.log('[UserService] Login response:', JSON.stringify(response.data, null, 2));
      console.log('[UserService] accessToken type:', typeof response.data.accessToken);
      console.log('[UserService] refreshToken type:', typeof response.data.refreshToken);
      
      await this.saveTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async googleAuth(googleIdToken: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/google', {
        idToken: googleIdToken,
      });
      
      await this.saveTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.api.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken,
      });

      // Only save the new access token, keep existing refresh token
      await SecureStore.setItemAsync(APP_CONFIG.ACCESS_TOKEN_KEY, response.data.accessToken);
      console.log('[UserService] New access token saved after refresh');
      
      return response.data.accessToken;
    } catch (error) {
      await this.clearTokens();
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        await this.api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get<{ success: boolean; user: User }>('/users/me');
      return response.data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== User Management ====================

  async updateProfile(name: string): Promise<User> {
    try {
      const response = await this.api.put<{ success: boolean; user: User }>('/users/me', {
        name,
      });
      return response.data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.api.put('/users/me/password', {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      await this.api.delete('/users/me');
      await this.clearTokens();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async setDefaultBaby(babyId: string): Promise<User> {
    try {
      const response = await this.api.put<{ success: boolean; user: User }>(
        `/users/me/default-baby/${babyId}`
      );
      return response.data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== Baby Profile Management ====================

  async getBabyProfiles(): Promise<BabyProfile[]> {
    try {
      console.log('[UserService] getBabyProfiles - Starting request to /babies');
      const response = await this.api.get<{ success: boolean; babies: BabyProfile[] }>(
        '/babies'
      );
      console.log('[UserService] getBabyProfiles - Response:', response.data);
      console.log('[UserService] getBabyProfiles - Babies:', response.data.babies);
      return response.data.babies;
    } catch (error) {
      console.error('[UserService] getBabyProfiles - Error:', error);
      throw this.handleError(error);
    }
  }

  async getBabyById(babyId: string): Promise<BabyProfile> {
    try {
      const response = await this.api.get<{ success: boolean; baby: BabyProfile }>(
        `/babies/${babyId}`
      );
      return response.data.baby;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createBabyProfile(babyData: {
    name: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    bloodType?: string;
    allergies?: string[];
    photo?: string;
    birthWeight?: number;
    isPremature?: boolean;
    gestationalWeeks?: number;
  }): Promise<BabyProfile> {
    try {
      const response = await this.api.post<{ success: boolean; baby: BabyProfile }>(
        '/babies',
        babyData
      );
      return response.data.baby;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateBabyProfile(
    babyId: string,
    babyData: {
      name?: string;
      dateOfBirth?: string;
      gender?: 'male' | 'female' | 'other';
      bloodType?: string;
      allergies?: string[];
      photo?: string;
      birthWeight?: number;
      isPremature?: boolean;
      gestationalWeeks?: number;
    }
  ): Promise<BabyProfile> {
    try {
      const response = await this.api.put<{ success: boolean; baby: BabyProfile }>(
        `/babies/${babyId}`,
        babyData
      );
      return response.data.baby;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteBabyProfile(babyId: string): Promise<void> {
    try {
      await this.api.delete(`/babies/${babyId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== File Upload ====================

  // Helper: fetch with automatic token refresh on 401 (mirrors the Axios interceptor)
  private async fetchWithAuth(url: string, options: RequestInit): Promise<Response> {
    let token = await this.getAccessToken();
    const makeRequest = (t: string | null) =>
      fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
      });

    let response = await makeRequest(token);

    if (response.status === 401) {
      try {
        // Token expired – refresh and retry once
        token = await this.refreshAccessToken();
        response = await makeRequest(token);
      } catch (refreshError) {
        await this.clearTokens();
        throw new Error('Token expired');
      }
    }

    return response;
  }

  async uploadProfilePicture(imageUri: string): Promise<{ url: string }> {
    try {
      const token = await this.getAccessToken();
      const formData = new FormData();
      
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `profile.${fileExtension}`;
      
      // @ts-ignore - React Native FormData accepts uri
      formData.append('image', {
        uri: imageUri,
        type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
        name: fileName,
      });

      const response = await this.fetchWithAuth(
        `${this.api.defaults.baseURL}/upload/profile-picture`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      return { url: data.url };
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }

  async uploadBabyPhoto(babyId: string, imageUri: string): Promise<{ url: string }> {
    try {
      const token = await this.getAccessToken();
      const formData = new FormData();
      
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `baby.${fileExtension}`;
      
      // @ts-ignore - React Native FormData accepts uri
      formData.append('image', {
        uri: imageUri,
        type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
        name: fileName,
      });

      const response = await this.fetchWithAuth(
        `${this.api.defaults.baseURL}/upload/baby-photo/${babyId}`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      return { url: data.url };
    } catch (error) {
       console.error('Upload Error:', error);
       throw error;
    }
  }

  async deleteProfilePicture(): Promise<void> {
    try {
      await this.api.delete('/upload/profile-picture');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteBabyPhoto(babyId: string): Promise<void> {
    try {
      await this.api.delete(`/upload/baby-photo/${babyId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== Error Handling ====================

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      if (axiosError.response) {
        // Server responded with error
        const message = axiosError.response.data?.message || 
                       axiosError.response.data?.error ||
                       'An error occurred';
        return new Error(message);
      } else if (axiosError.request) {
        // Request made but no response
        return new Error('Network error. Please check your internet connection.');
      }
    }
    
    return error instanceof Error ? error : new Error('An unexpected error occurred');
  }

  // ==================== Utility Methods ====================

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  async getUserData(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(APP_CONFIG.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error reading user data:', error);
      return null;
    }
  }

  async saveUserData(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(APP_CONFIG.USER_DATA_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
