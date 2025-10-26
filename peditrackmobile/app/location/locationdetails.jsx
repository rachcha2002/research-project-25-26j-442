import { View, Text } from "react-native";
import React,{  useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { useSearchParams } from "expo-router";
import Locationdetail_Item from "../location/locationdetail_Item";

export default function Locationdetails({ route }) {
  try {
    // Check if route and route.params exist to avoid undefined errors
    if (!route || !route.params) {
      throw new Error(
        "Route or route.params is undefined. Check the navigation flow."
      );
    }

    // Destructure place from route.params
    const { place } = route.params;

    // Log the place details inside useEffect
    useEffect(() => {
      if (place) {
        console.log("Place object:", place);
      } else {
        throw new Error("Place object is undefined or null.");
      }
    }, [place]);

    return (
      <View style={{ padding: 20, flex: 1, backgroundColor: "white" }}>
        <Locationdetail_Item place={place} />
      </View>
    );
  } catch (error) {
    // Log the error to the console and display a message on the screen
    console.log("Error in Locationdetails component:", error.message);
    return (
      <View>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }
}
