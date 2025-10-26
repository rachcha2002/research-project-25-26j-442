import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // For picking images
import DateTimePicker from "@react-native-community/datetimepicker"; // DateTimePicker for date selection
import * as FileSystem from "expo-file-system"; // For saving data locally
import { collection, addDoc } from "firebase/firestore"; // For syncing with Firestore
import { db } from "../../lib/firebase"; // Your Firestore config
import { router } from "expo-router";

import { useGlobalContext } from "../../context/GlobalProvider";
import SubHeader from "../../components/SubScreenHeader";

const filePath = `${FileSystem.documentDirectory}healthRecords.json`; // File where records will be saved

export default function AddHealthRecordScreen() {
  const { user, currentBaby, babies } = useGlobalContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [doctor, setDoctor] = useState("");
  const [images, setImages] = useState([]); // State to store multiple images
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filter the current baby data from the babies array
  const currentBabyData = babies.find(
    (baby) => baby.babyName === currentBaby && baby.userMail === user.email
  );

  // Function to calculate the difference in months and years between two dates
  const calculateAgeDifference = (selectedDate, birthDate) => {
    const selected = new Date(selectedDate);
    const birth = new Date(birthDate);

    let years = selected.getFullYear() - birth.getFullYear();
    let months = selected.getMonth() - birth.getMonth();

    // Adjust if the current month is before the birth month
    if (months < 0) {
      years--;
      months += 12;
    }

    return years > 0 ? `${years} years ${months} months` : `${months} months`;
  };

  // Handle save logic
  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !doctor.trim()) {
      Alert.alert("Validation Error", "Please fill all required fields.");
      return;
    }

    // Check if the current baby's date of birth is available
    const dob = currentBabyData?.dateOfBirth;

    // Calculate the age difference
    const age = dob ? calculateAgeDifference(date, dob) : "Unknown";

    // Create new health record with valid fallback for undefined fields
    const newRecord = {
      title: title || "", // Ensure title is not undefined
      description: description || "", // Ensure description is not undefined
      date: date ? date.toISOString() : new Date().toISOString(), // Ensure date is not undefined
      doctor: doctor || "", // Ensure doctor is not undefined
      images: images.length > 0 ? images : [], // Ensure images is not undefined
      createdAt: new Date().toISOString(),
      age: age,
      userMail: user.email,
      babyName: currentBaby,
    };

    try {
      // Read existing records from local storage
      let records = [];
      const fileExists = await FileSystem.getInfoAsync(filePath);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(filePath);
        records = JSON.parse(fileContent);
      }

      // Add the new record
      records.push(newRecord);

      // Save the updated records to the file system
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(records));

      Alert.alert("Success", "Health record saved locally.");

      // Optionally, sync with Firestore
      syncWithFirestore(newRecord);

      // Clear form fields
      setTitle("");
      setDescription("");
      setDoctor("");
      setImages([]);
      setDate(new Date());
      router.push("/health/healthrecords");
    } catch (error) {
      console.error("Error saving health record:", error);
      Alert.alert("Error", `Failed to save the record: ${error.message}`);
    }
  };

  // Sync with Firestore
  const syncWithFirestore = async (newRecord) => {
    try {
      await addDoc(collection(db, "healthRecords"), newRecord);
      Alert.alert("Sync Success", "Record synced with Firestore.");
    } catch (error) {
      console.error("Error syncing with Firestore:", error);
      Alert.alert(
        "Sync Error",
        `Failed to sync with Firestore: ${error.message}`
      );
    }
  };

  // Handle Date Picker change
  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false); // Close the picker on Android after selection
    setDate(currentDate);
  };

  // Handle image upload (allow multiple image selection by repeating the picker)
  const handleImageUpload = async () => {
    let permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access the camera roll is required!");
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    // Log the entire pickerResult to see what it contains
    console.log("Picker Result:", pickerResult);

    // Check if the picker result has the 'uri' field inside assets
    if (
      !pickerResult.cancelled &&
      pickerResult.assets &&
      pickerResult.assets.length > 0
    ) {
      const selectedImageUri = pickerResult.assets[0].uri; // Get the image URI from assets[0]
      const selectedImages = [...images, selectedImageUri]; // Append new image URI
      setImages(selectedImages); // Update images state with the new array
      console.log("Selected images:", selectedImages); // Log the selected images
    } else {
      console.log("No image selected");
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header */}
        <SubHeader
          title="Add Health Record"
          goBackPath={"/health/healthrecords"}
        />

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Title Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Title</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 10,
                marginTop: 5,
              }}
              placeholder="Enter title"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              Description
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 10,
                height: 100,
                textAlignVertical: "top",
                marginTop: 5,
              }}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Date Picker */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Date</Text>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 10,
                marginTop: 5,
              }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ flex: 1 }}>
                {date ? date.toDateString() : "Select a date"}
              </Text>
              <Ionicons name="calendar" size={24} color="gray" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChange}
                themeVariant="dark" // Applies dark theme on both iOS and Android
                textColor="purple"
              />
            )}
          </View>

          {/* Doctor Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Doctor</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 10,
                marginTop: 5,
              }}
              placeholder="Enter doctor's name"
              value={doctor}
              onChangeText={setDoctor}
            />
          </View>

          {/* Image Upload */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              Upload Images (Optional)
            </Text>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                height: 100,
                justifyContent: "center",
                alignItems: "center",
                marginTop: 5,
                borderStyle: "dashed",
              }}
              onPress={handleImageUpload}
            >
              <Ionicons name="add-outline" size={30} color="gray" />
              <Text>Upload</Text>
            </TouchableOpacity>

            {/* Display uploaded images */}
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}
            >
              {images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={{
                    width: 80,
                    height: 80,
                    marginRight: 10,
                    marginBottom: 10,
                    borderRadius: 8,
                  }}
                />
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#7360F2",
              padding: 10,
              borderRadius: 8,
              alignItems: "center",
              marginTop: 20,
            }}
            onPress={handleSave}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              Save
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
