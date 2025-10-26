import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native"; // React Navigation's useRoute
import * as FileSystem from "expo-file-system"; // For saving data locally
import { db } from "../../lib/firebase"; // Firebase config
import { doc, updateDoc } from "firebase/firestore"; // For Firestore sync
import NetInfo from "@react-native-community/netinfo"; // For network status
import { SafeAreaView } from "react-native-safe-area-context";

const UpdateProfile = () => {
  const route = useRoute(); // Get params via useRoute from React Navigation
  const { profileData } = route.params; // Retrieve profile data passed as params

  const [initialWeight, setInitialWeight] = useState(profileData.initialWeight);
  const [bloodGroup, setBloodGroup] = useState(profileData.bloodGroup);
  const [initialHeight, setInitialHeight] = useState(profileData.initialHeight);
  const [initialCircumference, setInitialCircumference] = useState(
    profileData.initialCircumference
  );
  const [birthPlace, setBirthPlace] = useState(profileData.birthPlace);
  const [specialRemarks, setSpecialRemarks] = useState(
    profileData.specialRemarks
  );

  // Handle profile update
  const handleUpdateProfile = async () => {
    const updatedProfile = {
      ...profileData,
      initialWeight,
      bloodGroup,
      initialHeight,
      initialCircumference,
      birthPlace,
      specialRemarks,
    };

    try {
      // Save to local storage
      const filePath = `${FileSystem.documentDirectory}babyProfiles.json`;
      let profiles = [];
      const fileExists = await FileSystem.getInfoAsync(filePath);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(filePath);
        profiles = JSON.parse(fileContent);
      }

      const updatedProfiles = profiles.map((profile) =>
        profile.babyName === updatedProfile.babyName ? updatedProfile : profile
      );
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(updatedProfiles)
      );

      // Optionally sync with Firestore if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const docRef = doc(db, "babyProfiles", updatedProfile.babyName);
        await updateDoc(docRef, updatedProfile);
        Alert.alert("Success", "Profile updated successfully.");
      } else {
        Alert.alert("Offline", "Profile updated locally.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", `Failed to update the profile: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        {/* Display name and date of birth (non-editable) */}
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
          Baby Name: {profileData.babyName}
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          Date of Birth: {new Date(profileData.dateOfBirth).toDateString()}
        </Text>

        {/* Medical Information */}
        <TextInput
          placeholder="Initial Weight (kg)"
          style={styles.inputField}
          value={initialWeight}
          onChangeText={setInitialWeight}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Blood Group"
          style={styles.inputField}
          value={bloodGroup}
          onChangeText={setBloodGroup}
        />
        <TextInput
          placeholder="Initial Height (cm)"
          style={styles.inputField}
          value={initialHeight}
          onChangeText={setInitialHeight}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Initial Circumference (cm)"
          style={styles.inputField}
          value={initialCircumference}
          onChangeText={setInitialCircumference}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Birth Place"
          style={styles.inputField}
          value={birthPlace}
          onChangeText={setBirthPlace}
        />
        <TextInput
          placeholder="Special Remarks"
          style={[styles.inputField, { height: 80, textAlignVertical: "top" }]}
          value={specialRemarks}
          onChangeText={setSpecialRemarks}
          multiline
        />

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleUpdateProfile}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  saveButton: {
    backgroundColor: "#6C63FF",
    padding: 16,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 30,
  },
};

export default UpdateProfile;
