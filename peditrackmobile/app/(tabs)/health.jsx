import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ImageBackground,
  StyleSheet,
  Dimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/MainHeader";
import { Colors } from "../../constants/colors";
import { useRouter } from "expo-router";
import { images } from "../../constants";

// Get screen dimensions
const { width } = Dimensions.get("window");

const babyhealth = () => {
  const router = useRouter();
  return (
    <SafeAreaView className="bg-white h-full">
      {/* Set Status Bar Color and Text/Icons Color */}
      <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" />
      <Header title="Baby Health & Growth" />

      {/* Scrollable content for Baby Health UI */}
      <ScrollView className="px-4 my-6">
        {/* Baby Health & Growth Card with Image Background */}
        <View className="rounded-3xl overflow-hidden">
          <ImageBackground
            source={images.babyhealth} // Adjust image path
            style={{ width: "100%", height: 240, justifyContent: "flex-end" }}
          >
            {/* Dark overlay */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
              }}
            />

            {/* Text positioned at bottom-left */}
            <View style={{ padding: 16 }}>
              <Text style={{ color: "#fff", fontSize: 30, fontWeight: "bold" }}>
                Baby Health & Growth
              </Text>
              <Text style={{ color: "#fff", fontSize: 16, marginTop: 4 }}>
                Every tiny step is a big milestone in a baby’s journey toward
                health and growth
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Health, Growth & Medications Section */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginTop: 20,
            marginBottom: 4,
            color: Colors.PRIMARY,
          }}
        >
          Health, Growth & Medications
        </Text>

        {/* First Row with two cards */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            padding: 5,
            marginTop: 5,
          }}
        >
          {/* Health Record Card*/}
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push("/health/healthrecords");
            }}
          >
            <Image
              source={images.recordsicon}
              style={{ width: 74, height: 74 }}
            />
            <Text style={{ color: "black", marginTop: 8 }}>Health Records</Text>
          </TouchableOpacity>

          {/* Growth Milestones Card*/}
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push("/health/growthmilestones");
            }}
          >
            <Image
              source={images.growthicon}
              style={{ width: 74, height: 74 }}
            />
            <Text style={{ color: "black", marginTop: 8 }}>
              Growth Milestones
            </Text>
          </TouchableOpacity>
        </View>
        {/* Second Row with the centered "Medication Routines" card */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            width: "100%",
            marginTop: 10,
          }}
        >
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push("/health/medicationroutines");
            }}
          >
            <Image
              source={images.medicationicon}
              style={{ width: 74, height: 74, marginTop: 5 }}
            />
            <Text style={{ color: "black", marginTop: 5, textAlign: "center" }}>
              Medication Routines
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles with dynamic width and height for responsive design
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    width: width * 0.42, // Cards will take up about 42% of the screen width
    height: width * 0.32, // Adjust card height proportionally based on width
    marginBottom: 10, // Add margin between rows
  },
});

export default babyhealth;
