import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
      <Stack.Screen name="baby-profiles" options={{ headerShown: false }} />
      <Stack.Screen name="add-baby" options={{ headerShown: false }} />
      <Stack.Screen name="edit-baby" options={{ headerShown: false }} />
    </Stack>
  );
}
