import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import { BabyProvider } from '../src/contexts/BabyContext';
import { requestPushPermissionsAsync } from '../src/services/pushNotificationService';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go'
]);

export default function RootLayout() {
  React.useEffect(() => {
    // Request push notification permissions on app launch
    requestPushPermissionsAsync();
  }, []);
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BabyProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="chat" options={{ headerShown: false }} />
            <Stack.Screen name="voice" options={{ headerShown: false }} />
            <Stack.Screen name="emergency-response/emergency-response" options={{ headerShown: false }} />
            <Stack.Screen name="emergency-response/assessment" options={{ headerShown: false }} />
            <Stack.Screen name="emergency-response/assessment-result" options={{ headerShown: false }} />
            <Stack.Screen name="emergency-response/teleconsultation" options={{ headerShown: false }} />
            <Stack.Screen name="emergency-response/nearby-hospitals" options={{ headerShown: false }} />
            <Stack.Screen name="emergency-response/videocall-screen" options={{ headerShown: false }} />
            <Stack.Screen name="emergency-response/assesment-report" options={{ headerShown: false }} />
            <Stack.Screen name="nutrition-tracker" options={{ headerShown: false }} />
            <Stack.Screen name="past-data" options={{ headerShown: false }} />
          </Stack>
        </BabyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
