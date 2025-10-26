import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator, // For loader
  ScrollView, // For pull-to-refresh
  RefreshControl,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import * as FileSystem from "expo-file-system"; // For saving data locally
import NetInfo from "@react-native-community/netinfo"; // For network status
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc, // For deleting Firestore documents
} from "firebase/firestore"; // For syncing with Firestore
import { db } from "../../lib/firebase"; // Your Firestore config
import { useGlobalContext } from "../../context/GlobalProvider"; // Access Global Context
import DateTimePicker from "@react-native-community/datetimepicker"; // Importing DateTimePicker
import { getHeightRange } from "./heightData"; // Import the height data function

const screenWidth = Dimensions.get("window").width;

const heightFilePath = `${FileSystem.documentDirectory}heightRecords.json`; // Path for height records

const HeightGrowthComponent = () => {
  const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility
  const [newHeight, setNewHeight] = useState(""); // State for new height
  const [date, setDate] = useState(new Date()); // State for selected date
  const [showDatePicker, setShowDatePicker] = useState(false); // State for showing the date picker
  const [heightRecords, setHeightRecords] = useState([]); // State for height records
  const [selectedRecord, setSelectedRecord] = useState(null); // State to store the clicked record
  const [isRecordModalVisible, setIsRecordModalVisible] = useState(false); // State to show record modal
  const [loading, setLoading] = useState(false); // State for loader
  const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh

  const { currentBaby, user, babies } = useGlobalContext(); // Access the current baby and user from GlobalContext

  // Filter the current baby data from the babies array
  const currentBabyData = babies.find(
    (baby) => baby.babyName === currentBaby && baby.userMail === user.email
  );

  // Function to calculate the age in months
  const calculateAgeInMonths = (selectedDate, birthDate) => {
    const selected = new Date(selectedDate);
    const birth = new Date(birthDate);

    let years = selected.getFullYear() - birth.getFullYear();
    let months = selected.getMonth() - birth.getMonth();

    // Adjust if the current month is before the birth month
    if (months < 0) {
      years--;
      months += 12;
    }

    return years * 12 + months; // Return total number of months
  };

  // Function to format data for the chart
  const getChartData = () => {
    const sortedRecords = heightRecords.sort((a, b) => a.age - b.age);

    return {
      labels: sortedRecords.map((record) => `${record.age} mo`), // X-axis labels (age in months)
      datasets: [
        {
          data: sortedRecords.map((record) => record.height), // Y-axis values (heights)
          strokeWidth: 2, // Line thickness
        },
      ],
    };
  };

  // Function to get the last record
  const getLastRecord = () => {
    const sortedRecords = [...heightRecords].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    return sortedRecords[0]; // Always return the latest record
  };

  // Function to handle adding a new height record
  const handleAddHeight = async () => {
    if (!newHeight || !date) {
      Alert.alert("Validation Error", "Please fill all the fields.");
      return;
    }

    const ageInMonths = calculateAgeInMonths(date, currentBabyData.dateOfBirth); // Calculate age in months
    const heightRange = getHeightRange(ageInMonths); // Get the height range for the age

    let remarks = "Normal"; // Default remark

    if (heightRange) {
      if (newHeight < heightRange.lowerHeight) {
        remarks = "Underheight";
      } else if (newHeight > heightRange.upperHeight) {
        remarks = "Overheight";
      }
    }

    const newHeightRecord = {
      babyName: currentBaby,
      userMail: user.email,
      height: parseFloat(newHeight),
      date: date.toISOString(),
      age: ageInMonths, // Save the age in months
      remarks, // Add the remarks field
    };

    try {
      // Save to local storage
      let heightRecords = [];
      const fileExists = await FileSystem.getInfoAsync(heightFilePath);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(heightFilePath);
        heightRecords = JSON.parse(fileContent);
      }
      heightRecords.push(newHeightRecord);
      await FileSystem.writeAsStringAsync(
        heightFilePath,
        JSON.stringify(heightRecords)
      );

      Alert.alert("Success", "Height record saved locally.");
      fetchHeightRecords(); // Refresh records

      // Optionally sync with Firestore if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await addDoc(collection(db, "height"), newHeightRecord);
        Alert.alert("Success", "Height record synced with Firestore.");
      } else {
        Alert.alert(
          "Offline",
          "Height record saved locally. Will sync with Firestore when online."
        );
      }

      setIsModalVisible(false);
      setNewHeight("");
      setDate(new Date());
    } catch (error) {
      console.error("Error saving height record:", error);
      Alert.alert(
        "Error",
        `Failed to save the height record: ${error.message}`
      );
    }
  };

  // Function to delete record from Firestore and local file system
  const handleDeleteRecord = async (record) => {
    // Delete from Firestore
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const heightQuery = query(
          collection(db, "height"),
          where("userMail", "==", record.userMail),
          where("babyName", "==", record.babyName),
          where("date", "==", record.date)
        );
        const querySnapshot = await getDocs(heightQuery);
        if (!querySnapshot.empty) {
          querySnapshot.forEach(async (docSnapshot) => {
            await deleteDoc(doc(db, "height", docSnapshot.id));
          });
        }
        Alert.alert("Success", "Record deleted from Firestore.");
      } catch (error) {
        console.error("Error deleting record from Firestore:", error);
        Alert.alert("Error", "Failed to delete record from Firestore.");
      }
    } else {
      Alert.alert(
        "Offline",
        "Unable to delete record from Firestore while offline."
      );
    }

    // Delete from local storage
    try {
      const fileContent = await FileSystem.readAsStringAsync(heightFilePath);
      const updatedRecords = JSON.parse(fileContent).filter(
        (r) =>
          !(
            r.userMail === record.userMail &&
            r.babyName === record.babyName &&
            r.date === record.date
          )
      );
      await FileSystem.writeAsStringAsync(
        heightFilePath,
        JSON.stringify(updatedRecords)
      );
      setHeightRecords(updatedRecords); // Update state after deletion
      Alert.alert("Success", "Record deleted locally.");
    } catch (error) {
      console.error("Error deleting record locally:", error);
      Alert.alert("Error", "Failed to delete record locally.");
    }

    setIsRecordModalVisible(false); // Close modal
  };

  // Function to fetch height records from local storage and Firestore
  const fetchHeightRecords = async () => {
    setLoading(true); // Show loader
    let records = [];
    const fileExists = await FileSystem.getInfoAsync(heightFilePath);

    // Fetch from local storage
    if (fileExists.exists) {
      const fileContent = await FileSystem.readAsStringAsync(heightFilePath);
      records = JSON.parse(fileContent).filter(
        (record) =>
          record.userMail === user.email && record.babyName === currentBaby
      );
    }

    // Check network connectivity and fetch from Firestore if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const heightQuery = query(
          collection(db, "height"),
          where("userMail", "==", user.email),
          where("babyName", "==", currentBaby)
        );
        const querySnapshot = await getDocs(heightQuery);
        const firestoreRecords = querySnapshot.docs.map((doc) => doc.data());

        // Merge local and Firestore records (eliminate duplicates by date)
        const uniqueRecords = [...records, ...firestoreRecords].filter(
          (v, i, a) => a.findIndex((t) => t.date === v.date) === i
        );

        records = uniqueRecords;
      } catch (error) {
        console.error("Error fetching records from Firestore:", error);
      }
    }

    setHeightRecords(records);
    setLoading(false); // Hide loader
  };

  // Pull-to-refresh function
  const onRefresh = () => {
    setRefreshing(true);
    fetchHeightRecords().then(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchHeightRecords(); // Fetch height records when component mounts
  }, [currentBaby, user.email]);

  // Function to open DateTimePicker
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Function to handle date change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Get the last record
  const lastRecord = getLastRecord();

  // Format date as '25 Aug 2024'
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  };

  // Handle click on chart data point
  const handleDataPointClick = (data) => {
    const clickedRecord = heightRecords[data.index]; // Find the record based on index
    setSelectedRecord(clickedRecord); // Set the selected record
    setIsRecordModalVisible(true); // Open modal to display record details
  };

  return (
    <View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Chart */}
        <View style={styles.chartContainer}>
          <Text className="text-[#6256B1] text-lg font-bold mb-1 ml-2">
            Height Growth
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color="#6256B1" />
          ) : heightRecords.length > 0 ? (
            <LineChart
              data={getChartData()}
              width={screenWidth * 0.95} // from react-native
              height={450}
              yAxisSuffix=" cm"
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(98, 86, 177, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#6256B1",
                },
              }}
              style={{
                marginVertical: 4,
                borderRadius: 16,
              }}
              onDataPointClick={handleDataPointClick} // Capture click events on dots
            />
          ) : (
            <Text>No height records available</Text>
          )}

          {/* Data Cards */}
          <View style={styles.dataCardContainer}>
            {/* Last Record Data Card */}
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Last Height Record</Text>
              <Text style={styles.cardValue}>
                {lastRecord ? `${lastRecord.height} cm` : "No Record"}
              </Text>
              <Text style={styles.cardDate}>
                {lastRecord ? formatDate(lastRecord.date) : "N/A"}
              </Text>
              <Text
                style={[
                  styles.cardStatus,
                  lastRecord?.remarks === "Normal"
                    ? styles.statusNormal
                    : styles.statusWarning,
                ]}
              >
                {lastRecord ? lastRecord.remarks : ""}
              </Text>
            </View>

            {/* Add New Height Data Card */}
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Add New Height</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsModalVisible(true)}
              >
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Modal for adding new height */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Height</Text>

              {/* Date Input */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalLabel}>Date</Text>
                <TouchableOpacity onPress={showDatepicker}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Select date"
                    value={date.toLocaleDateString("en-GB")}
                    editable={false}
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}
              </View>

              {/* Height Input */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter height"
                  keyboardType="decimal-pad"
                  value={newHeight}
                  onChangeText={setNewHeight}
                />
              </View>

              {/* Add Button */}
              <TouchableOpacity
                style={styles.addButtonModal}
                onPress={handleAddHeight}
              >
                <Text style={styles.addButtonTextModal}>Add</Text>
              </TouchableOpacity>

              {/* Close Modal */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal for displaying selected record details */}
        <Modal
          visible={isRecordModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsRecordModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Record Details</Text>
              {selectedRecord && (
                <>
                  <Text style={styles.modalLabel}>
                    Date: {formatDate(selectedRecord.date)}
                  </Text>
                  <Text style={styles.modalLabel}>
                    Height: {selectedRecord.height} cm
                  </Text>
                  <Text style={styles.modalLabel}>
                    Age: {selectedRecord.age} months
                  </Text>
                  <Text style={styles.modalLabel}>
                    Remarks: {selectedRecord.remarks}
                  </Text>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.addButtonModal}
                    onPress={() => handleDeleteRecord(selectedRecord)}
                  >
                    <Text style={styles.addButtonTextModal}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsRecordModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
    marginHorizontal: 0.5,
  },
  dataCardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 5,
    marginTop: 5,
  },
  cardContainer: {
    width: "45%",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6256B1",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: "#777",
    marginBottom: 8,
  },
  cardStatus: {
    fontSize: 12,
  },
  statusNormal: {
    color: "green",
  },
  statusWarning: {
    color: "red",
  },
  addButton: {
    backgroundColor: "#6256B1",
    width: 40,
    height: 40,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  viewRecordsButton: {
    backgroundColor: "#6256B1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  viewRecordsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6256B1",
    marginBottom: 20,
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  modalInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  addButtonModal: {
    backgroundColor: "#6256B1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonTextModal: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6256B1",
  },
});

export default HeightGrowthComponent;
