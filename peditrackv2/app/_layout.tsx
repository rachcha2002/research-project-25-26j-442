import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import { BabyProvider } from '../src/contexts/BabyContext';

export default function RootLayout() {
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
            <Stack.Screen name="assessment" options={{ headerShown: false }} />
            <Stack.Screen name="teleconsultation" options={{ headerShown: false }} />
            <Stack.Screen name="nearby-hospitals" options={{ headerShown: false }} />
            <Stack.Screen name="nutrition-tracker" options={{ headerShown: false }} />
            <Stack.Screen name="past-data" options={{ headerShown: false }} />
          </Stack>
        </BabyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
