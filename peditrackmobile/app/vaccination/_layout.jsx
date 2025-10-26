import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";


const feedingLayout = () => {
  return (
    <>
      
      <Stack>
        <Stack.Screen
          name="upcomingvaccinelist"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="completedvaccinelist"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
        name="upcomingvaccinedetails"
        options={{
          headerShown: false,
        }}
      />
        <Stack.Screen
          name="completedvaccinedetails"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="vaccinecompletionform"
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
