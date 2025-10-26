import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system"; // For local file system
import NetInfo from "@react-native-community/netinfo"; // To check network status
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SubHeader from "../../components/SubScreenHeader";
import { useGlobalContext } from "../../context/GlobalProvider";
import { images } from "../../constants"; // Assuming you have images like profile photo and logo
import { router } from "expo-router";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore"; // Firestore functions
import { db } from "../../lib/firebase"; // Firebase configuration
import ImageViewer from "react-native-image-zoom-viewer"; // Importing image zoom viewer

const filePath = `${FileSystem.documentDirectory}healthRecords.json`; // Path for local storage

export default function HealthRecordsScreen() {
  const { user, currentBaby, babies } = useGlobalContext(); // Access the user, current baby, and babies from Global Context
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null); // Track selected record
  const [records, setRecords] = useState([]); // State to store fetched records
  const [zoomModalVisible, setZoomModalVisible] = useState(false); // State for zoom modal
  const [zoomImages, setZoomImages] = useState([]); // State to store images for zoom view

  // Filter the current baby data from the babies array
  const currentBabyData = babies.find(
    (baby) => baby.babyName === currentBaby && baby.userMail === user.email
  );

  // Fetch health records from Firestore for the current baby and user email
  const fetchHealthRecordsFromFirestore = async () => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, "healthRecords"),
          where("babyName", "==", currentBaby), // Filter by current baby name
          where("userMail", "==", user.email) // Filter by user email
        )
      );

      const fetchedRecords = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Save the fetched records to local storage
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(fetchedRecords)
      );

      setRecords(fetchedRecords); // Update state with fetched records
    } catch (error) {
      console.error("Error fetching records from Firestore: ", error);
    }
  };

  // Retrieve data from local storage and filter by current baby and user email
  const retrieveDataFromLocalStorage = async () => {
    try {
      const fileExists = await FileSystem.getInfoAsync(filePath);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(filePath);
        const storedRecords = JSON.parse(fileContent).filter(
          (record) =>
            record.babyName === currentBaby && record.userMail === user.email
        );
        setRecords(storedRecords); // Set records from local storage
      } else {
        console.log("No records found in local storage.");
      }
    } catch (error) {
      console.error("Error retrieving records from local storage: ", error);
    }
  };

  // Check network connectivity and decide whether to fetch from Firestore or local storage
  const checkNetworkAndFetchRecords = async () => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      console.log("Online: Fetching data from Firestore.");
      fetchHealthRecordsFromFirestore(); // Fetch from Firestore if connected
    } else {
      console.log("Offline: Retrieving data from local storage.");
      retrieveDataFromLocalStorage(); // Fetch from local storage if offline
    }
  };

  useEffect(() => {
    checkNetworkAndFetchRecords(); // Check network and fetch data accordingly
  }, [currentBaby]); // Re-fetch data if the current baby changes

  // Refresh function to refresh the records
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      checkNetworkAndFetchRecords(); // Fetch data again based on network status
      setRefreshing(false);
    }, 2000);
  };

  // Delete record locally and in Firebase
  const deleteRecord = async (recordId) => {
    const updatedRecords = records.filter((record) => record.id !== recordId);
    setRecords(updatedRecords); // Update the local state

    // Save updated records to local storage
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(updatedRecords)
    );

    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        await deleteDoc(doc(db, "healthRecords", recordId)); // Delete from Firebase
        Alert.alert("Success", "Record deleted successfully.");
      } catch (error) {
        console.error("Error deleting record from Firestore: ", error);
      }
    } else {
      Alert.alert(
        "Offline",
        "Record deleted locally. It will be deleted from Firebase when you are online."
      );
    }

    closeModal(); // Close modal after deletion
  };

  // Open modal with selected record
  const openModal = (record) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  // Close modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedRecord(null);
  };

  // Open zoom modal
  const openZoomModal = (images) => {
    const formattedImages = images.map((img) => ({ url: img })); // Format images for ImageViewer
    setZoomImages(formattedImages);
    setZoomModalVisible(true);
  };

  // Sort records based on createdAt field (if available)
  const sortedRecords = records
    ? [...records].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <SubHeader title="Health Records" goBackPath={"/health"} />

        <View style={{ flex: 1 }}>
          {/* ScrollView with refresh control */}
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Basic Information Section */}
            <View className="p-4 bg-white rounded-lg ml-3 mr-3 mt-2 shadow-xl shadow-black elevation-8">
              <Text className="text-xl font-bold mb-1 text-[#6256B1]">
                Basic Information
              </Text>
              {currentBabyData ? (
                <View>
                  <View className="flex-row">
                    <Image
                      source={{ uri: currentBabyData.profileImage }}
                      className="w-36 h-36 rounded-lg mr-4"
                    />
                    <View>
                      <Text className="text-lg">
                        <Text className="font-bold">Name:</Text>{" "}
                        {currentBabyData.babyName}
                      </Text>
                      <Text className="text-lg">
                        <Text className="font-bold">DOB:</Text>{" "}
                        {new Date(
                          currentBabyData.dateOfBirth
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </Text>

                      <Text className="text-lg">
                        <Text className="font-bold">Initial Weight:</Text>{" "}
                        {currentBabyData.initialWeight}kg
                      </Text>
                      <Text className="text-lg">
                        <Text className="font-bold">Blood Group:</Text>{" "}
                        {currentBabyData.bloodGroup}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-column">
                    <Text className="text-lg">
                      <Text className="font-bold">Initial Height:</Text>{" "}
                      {currentBabyData.initialHeight}cm
                    </Text>
                    <Text className="text-lg">
                      <Text className="font-bold">Initial Circumference:</Text>{" "}
                      {currentBabyData.initialCircumference}cm
                    </Text>
                    <Text className="text-lg">
                      <Text className="font-bold">Current Age:</Text> 12 months
                    </Text>
                    <Text className="text-lg">
                      <Text className="font-bold">Birth Place:</Text>{" "}
                      {currentBabyData.birthPlace}
                    </Text>
                    <Text className="text-lg font-bold">Special Remarks:</Text>
                    <View className="pl-4">
                      <View className="flex-row items-center">
                        <Text className="text-lg">•</Text>
                        <Text className="text-lg ml-2">
                          {currentBabyData.specialRemarks}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <Text>No baby information available</Text>
              )}
            </View>

            {/* Records Section */}
            <View className="p-4">
              <Text className="text-xl font-bold mb-2 text-[#6256B1]">
                Records
              </Text>

              {sortedRecords.length > 0 ? (
                sortedRecords.map((record) => (
                  <TouchableOpacity
                    key={record.id}
                    onPress={() => openModal(record)} // Open modal when a record is pressed
                  >
                    <View className="bg-white rounded-lg shadow-xl shadow-black elevation-8 p-2 mb-4">
                      <View className="flex-row justify-between">
                        <Text className="text-lg font-bold">
                          {record.title}
                        </Text>
                        <Text className="text-sm text-gray-600 mt-2">
                          {new Date(record.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </Text>
                      </View>
                      <Text className="text-md text-gray-600">
                        {record.description}
                      </Text>
                      <Text className="text-md text-gray-600">
                        {record.age}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text>No records found</Text>
              )}
            </View>
          </ScrollView>

          {/* Modal to display record details */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            >
              <View
                style={{
                  backgroundColor: "white",
                  padding: 20,
                  borderRadius: 10,
                  width: "80%",
                  position: "relative",
                }}
              >
                <TouchableWithoutFeedback onPress={closeModal}>
                  <Ionicons
                    name="close"
                    size={24}
                    color="black"
                    style={{ position: "absolute", top: 10, right: 10 }}
                  />
                </TouchableWithoutFeedback>

                {selectedRecord && (
                  <>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "bold",
                        marginBottom: 8,
                      }}
                    >
                      {selectedRecord.title}
                    </Text>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                        Description:
                      </Text>
                      <Text style={{ fontSize: 16 }}>
                        {selectedRecord.description}
                      </Text>
                    </View>

                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                        Age:
                      </Text>
                      <Text style={{ fontSize: 16 }}>{selectedRecord.age}</Text>
                    </View>

                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                        Date:
                      </Text>
                      <Text style={{ fontSize: 16 }}>
                        {new Date(selectedRecord.date).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          }
                        )}
                      </Text>
                    </View>

                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                        Doctor:
                      </Text>
                      <Text style={{ fontSize: 16 }}>
                        Dr.{selectedRecord.doctor}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 16,
                        marginBottom: 6,
                        fontWeight: "bold",
                      }}
                    >
                      Related Documents:
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {selectedRecord.images &&
                      selectedRecord.images.length > 0 ? (
                        selectedRecord.images.map((doc, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => openZoomModal(selectedRecord.images)}
                          >
                            <Image
                              source={{ uri: doc }}
                              style={{
                                width: 80,
                                height: 80,
                                marginRight: 10,
                                marginBottom: 10,
                                borderRadius: 5,
                              }}
                            />
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text>No related documents found.</Text>
                      )}
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: "red",
                        padding: 10,
                        borderRadius: 8,
                        alignItems: "center",
                        marginTop: 20,
                      }}
                      onPress={() => deleteRecord(selectedRecord.id)}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 18,
                          fontWeight: "bold",
                        }}
                      >
                        Delete Record
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>

          {/* Zoom Modal for full-screen image view */}
          <Modal
            visible={zoomModalVisible}
            transparent={true}
            onRequestClose={() => setZoomModalVisible(false)}
          >
            <ImageViewer
              imageUrls={zoomImages} // Array of images to be displayed
              enableSwipeDown={true}
              onSwipeDown={() => setZoomModalVisible(false)} // Close on swipe down
            />
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 40,
                right: 20,
              }}
              onPress={() => setZoomModalVisible(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </Modal>

          {/* "Add New Record" Button */}
          <TouchableOpacity
            className="bg-[#6256B1] py-1 rounded-md items-center"
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
            }}
            onPress={() => {
              router.push("/health/healthrecordform");
            }}
          >
            <Text className="text-white text-lg font-bold">Add New Record</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
