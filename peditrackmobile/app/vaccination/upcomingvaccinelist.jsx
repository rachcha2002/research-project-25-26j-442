import { View, Text, TouchableOpacity, Platform, TextInput, StyleSheet, Image, RefreshControl, FlatList } from 'react-native';
import React, { useState, useEffect } from "react";
import SubScreenHeader from "../../components/SubScreenHeader";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from "expo-file-system"; // For local file system
import NetInfo from "@react-native-community/netinfo";
import { useGlobalContext } from "../../context/GlobalProvider";
import { collection, getDocs, query, where } from "firebase/firestore"; // Firestore functions
import { db } from "../../lib/firebase";

const filePath = `${FileSystem.documentDirectory}babyProfiles.json`;

const upcomingvaccinelist = () => {
  const { user, currentBaby } = useGlobalContext(); // Access the user, current baby, and babies from Global Context
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();
  const [babyData, setBabyData] = useState([]);
  const [id, setId] = useState('');

  const fetchbabyProfilesFromFirestore = async () => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, "babyProfiles"),
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

      setBabyData(fetchedRecords[0]?.vaccineList);
      setId(fetchedRecords[0]?.id);
      const pendingVaccines = fetchedRecords[0]?.vaccineList?.filter(vaccine => vaccine.status === "pending") || [];
      setRecords(pendingVaccines); // Update state with fetched records
      setFilteredRecords(pendingVaccines); // Initialize filtered records
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
        setBabyData(storedRecords[0]?.vaccineList);
        setId(storedRecords[0]?.id);
        const pendingVaccines = storedRecords[0]?.vaccineList?.filter(vaccine => vaccine.status === "pending") || [];
        setRecords(pendingVaccines); // Set records from local storage
        setFilteredRecords(pendingVaccines); // Initialize filtered records
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
      fetchbabyProfilesFromFirestore(); // Fetch from Firestore if connected
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

  const handleDateChange = (event, selectedDate) => {
    setShowFromDatePicker(false);
    if (selectedDate) {
      setFromDate(selectedDate);
      filterRecords(searchText, selectedDate);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    console.log(`${day}/${month}/${year}`);
    return `${day}/${month}/${year}`;
  };

  const filterRecords = (text, date) => {
    const filtered = records.filter(record => {
      const matchesDate = record.dueDate === formatDate(date);
      const matchesName = record.name.toLowerCase().includes(text.toLowerCase());
      return matchesDate && matchesName;
    });
    setFilteredRecords(filtered);
  };

  const filterRecordsName = (text) => {
    const filtered = records.filter(record => {
      const matchesName = record.name.toLowerCase().includes(text.toLowerCase());
      return matchesName;
    });
    setFilteredRecords(filtered);
  };

  const filterRecordsByName = (text) => {
    setSearchText(text);
    filterRecordsName(text);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaView className="bg-white h-full">
        <SubScreenHeader title="Upcoming Vaccines" goBackPath={"/vaccine"} />

        <View className="m-4 flex flex-row justify-between space-x-4 mb-4">
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center justify-between h-14 px-4 bg-[#ffffff] rounded-2xl border-2 border-[#7360F2]">
            <TextInput
                className="flex-1 text-[#7360F2] mt-1 font-pregular"
                placeholder="Search by vaccine name"
                placeholderTextColor="#7360F2"
                value={searchText}
                onChangeText={filterRecordsByName}
              />
            </View>

            <View className=" mt-4 flex-row items-center justify-between space-x-4 h-14 px-4 bg-[#ffffff] rounded-2xl border-2 border-[#7360F2] ">
              <TouchableOpacity
                className="flex-1"
                onPress={() => setShowFromDatePicker(true)}
              >
                <Text className="text-[#7360F2] mt-1 font-pregular">
                  {fromDate ? fromDate.toLocaleDateString() : "Search by Date"}
                </Text>
              </TouchableOpacity>
            </View>

            {showFromDatePicker && (
              <DateTimePicker
                value={fromDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
              />
            )}
          </View>
        </View>
        <ScrollView className="flex-1 bg-white" refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        } contentContainerStyle={{ paddingBottom: 100 }}>
          {filteredRecords.map((vaccine) => (
            <TouchableOpacity
              key={vaccine.id}
              onPress={() => navigation.navigate('upcomingvaccinedetails', {  vaccine,id ,currentBaby, babyData })}
            >
              <View className="m-4 bg-white rounded-lg shadow-lg px-4 mb-2 rounded-2xl border-2 border-[#d3cdfb]" style={styles.card}>
                <Image source={vaccine.image} style={styles.image} />
                <View style={styles.details}>
                  <Text style={styles.vaccineName}>{vaccine.name}</Text>
                  <Text style={styles.dueDate}>Date: {vaccine.dueDate}</Text>
                  <Text style={styles.time}>Time: {vaccine.Time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  image: {
    width: 90,
    height: 110,
    borderRadius: 10,
    marginRight: 20,
  },
  details: {
    flex: 1,
  },
  vaccineName: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15
  },
  dueDate: {
    fontSize: 18,
    marginLeft: 25,
    color: "#00000",
    marginBottom: 5
  },
  time: {
    fontSize: 18,
    marginLeft: 25,
    color: "#00000",
    marginBottom: 10
  },
  dropdown: {
    maxHeight: 150,
    borderColor: '#7360F2',
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#7360F2',
  },
});

export default upcomingvaccinelist;