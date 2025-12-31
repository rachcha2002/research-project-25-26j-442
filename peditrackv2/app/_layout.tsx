import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="voice" options={{ headerShown: false }} />
      <Stack.Screen name="assessment" options={{ headerShown: false }} />
      <Stack.Screen name="teleconsultation" options={{ headerShown: false }} />
      <Stack.Screen name="nearby-hospitals" options={{ headerShown: false }} />
    </Stack>
  );
}
