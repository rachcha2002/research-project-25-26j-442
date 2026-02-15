import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import userService, { BabyProfile } from '../services/userService';
import * as SecureStore from 'expo-secure-store';
import { APP_CONFIG } from '../config/config';
import { useAuth } from './AuthContext';

/**
 * Baby Context
 * Manages baby profile state and provides baby management methods
 */

interface BabyContextType {
  babies: BabyProfile[];
  selectedBaby: BabyProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchBabies: () => Promise<void>;
  selectBaby: (baby: BabyProfile) => void;
  createBaby: (babyData: {
    name: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    bloodType?: string;
    allergies?: string[];
    photo?: string;
  }) => Promise<BabyProfile>;
  updateBaby: (
    babyId: string,
    babyData: {
      name?: string;
      dateOfBirth?: string;
      gender?: 'male' | 'female' | 'other';
      bloodType?: string;
      allergies?: string[];
      photo?: string;
    }
  ) => Promise<BabyProfile>;
  deleteBaby: (babyId: string) => Promise<void>;
  uploadBabyPhoto: (babyId: string, imageUri: string) => Promise<void>;
  setAsDefaultBaby: (babyId: string) => Promise<void>;
  clearError: () => void;
}

const BabyContext = createContext<BabyContextType | undefined>(undefined);

export const useBaby = () => {
  const context = useContext(BabyContext);
  if (!context) {
    throw new Error('useBaby must be used within a BabyProvider');
  }
  return context;
};

interface BabyProviderProps {
  children: ReactNode;
}

export const BabyProvider: React.FC<BabyProviderProps> = ({ children }) => {
  const { user, isAuthenticated, setDefaultBaby: setUserDefaultBaby } = useAuth();
  const [babies, setBabies] = useState<BabyProfile[]>([]);
  const [selectedBaby, setSelectedBaby] = useState<BabyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch babies when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchBabies();
    } else {
      setBabies([]);
      setSelectedBaby(null);
    }
  }, [isAuthenticated, user]);

  // Restore selected baby from storage on mount
  useEffect(() => {
    if (Array.isArray(babies) && babies.length > 0) {
      restoreSelectedBaby();
    }
  }, [babies]);

  const restoreSelectedBaby = async () => {
    try {
      const savedBabyId = await SecureStore.getItemAsync(APP_CONFIG.SELECTED_BABY_KEY);
      
      if (savedBabyId) {
        const baby = babies.find((b) => b._id === savedBabyId);
        if (baby) {
          setSelectedBaby(baby);
          return;
        }
      }

      // If no saved baby or baby not found, select default or first baby
      const defaultBaby = babies.find((b) => b.isDefault) || babies[0];
      if (defaultBaby) {
        selectBaby(defaultBaby);
      }
    } catch (error) {
      console.error('Error restoring selected baby:', error);
      // Fall back to default or first baby
      const defaultBaby = babies.find((b) => b.isDefault) || babies[0];
      if (defaultBaby) {
        selectBaby(defaultBaby);
      }
    }
  };

  const fetchBabies = async () => {
    try {
      console.log('[BabyContext] fetchBabies started');
      setIsLoading(true);
      setError(null);
      
      const fetchedBabies = await userService.getBabyProfiles();
      console.log('[BabyContext] fetchedBabies:', fetchedBabies);
      
      // Ensure we always set an array, even if API returns undefined
      setBabies(Array.isArray(fetchedBabies) ? fetchedBabies : []);
      
      // Auto-select default or first baby if none selected
      if (!selectedBaby && Array.isArray(fetchedBabies) && fetchedBabies.length > 0) {
        const defaultBaby = fetchedBabies.find((b) => b.isDefault) || fetchedBabies[0];
        selectBaby(defaultBaby);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch babies';
      setError(message);
      console.error('[BabyContext] Error fetching babies:', error);
      // Ensure babies is always an array, even on error
      setBabies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectBaby = (baby: BabyProfile) => {
    setSelectedBaby(baby);
    // Save to storage
    SecureStore.setItemAsync(APP_CONFIG.SELECTED_BABY_KEY, baby._id).catch((error) =>
      console.error('Error saving selected baby:', error)
    );
  };

  const createBaby = async (babyData: {
    name: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    bloodType?: string;
    allergies?: string[];
    photo?: string;
  }): Promise<BabyProfile> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newBaby = await userService.createBabyProfile(babyData);
      
      // Refresh babies list
      await fetchBabies();
      
      // Auto-select the new baby if it's the first one
      if (babies.length === 0) {
        selectBaby(newBaby);
      }
      
      return newBaby;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create baby profile';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBaby = async (
    babyId: string,
    babyData: {
      name?: string;
      dateOfBirth?: string;
      gender?: 'male' | 'female' | 'other';
      bloodType?: string;
      allergies?: string[];
      photo?: string;
    }
  ): Promise<BabyProfile> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedBaby = await userService.updateBabyProfile(babyId, babyData);
      
      // Update local state
      setBabies((prev) => prev.map((b) => (b._id === babyId ? updatedBaby : b)));
      
      // Update selected baby if it's the one being edited
      if (selectedBaby?._id === babyId) {
        setSelectedBaby(updatedBaby);
      }
      
      return updatedBaby;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update baby profile';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBaby = async (babyId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await userService.deleteBabyProfile(babyId);
      
      // Remove from local state
      setBabies((prev) => prev.filter((b) => b._id !== babyId));
      
      // If deleted baby was selected, select another one
      if (selectedBaby?._id === babyId) {
        const remainingBabies = babies.filter((b) => b._id !== babyId);
        if (remainingBabies.length > 0) {
          selectBaby(remainingBabies[0]);
        } else {
          setSelectedBaby(null);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete baby profile';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadBabyPhoto = async (babyId: string, imageUri: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { url } = await userService.uploadBabyPhoto(babyId, imageUri);
      
      // Update baby with new photo URL
      await updateBaby(babyId, { photo: url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload baby photo';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setAsDefaultBaby = async (babyId: string) => {
    try {
      setError(null);
      
      // Update in user service
      await setUserDefaultBaby(babyId);
      
      // Refresh babies to get updated isDefault flags
      await fetchBabies();
      
      // Select the default baby
      const baby = babies.find((b) => b._id === babyId);
      if (baby) {
        selectBaby(baby);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set default baby';
      setError(message);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: BabyContextType = {
    babies,
    selectedBaby,
    isLoading,
    error,
    fetchBabies,
    selectBaby,
    createBaby,
    updateBaby,
    deleteBaby,
    uploadBabyPhoto,
    setAsDefaultBaby,
    clearError,
  };

  return <BabyContext.Provider value={value}>{children}</BabyContext.Provider>;
};

export default BabyContext;
