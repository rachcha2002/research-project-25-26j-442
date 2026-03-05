import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import userService, { User, AuthResponse, SubscriptionStatus } from '../services/userService';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../config/config';

/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleSignIn: (googleIdToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  uploadProfilePicture: (imageUri: string) => Promise<void>;
  setDefaultBaby: (babyId: string) => Promise<void>;
  createCheckoutSession: () => Promise<string>;
  cancelSubscription: () => Promise<void>;
  getSubscriptionStatus: () => Promise<SubscriptionStatus>;
  toggleAutoRenew: (autoRenew: boolean) => Promise<void>;
  payNowWithSavedCard: () => Promise<{ success: boolean; message: string; needsCheckout?: boolean }>;
  verifyCheckoutSession: (sessionId: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('[AuthContext] checkAuthStatus started');
    try {
      setIsLoading(true);

      const isAuth = await userService.isAuthenticated();
      console.log('[AuthContext] isAuthenticated:', isAuth);

      if (isAuth) {
        // Get cached user data first
        const cachedUser = await userService.getUserData();
        console.log('[AuthContext] Cached user:', cachedUser ? 'found' : 'not found');
        if (cachedUser) {
          setUser(cachedUser);
        }

        // Then fetch fresh data with timeout
        try {
          console.log('[AuthContext] Fetching fresh user data...');
          // Create a promise that rejects after 5 seconds
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          );

          const freshUser = await Promise.race([
            userService.getCurrentUser(),
            timeoutPromise
          ]) as User;

          console.log('[AuthContext] Fresh user data received');
          setUser(freshUser);
          await userService.saveUserData(freshUser);
        } catch (error: any) {
          console.error('[AuthContext] Error refreshing user:', error);

          // If timeout or network error, tokens are likely invalid
          // Clear them and force logout rather than using stale cached data
          if (error?.message?.includes('timeout') || error?.message?.includes('401')) {
            console.log('[AuthContext] Auth error detected, clearing tokens and logging out');
            await userService.logout(); // This clears all tokens
            setUser(null);
            return; // Exit early, finally block will set isLoading to false
          }

          // Check if tokens were cleared by response interceptor
          const stillAuth = await userService.isAuthenticated();
          if (!stillAuth) {
            console.log('[AuthContext] Tokens were cleared (refresh token expired), forcing logout');
            setUser(null);
            return;
          }

          // For other errors, if we have no cached user, clear auth state
          if (!cachedUser) {
            console.log('[AuthContext] No cached user, clearing state');
            setUser(null);
          }
          // Otherwise, continue with cached user data
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error checking auth status:', error);
      setUser(null);
    } finally {
      console.log('[AuthContext] checkAuthStatus completed, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response: AuthResponse = await userService.login(email, password);

      if (response.user) {
        setUser(response.user);
        await userService.saveUserData(response.user);

        // Mark onboarding as completed for returning users
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response: AuthResponse = await userService.register(name, email, password);
      setUser(response.user);
      await userService.saveUserData(response.user);

      // Mark onboarding as completed for new users
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleSignIn = async (googleIdToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response: AuthResponse = await userService.googleAuth(googleIdToken);
      setUser(response.user);
      await userService.saveUserData(response.user);
      // Mark onboarding as completed for Google sign-in users
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await userService.logout();
      // Keep this flag so the user always goes to /auth/login, never onboarding
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user state even if logout request fails
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await userService.getCurrentUser();
      setUser(freshUser);
      await userService.saveUserData(freshUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh user data';
      setError(message);
      throw error;
    }
  };

  const updateUserProfile = async (name: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedUser = await userService.updateProfile(name);
      setUser(updatedUser);
      await userService.saveUserData(updatedUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await userService.changePassword(currentPassword, newPassword);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { url } = await userService.uploadProfilePicture(imageUri);

      // Refresh user to get updated profile picture
      await refreshUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload profile picture';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultBaby = async (babyId: string) => {
    try {
      setError(null);

      const updatedUser = await userService.setDefaultBaby(babyId);
      setUser(updatedUser);
      await userService.saveUserData(updatedUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set default baby';
      setError(message);
      throw error;
    }
  };

  const createCheckoutSession = async (): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await userService.createCheckoutSession();
      return response.checkoutUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create checkout session';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await userService.cancelSubscription();
      // Refresh user data to reflect cancellation
      await refreshUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
    try {
      return await userService.getSubscriptionStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get subscription status';
      setError(message);
      throw error;
    }
  };

  const toggleAutoRenew = async (autoRenew: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      await userService.toggleAutoRenew(autoRenew);
      await refreshUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle auto-renewal';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const payNowWithSavedCard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await userService.payNowWithSavedCard();
      await refreshUser();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process payment';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCheckoutSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await userService.verifyCheckoutSession(sessionId);
      setUser(updatedUser);
      await userService.saveUserData(updatedUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify checkout session';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    googleSignIn,
    logout,
    refreshUser,
    updateUserProfile,
    changePassword,
    uploadProfilePicture,
    setDefaultBaby,
    createCheckoutSession,
    cancelSubscription,
    getSubscriptionStatus,
    toggleAutoRenew,
    payNowWithSavedCard,
    verifyCheckoutSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
