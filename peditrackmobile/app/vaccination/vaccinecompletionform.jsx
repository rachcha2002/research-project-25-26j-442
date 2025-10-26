import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SubScreenHeader from "../../components/SubScreenHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native"; // React Navigation's useRoute
import * as FileSystem from "expo-file-system"; // For saving data locally
import { db } from "../../lib/firebase"; // Firebase config
import { doc, updateDoc } from "firebase/firestore"; // For Firestore sync
import NetInfo from "@react-native-community/netinfo"; // For network status
import { useNavigation } from '@react-navigation/native';

// Utility function to parse date string in dd/MM/yyyy format
const parseDate = (dateString) => {
  const [day, month, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`);
};

const vaccinecompletionform = () => {
  const route = useRoute();
  const { vaccine, currentBaby, id, babyData } = route.params;
  const [batchNo, setBatchNo] = useState('');
  const [vaccinatedDate, setVaccinatedDate] = useState(parseDate(vaccine.dueDate));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vaccinatedTime, setVaccinatedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');
  const navigation = useNavigation();

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || vaccinatedDate;
    setShowDatePicker(false);
    setVaccinatedDate(currentDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || vaccinatedTime;
    setShowTimePicker(false);
    setVaccinatedTime(currentTime);
  };

  const handleUpdateProfile = async () => {
    
    const updatedVaccineList = babyData.map((v) => {
      if (v.id === vaccine.id) {
      return {
        ...v,
        batchNo: batchNo,
        Time: vaccinatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dueDate: vaccinatedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }), // Format as dd/MM/yyyy
        specialDetails: specialNotes,
        status: "completed",
      };
      }
      return v;
    });

    const updatedProfile = {
      id: id,
     babyName: currentBaby,
      vaccineList: updatedVaccineList,
    };

    console.log('Updated profile:', updatedProfile);
    if (!currentBaby) {
      Alert.alert("Error", "Baby name not found.");
      return;
    }

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
        profile.id === updatedProfile.id ? updatedProfile : profile
      );

      if (!profiles.some(profile => profile.id === updatedProfile.id)) {
        updatedProfiles.push(updatedProfile);
      }
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(updatedProfiles)
      );

      // Optionally sync with Firestore if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const docRef = doc(db, "babyProfiles", updatedProfile.id);
        await updateDoc(docRef, updatedProfile);
        Alert.alert("Success", "Vaccination Completed.");
      } else {
        Alert.alert("Offline", "Vaccination saved locally.");
      }
    } catch (error) {
      console.error("Error Vaccination Complete:", error);
      Alert.alert("Error", `Failed to update the profile: ${error.message}`);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
    <SafeAreaView className="bg-white h-full">
      <SubScreenHeader title="Vaccination Completion Form" goBackPath={"/vaccine"} />
    <ScrollView contentContainerStyle={{ flexGrow: 1}}>
        <View>
        <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#7360F2', paddingHorizontal: 20, marginBottom: 10 }}>{vaccine.name}</Text>
        </View>
        <View className="m-4 bg-white rounded-lg shadow-lg p-4 mb-2 rounded-2xl border-2 border-[#d3cdfb]">
        <View className="mb-4">
          <Text style={styles.label}>Batch No</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Enter Batch No"
            value={batchNo}
            onChangeText={setBatchNo}
          />
        </View>

        <View className="mb-4">
          <Text style={styles.label}>Vaccinated Date and Time</Text>
          <View className="flex flex-row justify-between">
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-[48%]"
            >
              <Text>
                {vaccinatedDate
                  ? vaccinatedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : 'DD/MM/YYYY'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-[48%]"
            >
              <Text>{vaccinatedTime ? vaccinatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={vaccinatedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={vaccinatedTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        <View className="mb-4">
          <Text style={styles.label}>Special Notes</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Add Special Notes"
            value={specialNotes}
            onChangeText={setSpecialNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity className="bg-[#7360F2] py-3 m-5 rounded-lg" onPress={() => { navigation.navigate('completedvaccinelist'); handleUpdateProfile(); }}>
          <Text className="text-center text-white text-lg">Complete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  }
});

export default vaccinecompletionform;
