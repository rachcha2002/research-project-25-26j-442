import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useGlobalContext } from "../../context/GlobalProvider";
import { icons, images } from "../../constants";
import { router } from "expo-router";
import { Colors } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import NetInfo from "@react-native-community/netinfo";

// Get screen dimensions
const { width } = Dimensions.get("window");

// Path for local storage files
const heightFilePath = `${FileSystem.documentDirectory}heightRecords.json`;
const weightFilePath = `${FileSystem.documentDirectory}weightRecords.json`;
const medicationFilePath = `${FileSystem.documentDirectory}medicationRecords.json`;

const Home = () => {
  const { user, babies, currentBaby, changeCurrentBaby } = useGlobalContext(); // Use the global context for baby selection
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [selectedBabyDetails, setSelectedBabyDetails] = useState(null);
  const [latestWeight, setLatestWeight] = useState("N/A");
  const [latestHeight, setLatestHeight] = useState("N/A");
  const [nextMedicationTime, setNextMedicationTime] = useState("N/A");
  const [nextPendingVaccine, setNextPendingVaccine] = useState(null);

  // Function to handle baby selection
  const handleSelectBaby = (babyName) => {
    changeCurrentBaby(babyName); // Change current baby in global context
    setModalVisible(false); // Close modal
  };

  useEffect(() => {
    if (currentBaby && babies.length > 0) {
      const babyDetails = babies.find((baby) => baby.babyName === currentBaby);
      const pendingVaccines =
        babyDetails?.vaccineList?.filter(
          (vaccine) => vaccine.status === "pending"
        ) || [];
        setNextPendingVaccine(pendingVaccines[0] || null);
      setSelectedBabyDetails(babyDetails);
      fetchLatestRecords();
      fetchMedicationRoutines(); // Fetch medication routines
    }
  }, [currentBaby, babies]);

  // Function to calculate age based on birthdate
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust if birthday hasn't occurred yet this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age > 0 ? `${age} years` : `${monthDiff + 12} months`;
  };

  /// Function to fetch the latest weight and height records
  const fetchLatestRecords = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      let weightRecords = [];
      let heightRecords = [];

      if (netInfo.isConnected) {
        // Fetch latest weight record from Firestore
        const weightQuery = query(
          collection(db, "weight"),
          where("userMail", "==", user.email),
          where("babyName", "==", currentBaby)
        );
        const weightSnapshot = await getDocs(weightQuery);
        weightSnapshot.forEach((doc) => {
          weightRecords.push(doc.data());
        });

        // Fetch latest height record from Firestore
        const heightQuery = query(
          collection(db, "height"),
          where("userMail", "==", user.email),
          where("babyName", "==", currentBaby)
        );
        const heightSnapshot = await getDocs(heightQuery);
        heightSnapshot.forEach((doc) => {
          heightRecords.push(doc.data());
        });

        weightRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        heightRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      // If no records from Firestore, get from local storage
      if (weightRecords.length === 0) {
        const fileExists = await FileSystem.getInfoAsync(weightFilePath);
        if (fileExists.exists) {
          const fileContent = await FileSystem.readAsStringAsync(
            weightFilePath
          );
          const localWeightRecords = JSON.parse(fileContent).filter(
            (record) =>
              record.userMail === user.email && record.babyName === currentBaby
          );
          weightRecords = localWeightRecords;
        }
      }

      if (heightRecords.length === 0) {
        const fileExists = await FileSystem.getInfoAsync(heightFilePath);
        if (fileExists.exists) {
          const fileContent = await FileSystem.readAsStringAsync(
            heightFilePath
          );
          const localHeightRecords = JSON.parse(fileContent).filter(
            (record) =>
              record.userMail === user.email && record.babyName === currentBaby
          );
          heightRecords = localHeightRecords;
        }
      }

      // Set latest weight and height
      if (weightRecords.length > 0) {
        weightRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        setLatestWeight(`${weightRecords[0].weight} kg`);
      } else {
        setLatestWeight("N/A");
      }

      if (heightRecords.length > 0) {
        heightRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        setLatestHeight(`${heightRecords[0].height} cm`);
      } else {
        setLatestHeight("N/A");
      }
    } catch (error) {
      console.error("Error fetching latest records: ", error);
      Alert.alert("Error", "Failed to fetch latest records.");
    }
  };

  //Fetch Next Medication Time
  const fetchMedicationRoutines = async () => {
    let localRecords = [];
    let medicationRecords = [];

    try {
      const fileExists = await FileSystem.getInfoAsync(medicationFilePath);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(
          medicationFilePath
        );
        localRecords = JSON.parse(fileContent).filter(
          (record) =>
            record.userMail === user.email && record.babyName === currentBaby
        );
      }

      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const medicationQuery = query(
          collection(db, "medicationRoutines"),
          where("userMail", "==", user.email),
          where("babyName", "==", currentBaby)
        );
        const querySnapshot = await getDocs(medicationQuery);
        const firebaseRecords = querySnapshot.docs.map((doc) => doc.data());

        // Merge Firebase and local records
        medicationRecords = [...localRecords, ...firebaseRecords].filter(
          (v, i, a) => a.findIndex((t) => t.ID === v.ID) === i // Remove duplicates by ID
        );
      } else {
        medicationRecords = localRecords;
      }

      // Find and set the next medication time
      setNextMedicationTime(getNextDoseTime(medicationRecords));
    } catch (error) {
      console.error("Error fetching medication routines: ", error);
      Alert.alert("Error", "Failed to fetch medication routines.");
    }
  };

  const getNextDoseTime = (medicationRecords) => {
    if (!medicationRecords || medicationRecords.length === 0)
      return "No upcoming doses";

    const currentTime = new Date();
    const futureTimes = medicationRecords
      .flatMap((medication) => medication.routine)
      .map((time) => new Date(time.dateAndTime))
      .filter((time) => time > currentTime);

    if (futureTimes.length === 0) return "No upcoming doses";

    const nextDoseTime = futureTimes.reduce((prev, curr) =>
      curr < prev ? curr : prev
    );

    return formatDateTime(nextDoseTime);
  };

  // Helper function to format date and time
  const formatDateTime = (date) => {
    const options = { day: "2-digit", month: "short", year: "numeric" };
    const formattedDate = date.toLocaleDateString("en-GB", options);
    const formattedTime = date
      .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      .replace(":", ".");

    return `${formattedDate} ${formattedTime}`;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="bg-white h-full">
        <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" />
        <View
          style={{
            padding: 10,
            backgroundColor: Colors.PRIMARY,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            flexDirection: "column",
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Image
              source={images.peditracklogo} // Replace with the correct path for your logo
              style={{
                width: 140,
                height: 40,
              }}
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => {
                router.push("/profile/profilescreen");
              }}
            >
              <Image
                source={{ uri: user?.imageUrl }}
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: 50,
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Baby Selection Dropdown and Bell Icon Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginLeft: 5,
              marginTop: 10,
            }}
          >
            <View>
              <Text className="text-2xl font-psemibold text-white">
                {user?.name}
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
                onPress={() => setModalVisible(true)} // Open modal on press
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  {currentBaby ? currentBaby : "No Baby Selected"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Baby Health & Growth Card with Image Background */}
        <View className="rounded-3xl overflow-hidden m-4 mt-4">
          <ImageBackground
            source={images.home1} // Adjust image path
            style={{ width: "100%", height: 180, justifyContent: "flex-end" }}
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
              <Text style={{ color: "#fff", fontSize: 25, fontWeight: "bold" }}>
                Plan Every Step Your
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 25,
                  fontWeight: "bold",
                  marginTop: 4,
                }}
              >
                Child's Care
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View
          className="bg-white rounded-lg p-4 shadow-lg w-11/12 self-center mt-2"
          style={styles.elevation}
        >
          <View className="flex-row items-center">
            {/* Baby Image */}
            <Image
              source={{
                uri:
                  selectedBabyDetails?.profileImage ||
                  "https://www.example.com/baby.jpg", // Replace with actual image URL
              }}
              className="w-28 h-28 rounded-md mr-4"
            />

            {/* Baby Info */}
            <View className="ml-3">
              <Text className="text-lg font-bold text-[#6256B1]">
                {currentBaby || "No Baby Selected"}
              </Text>
              <View className="flex-row mt-2">
                <Text className="font-bold">Age:</Text>
                <Text className="ml-2">
                  {calculateAge(selectedBabyDetails?.dateOfBirth)}
                </Text>
              </View>
              <View className="flex-row mt-2">
                <Text className="font-bold">Weight:</Text>
                <Text className="ml-2">{latestWeight}</Text>
              </View>
              <View className="flex-row mt-2">
                <Text className="font-bold">Height:</Text>
                <Text className="ml-2">{latestHeight}</Text>
              </View>
            </View>
          </View>

          {/* Next Vaccination */}
          <Text className="mt-4">
            <Text className="font-bold">Next Vaccination: </Text>
            <Text className="ml-2"> {nextPendingVaccine ? nextPendingVaccine.dueDate : "N/A"}{"\n"} {nextPendingVaccine ? nextPendingVaccine.name : "N/A"}</Text>
          </Text>

          {/* Feedings */}
          <Text className="mt-2">
            <Text className="font-bold text-lg">Feedings</Text>
          </Text>
          <Text>
            <Text className="font-bold">Next Feeding Time:</Text>
            <Text className="ml-2">10.00 AM Smashed Fruit</Text>
          </Text>

          {/* Health */}
          <Text className="mt-2">
            <Text className="font-bold text-lg">Health</Text>
          </Text>

          <View className="flex-row">
            <Text className="font-bold">Next Medication Time:</Text>
            <Text className="ml-2">{nextMedicationTime}</Text>
          </View>
        </View>

        {/* Modal for Baby Selection */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)} // Close modal when back button is pressed
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Baby</Text>
              <FlatList
                data={babies}
                keyExtractor={(item) => item.babyName}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.babyItem}
                    onPress={() => handleSelectBaby(item.babyName)} // Set the selected baby
                  >
                    <Text style={styles.babyItemText}>{item.babyName}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                onPress={() => setModalVisible(false)} // Close the modal
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* First Row with Three Cards */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 5,
          }}
        >
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push("/health/healthrecords");
            }}
          >
            <Image
              source={images.recordsicon} // Adjust image path
              style={{ width: 50, height: 50 }}
            />
            <Text style={{ color: "black", marginTop: 5 }}>Health Records</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => {
             router.push("/feeding/mealplanner");
            }}
          >
            <Image
              source={images.feedingHome} // Adjust image path
              style={{ width: 50, height: 50 }}
            />
            <Text style={{ color: "black", marginTop: 5 }}>Meal Planner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => {

              router.push("/vaccination/upcomingvaccinelist");
            }}
          >
            <Image
              source={images.VaccineAccess} // Adjust image path
              style={{ width: 50, height: 50 }}
            />
            <Text style={{ color: "black", marginTop: 5 }}>
              Vaccine Log
            </Text>

          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// Styles for modal and cards
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    width: width * 0.27, // Cards will take up about 27% of the screen width
    height: width * 0.27, // Square cards
    margin: 10, // Add margin between cards
  },
  elevation: {
    elevation: 8, // Add elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: 300,
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  babyItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  babyItemText: {
    fontSize: 16,
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: Colors.PRIMARY,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Home;
