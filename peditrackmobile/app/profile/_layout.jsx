import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const babyProfileLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="babyprofileform"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="updatebabyprofile"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profilescreen"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
          }}
        />
        
      </Stack>

      <StatusBar backgroundColor="#f3f6f4" style="dark" />
    </>
  );
};

export default babyProfileLayout;
