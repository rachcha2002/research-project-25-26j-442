import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import React, { useState } from 'react'
import SubScreenHeader from "../../components/SubScreenHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from "expo-file-system"; // For saving data locally
import { db } from "../../lib/firebase"; // Firebase config
import { doc, updateDoc } from "firebase/firestore"; // For Firestore sync
import NetInfo from "@react-native-community/netinfo"; // For network status
import modifyreminder from './modifyreminder';

const parseTime = (timeString) => {
    const [time, modifier] = timeString.trim().split(/\s+/);
    console.log(time, "   ", modifier);
    let [hours, minutes] = time.split(':');

    // Convert hours to 24-hour format
    hours = parseInt(hours, 10);
    if (modifier === 'PM' && hours < 12) {
        hours += 12; // Convert PM hour
    }
    if (modifier === 'AM' && hours === 12) {
        hours = 0; // Convert 12 AM to 0 hours
    }

    // Format back to hh:mm AM/PM
    const timee = new Date(1970, 0, 1, hours, minutes);
    return timee;
};

    const parseDate = (dateString) => {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`);
      };

const upcomingvaccinedetails = () => {
    const route = useRoute();
    const { vaccine, id, currentBaby, babyData } = route.params;
    const [date, setDate] = useState(parseDate(vaccine.dueDate));
    const [time, setTime] = useState(parseTime(vaccine.Time)); // Ensure time is parsed correctly
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const navigation = useNavigation();

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(false);
        setDate(currentDate);
    };

    const onChangeTime = (event, selectedTime) => {
        const currentTime = selectedTime || time;
        setShowTimePicker(false);
        setTime(currentTime);
    };

    const handleUpdateProfile = async () => {
    
        const updatedVaccineList = babyData.map((v) => {
          if (v.id === vaccine.id) {
          return {
            ...v,
            Time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            dueDate: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }), // Format as dd/MM/yyyy
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
            Alert.alert("Success", "Time & Date updated successfully.");
          } else {
            Alert.alert("Offline", "Time & Date updated updated locally.");
          }
        } catch (error) {
          console.error("Error updating Time & Date updated:", error);
          Alert.alert("Error", `Failed to update the Time & Date updated: ${error.message}`);
        }

        const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    

        modifyreminder(currentBaby,vaccine.id,vaccine.name,formattedTime,formattedDate)
      };

    return (
        <SafeAreaView className="bg-white h-full">
            <SubScreenHeader title="Upcoming Vaccines" goBackPath={"vaccination/upcomingvaccinelist"} />
            <View>
                <Text style={styles.header}>{vaccine.name}</Text>
            </View>
            <ScrollView>
            <View style={styles.card}>
                <Image
                    source={vaccine.image}
                    style={styles.image}
                />
                <Text style={styles.desc}>
                    {vaccine.description}
                </Text>
                <View style={styles.detailsContainer}>
                    <Text style={styles.label}>
                        Appointment Date: <Text style={styles.value}>{date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                    </Text>
                    <Text style={styles.label}>
                        Appointment Time: <Text style={styles.value}>{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
                    </Text>
                </View>
                <Text style={styles.change}>Change Date and Time</Text>
                <View style={styles.detailsContainer}>
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}  >
                            <Text style={styles.value}>{date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.changeButton} onPress={() => {handleUpdateProfile();}}>
                            <Text style={styles.buttonText}>Change Date</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                            <Text style={styles.value}>{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.changeButton} onPress={() => {handleUpdateProfile(); }}>
                            <Text style={styles.buttonText}>Change Time</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Date and Time Pickers */}
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                    />
                )}
                {showTimePicker && (
                    <DateTimePicker
                        value={time}
                        mode="time"
                        display="default"
                        onChange={onChangeTime}
                    />
                )}

                {/* Complete Vaccine Button */}
                <TouchableOpacity style={styles.completeButton} onPress={() => navigation.navigate('vaccinecompletionform', {  vaccine,id ,currentBaby, babyData })}>
                    <Text style={styles.completeButtonText}>Complete Vaccine</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
        margin: 10,
        alignItems: 'center',
    },
    header: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#7360F2',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    image: {
        width: 200,
        height: 240,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    detailsContainer: {
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    desc: {
        textAlign: 'center',
        fontSize: 18,
        color: '#555',
        marginTop: 10,
        marginBottom: 20,
    },
    change: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7360F2',
        marginBottom: 10, textAlign: 'left',
        width: '100%',
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        width: '80%',
    },
    value: {
        marginLeft: 10,
        fontSize: 18,
        color: '#555',
    },
    changeButton: {
        backgroundColor: '#7360F2',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    completeButton: {
        backgroundColor: '#7360F2',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});
export default upcomingvaccinedetails
