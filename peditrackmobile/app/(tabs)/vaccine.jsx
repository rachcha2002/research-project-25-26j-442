import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  StyleSheet,
  StatusBar,
} from "react-native";
import React, { useState, useEffect } from "react";
import { images } from "../../constants";
import { SafeAreaView } from "react-native-safe-area-context";
import MainHeader from "../../components/MainHeader";
import { Svg, Circle } from "react-native-svg";
import { useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useGlobalContext } from "../../context/GlobalProvider"; // Assuming you have a global context
import { getDocs, query, collection, where } from "firebase/firestore";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import { db } from "../../lib/firebase";
import { Colors } from "../../constants/colors";

const filePath = `${FileSystem.documentDirectory}babyProfiles.json`;

const vaccine = () => {
  const { width } = useWindowDimensions();
  const circleSize = width * 0.3;
  const { user, currentBaby } = useGlobalContext();
  const [lastCompletedVaccine, setLastCompletedVaccine] = useState(null);
  const [nextPendingVaccine, setNextPendingVaccine] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const fetchbabyProfilesFromFirestore = async () => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, "babyProfiles"),
          where("babyName", "==", currentBaby),
          where("userMail", "==", user.email)
        )
      );

      const fetchedRecords = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(fetchedRecords)
      );

      const completedVaccines =
        fetchedRecords[0]?.vaccineList?.filter(
          (vaccine) => vaccine.status === "completed"
        ) || [];
      const pendingVaccines =
        fetchedRecords[0]?.vaccineList?.filter(
          (vaccine) => vaccine.status === "pending"
        ) || [];
      const totalVaccines = fetchedRecords[0]?.vaccineList?.length || 0;

      setLastCompletedVaccine(
        completedVaccines[completedVaccines.length - 1] || null
      );
      setNextPendingVaccine(pendingVaccines[0] || null);
      setCompletionPercentage(
        totalVaccines ? (completedVaccines.length / totalVaccines) * 100 : 0
      );
    } catch (error) {
      console.error("Error fetching records from Firestore: ", error);
    }
  };

  const retrieveDataFromLocalStorage = async () => {
    try {
      const fileExists = await FileSystem.getInfoAsync(filePath);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(filePath);
        const storedRecords = JSON.parse(fileContent).filter(
          (record) =>
            record.babyName === currentBaby && record.userMail === user.email
        );

        const completedVaccines =
          storedRecords[0]?.vaccineList?.filter(
            (vaccine) => vaccine.status === "completed"
          ) || [];
        const pendingVaccines =
          storedRecords[0]?.vaccineList?.filter(
            (vaccine) => vaccine.status === "pending"
          ) || [];
        const totalVaccines = storedRecords[0]?.vaccineList?.length || 0;

        setLastCompletedVaccine(
          completedVaccines[completedVaccines.length - 1] || null
        );
        setNextPendingVaccine(pendingVaccines[0] || null);
        setCompletionPercentage(
          totalVaccines ? (completedVaccines.length / totalVaccines) * 100 : 0
        );
      }
    } catch (error) {
      console.error("Error retrieving records from local storage: ", error);
    }
  };

  const checkNetworkAndFetchRecords = async () => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      fetchbabyProfilesFromFirestore();
    } else {
      retrieveDataFromLocalStorage();
    }
  };

  useEffect(() => {
    checkNetworkAndFetchRecords();
  }, [currentBaby]);

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView className="flex-1 bg-white">
        <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" />
        <MainHeader title="Vaccination Routine" />
        <View className="flex-1 p-3 ">
          <View className="bg-white rounded-lg shadow-lg px-4 mb-2 rounded-2xl border-2 border-[#7360F2]">
            <Text className="text-lg text-[#7360F2] text-center font-bold mb-2">
              Current Progress
            </Text>
            <View className="flex-row items-center justify-between mb-1">
              <Text
                style={styles.vaccineText}
                numberOfLines={5}
                ellipsizeMode="tail"
              >
                Previous Vaccine{"\n"}
                {"\n"}
                {lastCompletedVaccine ? lastCompletedVaccine.name : "N/A"}
              </Text>
              <View className="flex-1 items-center ">
                <Svg width={circleSize} height={circleSize}>
                  <Circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={circleSize / 2 - 10}
                    stroke="#d3cdfb"
                    strokeWidth="15"
                  />
                  {/* Calculate circumference: 2 * Math.PI * radius */}
                  <Circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={circleSize / 2 - 10}
                    strokeWidth="10"
                    fill="#ffffff"
                    strokeDasharray={`${2 * Math.PI * (circleSize / 2 - 10)}`} // Circumference
                    strokeDashoffset={
                      (2 *
                        Math.PI *
                        (circleSize / 2 - 10) *
                        (100 - completionPercentage)) /
                      100
                    } // Adjust dash offset
                    strokeLinecap="round"
                    rotation="-90" // Rotate -90 degrees to start from the top
                    stroke="#776acc"
                    origin={`${circleSize / 2}, ${circleSize / 2}`}
                  />
                  <Text
                    className="inset-0 text-center text-[#7360F2] text-lg font-bold"
                    style={{ fontSize: 30, lineHeight: circleSize }}
                  >
                    {completionPercentage.toFixed(0)}%
                  </Text>
                </Svg>
              </View>
              <Text
                style={styles.vaccineText}
                numberOfLines={5}
                ellipsizeMode="tail"
              >
                Next Vaccine{"\n"}
                {"\n"}
                {nextPendingVaccine ? nextPendingVaccine.name : "N/A"}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.pcontainer}>
          <TouchableOpacity
            style={styles.pcard}
            onPress={() => router.push("vaccination/upcomingvaccinelist")}
          >
            <ImageBackground
              source={images.Upcoming}
              style={styles.pcardImage}
              resizeMode="cover"
            >
              <View style={styles.ptextContainer}>
                <Text style={styles.pcardTitle}>Upcoming{"\n"} Vaccines</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pcard}
            onPress={() => router.push("vaccination/completedvaccinelist")}
          >
            <ImageBackground
              source={images.completed}
              style={styles.pcardImage}
              resizeMode="cover"
            >
              <View style={styles.ptextContainer}>
                <Text style={styles.pcardTitle}>Completed{"\n"} Vaccines</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pcontainer: {
    width: "98%",
    marginLeft: 3,
    padding: 8,
  },
  pcard: {
    width: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 25,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pcardImage: {
    width: "100%",
    height: 190,
  },
  ptextContainer: {
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
  },
  pcardTitle: {
    height: "100%",
    fontSize: 57,
    fontWeight: "bold",
    color: "#fff",
  },
  vaccineText: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#7360F2",
    textAlign: "center",
    maxWidth: "35%", // Set max width to control space taken
    flexWrap: "wrap", // Allow text to wrap
  },
});

export default vaccine;
