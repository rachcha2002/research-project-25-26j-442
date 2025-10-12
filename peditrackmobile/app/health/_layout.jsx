import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const babyHealthLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="healthrecords"
          options={{
            headerShown: false,
          }}
        />
        
        <Stack.Screen
          name="medicationroutines"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="healthrecordform"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="medicationdetails"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="medicationform"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="growthmilestones"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="bmiscreen"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <StatusBar backgroundColor="#f3f6f4" style="dark" />
    </>
  );
};

export default babyHealthLayout;
