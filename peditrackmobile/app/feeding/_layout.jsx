import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const feedingLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="tips"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="tipsmeat"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="mealreminder"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="breastfeedplanner"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="tipssnacks"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="tipscomplementary"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="tipsillnessfeeding"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="mealbank"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="[mealid]"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="mealplanner"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="setreminder"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <StatusBar backgroundColor="#f3f6f4" style="dark" />
    </>
  );
};

export default feedingLayout;
