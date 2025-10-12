import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import WeightGrowthComponent from "./WeightGrowthComponent";
import HeightGrowthComponent from "./HeightGrowthComponent";
import HeadCircumferenceGrowthComponent from "./HeadCircumferenceGrowthComponent";
import SubHeader from "../../components/SubScreenHeader";
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GrowthMilestonesScreen() {
  const [selectedTab, setSelectedTab] = useState("Weight");

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        <SubHeader title="Growth Milestones" goBackPath={"/health"} />
        <ScrollView contentContainerStyle={styles.container}>
          {/* Tab Buttons */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "Weight" && styles.activeTab,
              ]}
              onPress={() => setSelectedTab("Weight")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "Weight" && styles.activeTabText,
                ]}
              >
                Weight
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "Height" && styles.activeTab,
              ]}
              onPress={() => setSelectedTab("Height")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "Height" && styles.activeTabText,
                ]}
              >
                Height
              </Text>
            </TouchableOpacity>

            {/* Add a button for Head Circumference */}
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "HeadCircumference" && styles.activeTab,
              ]}
              onPress={() => setSelectedTab("HeadCircumference")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "HeadCircumference" && styles.activeTabText,
                ]}
              >
                Head Circumference
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1 mt-4">
            {/* Render the appropriate component based on the selected tab */}
            {selectedTab === "Weight" && <WeightGrowthComponent />}
            {selectedTab === "Height" && <HeightGrowthComponent />}
            {selectedTab === "HeadCircumference" && (
              <HeadCircumferenceGrowthComponent />
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.bmiButton}
          onPress={() => {
            router.push("/health/bmiscreen");
          }}
        >
          <Text style={styles.bmiButtonText}>BMI Calculator</Text>
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
