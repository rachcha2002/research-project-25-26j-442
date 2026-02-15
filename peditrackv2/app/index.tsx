import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  console.log('[Index] Rendering - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  useEffect(() => {
    console.log('[Index] useEffect triggered - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('[Index] Navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('[Index] Navigating to onboarding');
        router.replace('/auth/onboarding');
      }
    }
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
