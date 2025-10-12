import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  ActivityIndicator, // Import for loading spinner
  RefreshControl, // Import for pull-to-refresh functionality
} from "react-native";
import * as FileSystem from "expo-file-system";
import { useGlobalContext } from "../../context/GlobalProvider"; // Access Global Context
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../lib/firebase"; // Firebase config
import NetInfo from "@react-native-community/netinfo";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

const filePath = `${FileSystem.documentDirectory}babyProfiles.json`;
const medicationFilePath = `${FileSystem.documentDirectory}medicationRecords.json`;
const weightFilePath = `${FileSystem.documentDirectory}weightRecords.json`;
const heightFilePath = `${FileSystem.documentDirectory}heightRecords.json`;
const circumferenceFilePath = `${FileSystem.documentDirectory}circumferenceRecords.json`;
const healthFilePath = `${FileSystem.documentDirectory}healthRecords.json`;

const BabyProfileList = () => {
  const { user, setBabies, setCurrentBaby, babies } = useGlobalContext(); // Access Global Context
  const [babyProfiles, setBabyProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true); // State for loading indicator
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh
  const navigation = useNavigation();

  // Function to update the current baby from the baby profiles
  const updateCurrentBaby = (profiles) => {
    if (profiles.length > 0) {
      const firstBabyName = profiles[0].babyName;
      setCurrentBaby(firstBabyName); // Set the first baby as current baby
    } else {
      setCurrentBaby(null); // Set to null if no profiles exist
    }
  };

  // Load profiles from local storage or Firebase
  const loadProfiles = async () => {
    setLoading(true); // Start loading spinner
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const querySnapshot = await getDocs(collection(db, "babyProfiles"));
        const profiles = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return { ...data, docId: doc.id }; // Store Firestore document ID
          })
          .filter((profile) => profile.userMail === user.email);

        setBabyProfiles(profiles);
        setBabies(profiles); // Update the global context with the fetched baby profiles
        updateCurrentBaby(profiles); // Update the current baby

        // Save profiles to local storage with the Firestore document ID
        await FileSystem.writeAsStringAsync(filePath, JSON.stringify(profiles));
      } catch (error) {
        console.error("Error loading profiles from Firestore:", error);
      }
    } else {
      // Load profiles from the local file system
      try {
        const fileExists = await FileSystem.getInfoAsync(filePath);
        if (fileExists.exists) {
          const fileContent = await FileSystem.readAsStringAsync(filePath);
          const profiles = JSON.parse(fileContent).filter(
            (profile) => profile.userMail === user.email
          );
          setBabyProfiles(profiles);
          setBabies(profiles); // Update global context
          updateCurrentBaby(profiles); // Update current baby
        }
      } catch (error) {
        console.error("Error loading profiles from local storage:", error);
      }
    }
    setLoading(false); // Stop loading spinner
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true); // Start refreshing
    await loadProfiles(); // Reload profiles and update global context
    setRefreshing(false); // Stop refreshing
  };

  // Calculate age based on birthdate
  const calculateAge = (dateOfBirth) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age;
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  // Handle profile deletion by babyName and userMail
  const handleDeleteProfile = async (babyName, userMail) => {
    const filteredProfiles = babyProfiles.filter(
      (profile) => profile.babyName !== babyName
    );
    setBabyProfiles(filteredProfiles);

    try {
      // Save updated profiles to local storage
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(filteredProfiles)
      );

      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        // Query Firestore for the document where babyName and userMail match
        const babyProfileQuery = query(
          collection(db, "babyProfiles"),
          where("babyName", "==", babyName),
          where("userMail", "==", userMail)
        );

        const querySnapshot = await getDocs(babyProfileQuery);

        if (!querySnapshot.empty) {
          // Loop through the matched documents (should ideally be only one document)
          querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref); // Delete the document
          });
          Alert.alert("Success", "Profile deleted from Firestore.");
        } else {
          Alert.alert("Error", "Profile not found in Firestore.");
        }

        // Delete all related records (weight, height, head circumference, medication, and health records)
        const relatedCollections = [
          "weight",
          "height",
          "circumference",
          "medicationRoutines",
          "healthRecords",
        ];

        for (const collectionName of relatedCollections) {
          const relatedQuery = query(
            collection(db, collectionName),
            where("babyName", "==", babyName),
            where("userMail", "==", userMail)
          );
          const relatedSnapshot = await getDocs(relatedQuery);
          relatedSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });
        }
      } else {
        Alert.alert(
          "Offline",
          "Profile deleted locally. Will sync with Firestore when online."
        );
      }

      // Delete records from local storage
      const localFilePaths = [
        medicationFilePath,
        weightFilePath,
        heightFilePath,
        circumferenceFilePath,
        healthFilePath,
      ];

      for (const path of localFilePaths) {
        const fileExists = await FileSystem.getInfoAsync(path);
        if (fileExists.exists) {
          const fileContent = await FileSystem.readAsStringAsync(path);
          const updatedRecords = JSON.parse(fileContent).filter(
            (record) =>
              record.userMail !== userMail || record.babyName !== babyName
          );
          await FileSystem.writeAsStringAsync(
            path,
            JSON.stringify(updatedRecords)
          );
        }
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      Alert.alert("Error", `Failed to delete the profile: ${error.message}`);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {loading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="#0000ff" />
            {/* Loading spinner */}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> // Pull-to-refresh functionality
            }
          >
            {babyProfiles.map((profile) => (
              <TouchableOpacity
                key={profile.babyName}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 2,
                  flexDirection: "row-reverse", // Place image on the right
                  alignItems: "center", // Align vertically center
                }}
                onPress={() => {
                  setSelectedProfile(profile);
                  setModalVisible(true); // Open modal on card click
                }}
              >
                {/* Image on the right */}
                <Image
                  source={{ uri: profile.profileImage }}
                  style={{ width: 100, height: 100, borderRadius: 10 }}
                />

                {/* Profile details and buttons on the left */}
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                    {profile.babyName}
                  </Text>
                  <Text style={{ fontSize: 16 }}>
                    Age: {calculateAge(profile.dateOfBirth)} years
                  </Text>

                  {/* Edit and Delete buttons */}
                  <View style={{ flexDirection: "row", marginTop: 10 }}>
                    <TouchableOpacity
                      style={{
                        borderWidth: 1,
                        borderColor: "blue",
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 5,
                        marginRight: 10,
                      }}
                      onPress={() => {
                        router.push({
                          pathname: "/profile/updatebabyprofile", // The path to your update screen
                          params: { profileData: profile }, // Pass the profile data directly
                        });
                      }}
                    >
                      <Text style={{ color: "blue" }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        borderWidth: 1,
                        borderColor: "red",
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 5,
                      }}
                      onPress={() =>
                        handleDeleteProfile(profile.babyName, user.email)
                      } // Pass babyName and userMail
                    >
                      <Text style={{ color: "red" }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Modal to show profile details */}
        {selectedProfile && (
          <Modal visible={modalVisible} animationType="slide">
            <View style={{ padding: 20, flex: 1, justifyContent: "center" }}>
              <Image
                source={{ uri: selectedProfile.profileImage }}
                style={{ width: 150, height: 150, borderRadius: 10 }}
              />
              <Text>Name: {selectedProfile.babyName}</Text>
              <Text>Age: {calculateAge(selectedProfile.dateOfBirth)}</Text>
              <Text>Weight: {selectedProfile.initialWeight} kg</Text>
              <Text>Height: {selectedProfile.initialHeight} cm</Text>
              <Text>
                Circumference: {selectedProfile.initialCircumference} cm
              </Text>
              <Text>Blood Group: {selectedProfile.bloodGroup}</Text>
              <Text>Birth Place: {selectedProfile.birthPlace}</Text>
              <Text>Special Remarks: {selectedProfile.specialRemarks}</Text>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  backgroundColor: "red",
                  padding: 10,
                  marginTop: 20,
                  alignItems: "center",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default BabyProfileList;
