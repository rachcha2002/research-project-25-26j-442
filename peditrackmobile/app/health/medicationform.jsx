import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useGlobalContext } from "../../context/GlobalProvider";
import SubHeader from "../../components/SubScreenHeader";
import uuid from "react-native-uuid"; // Import react-native-uuid
import { router } from "expo-router";

const medicationFilePath = `${FileSystem.documentDirectory}medicationRecords.json`;

export default function AddMedicationRoutineScreen() {
  const { currentBaby, user } = useGlobalContext();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dose: "",
    instruction: "",
    doctor: "",
    doctorContact: "",
    intervalDuration: "",
    startDate: new Date(),
    endDate: new Date(),
  });
  const [selectedImage, setSelectedImage] = useState(null); // Single image state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false); // Loader state

  // Date Picker for Android
  const showDatePicker = (field) => {
    DateTimePickerAndroid.open({
      value: formData[field],
      mode: "date",
      onChange: (event, selectedDate) => {
        if (event.type === "set") {
          const currentDate = selectedDate || formData[field];
          setFormData({ ...formData, [field]: currentDate });

          DateTimePickerAndroid.open({
            value: currentDate,
            mode: "time",
            is24Hour: true,
            onChange: (event, selectedTime) => {
              if (event.type === "set") {
                const finalDate = new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  currentDate.getDate(),
                  selectedTime.getHours(),
                  selectedTime.getMinutes()
                );
                setFormData({ ...formData, [field]: finalDate });
              }
            },
          });
        }
      },
    });
  };

  // iOS Date Picker handler
  const handleDateChange = (event, selectedDate, field) => {
    if (Platform.OS === "android") return;
    const currentDate = selectedDate || formData[field];
    setFormData({ ...formData, [field]: currentDate });
  };

  // Format date and time
  const formatDate = (date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Doctor contact validation (10 digits)
  const validateDoctorContact = (text) => {
    if (/^\d{0,10}$/.test(text)) {
      setFormData({ ...formData, doctorContact: text });
    } else {
      Alert.alert("Invalid Input", "Doctor Contact must be a 10-digit number.");
    }
  };

  // Dose validation (only allow numbers)
  const validateDose = (text) => {
    if (/^\d*\.?\d*$/.test(text)) {
      setFormData({ ...formData, dose: text });
    } else {
      Alert.alert("Invalid Input", "Dose must be a valid float number.");
    }
  };

  // Image picker handler (limit to one image)
  const pickImage = async () => {
    let result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (result.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access gallery is required."
      );
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      const imageUri = pickerResult.assets[0].uri;
      setSelectedImage(imageUri); // Set the selected image (replacing any previous one)
    }
  };

  // Routine generator based on the interval duration
  const generateRoutine = (startDate, endDate, intervalHours) => {
    let routines = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    const intervalMilliseconds = intervalHours * 60 * 60 * 1000;

    while (currentDate <= end) {
      let dateAndTime = new Date(currentDate); // Keep only dateAndTime

      routines.push({
        uniqueId: uuid.v4(), // Use react-native-uuid to generate unique ID
        dateAndTime: dateAndTime.toISOString(), // Only keep the dateAndTime field
      });

      currentDate = new Date(currentDate.getTime() + intervalMilliseconds);
    }

    return routines;
  };

  // Save data to local storage and Firestore
  const handleSave = async () => {
    if (
      !formData.title.trim() ||
      !formData.dose ||
      !formData.intervalDuration
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true); // Show loader

    try {
      let imageUri = selectedImage;

      // Save image to local storage
      if (selectedImage) {
        const imageName = selectedImage.split("/").pop();
        const newPath = `${FileSystem.documentDirectory}${imageName}`;
        await FileSystem.copyAsync({
          from: selectedImage,
          to: newPath,
        });
        imageUri = newPath; // Save the local URI
      }

      // Generate the routine
      const routine = generateRoutine(
        formData.startDate,
        formData.endDate,
        formData.intervalDuration
      );

      // Generate a unique ID for the record
      const uniqueId = uuid.v4();

      // Create the medication record
      const newRecord = {
        ID: uniqueId, // Add the unique ID to the record
        babyName: currentBaby,
        userMail: user.email,
        ...formData,
        imageUri, // Local image URI
        routine, // Generated routine
      };

      // Save to local storage
      let localRecords = [];
      const fileExists = await FileSystem.getInfoAsync(medicationFilePath);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(
          medicationFilePath
        );
        localRecords = JSON.parse(fileContent);
      }
      localRecords.push(newRecord);
      await FileSystem.writeAsStringAsync(
        medicationFilePath,
        JSON.stringify(localRecords)
      );

      // Save to Firestore
      await addDoc(collection(db, "medicationRoutines"), newRecord);

      Alert.alert(
        "Success",
        "Routine saved locally and synced with Firestore."
      );
    } catch (error) {
      console.error("Error saving routine:", error);
      Alert.alert("Error", `Failed to save the routine: ${error.message}`);
    } finally {
      setLoading(false); // Hide loader
      router.push("/health/medicationroutines"); // Navigate back to the list
    }
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        <SubHeader
          title="Add New Medication Routine"
          goBackPath={"/health/medicationroutines"}
        />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Loader */}
          {loading && <ActivityIndicator size="large" color="#7360F2" />}

          {/* Form Fields */}
          <View className="mb-4">
            <Text className="text-lg mb-2">Title</Text>
            <TextInput
              className="border border-gray-400 rounded-lg p-3"
              placeholder="Enter title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          <View className="mb-4">
            <Text className="text-lg mb-2">Description</Text>
            <TextInput
              className="border border-gray-400 rounded-lg p-3"
              placeholder="Enter description"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
            />
          </View>

          <View className="mb-4">
            <Text className="text-lg mb-2">Dose (ml or mg)</Text>
            <TextInput
              className="border border-gray-400 rounded-lg p-3"
              placeholder="Enter dose"
              value={formData.dose}
              keyboardType="decimal-pad"
              onChangeText={validateDose}
            />
          </View>

          <View className="mb-4">
            <Text className="text-lg mb-2">Instruction</Text>
            <TextInput
              className="border border-gray-400 rounded-lg p-3"
              placeholder="Enter instruction"
              multiline
              numberOfLines={4}
              value={formData.instruction}
              onChangeText={(text) =>
                setFormData({ ...formData, instruction: text })
              }
            />
          </View>

          <View className="mb-4">
            <Text className="text-lg mb-2">Doctor</Text>
            <TextInput
              className="border border-gray-400 rounded-lg p-3"
              placeholder="Enter doctor name"
              value={formData.doctor}
              onChangeText={(text) =>
                setFormData({ ...formData, doctor: text })
              }
            />
          </View>

          <View className="mb-4">
            <Text className="text-lg mb-2">Doctor Contact (10 Digits)</Text>
            <TextInput
              className="border border-gray-400 rounded-lg p-3"
              placeholder="Enter doctor contact"
              keyboardType="phone-pad"
              value={formData.doctorContact}
              onChangeText={validateDoctorContact}
            />
          </View>

          <View className="mb-4">
            <Text className="text-lg mb-2">Interval Duration (Hours)</Text>
            <TextInput
              className="border border-gray-400 rounded-lg p-3"
              placeholder="Enter interval duration"
              keyboardType="numeric"
              value={formData.intervalDuration}
              onChangeText={(text) =>
                setFormData({ ...formData, intervalDuration: text })
              }
            />
          </View>

          {/* Start Date */}
          <View className="mb-4">
            <Text className="text-lg mb-2">Start Date</Text>
            <TouchableOpacity
              className="border border-gray-400 rounded-lg p-3"
              onPress={() => showDatePicker("startDate")}
            >
              <Text>{formatDate(formData.startDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* End Date */}
          <View className="mb-4">
            <Text className="text-lg mb-2">End Date</Text>
            <TouchableOpacity
              className="border border-gray-400 rounded-lg p-3"
              onPress={() => showDatePicker("endDate")}
            >
              <Text>{formatDate(formData.endDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* Image Picker */}
          <View className="mb-4">
            <Text className="text-lg mb-2">Medication Image</Text>
            <TouchableOpacity
              className="border border-gray-400 rounded-lg p-3 mb-3"
              onPress={pickImage}
            >
              <Text>{selectedImage ? "Change Image" : "Pick Image"}</Text>
            </TouchableOpacity>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={{ width: 200, height: 200 }}
              />
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className="bg-purple-600 p-2 rounded-lg items-center mt-4"
            onPress={handleSave}
          >
            <Text className="text-white font-bold text-lg">Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
