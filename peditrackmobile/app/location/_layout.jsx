import { View, Text } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import LocationList from "../location/LocationList";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";

const isAndroid =true;
const Stack = createStackNavigator();

const locationLayout = () => {
  return (
    <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: true,
        ...(isAndroid && TransitionPresets.ModalPresentationIOS),
      }}
    >
      <Stack.Screen
        name="LocationList" // Name the list screen properly
        component={LocationList} // Add your LocationList component here
        options={{
          headerShown: true, // Show header for the list
        }}
      />
    </Stack.Navigator>

    <StatusBar backgroundColor="#f3f6f4" style="dark" />
  </NavigationContainer>
  );
};

export default locationLayout;
