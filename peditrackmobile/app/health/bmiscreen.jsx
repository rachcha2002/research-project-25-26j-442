import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import BMICalculator from "./BMIComponent";

import SubHeader from "../../components/SubScreenHeader";
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BMIScreen() {
  const [selectedTab, setSelectedTab] = useState("Weight");

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        <SubHeader title="BMI Calculator" goBackPath={"/health/growthmilestones"} />
        <ScrollView contentContainerStyle={styles.container}>
            <BMICalculator />
          
          
        </ScrollView>

        <TouchableOpacity
          style={styles.bmiButton}
          onPress={() => {
            router.push("/health/growthmilestones");
          }}
        >
          <Text style={styles.bmiButtonText}>Growth Milestones</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 10,
  },
  activeTab: {
    backgroundColor: "#EAE6F5",
  },
  tabText: {
    color: "#000",
    fontSize: 16,
  },
  activeTabText: {
    color: "#6256B1",
  },
  bmiButton: {
    backgroundColor: "#6256B1",
    padding: 5,
    borderRadius: 10,
    alignItems: "center",
    margin: 20,
  },
  bmiButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
