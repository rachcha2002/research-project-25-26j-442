import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  console.log('[Index] Rendering - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      console.log('[Index] useEffect triggered - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
      if (!isLoading) {
        if (isAuthenticated) {
          console.log('[Index] Navigating to tabs');
          router.replace('/(tabs)');
        } else {
          // Check if user has completed onboarding
          try {
            const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
            if (hasCompletedOnboarding === 'true') {
              console.log('[Index] Returning user - Navigating to login');
              router.replace('/auth/login');
            } else {
              console.log('[Index] New user - Navigating to onboarding');
              router.replace('/auth/onboarding');
            }
          } catch (error) {
            console.error('[Index] Error checking onboarding status:', error);
            // Default to onboarding on error
            router.replace('/auth/onboarding');
          }
        }
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    console.log('[Index] Showing loading indicator');
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={{ marginTop: 20, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  console.log('[Index] Returning null');
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background to distinguish from purple
  },
});
