import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useGlobalContext } from "../../context/GlobalProvider";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getWeightRange } from "./weightData";

const screenWidth = Dimensions.get("window").width;
const weightFilePath = `${FileSystem.documentDirectory}weightRecords.json`;

const WeightGrowthComponent = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weightRecords, setWeightRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isRecordModalVisible, setIsRecordModalVisible] = useState(false);

  const { currentBaby, user, babies } = useGlobalContext();

  const currentBabyData = babies.find(
    (baby) => baby.babyName === currentBaby && baby.userMail === user.email
  );

  const calculateAgeInMonths = (selectedDate, birthDate) => {
    const selected = new Date(selectedDate);
    const birth = new Date(birthDate);

    let years = selected.getFullYear() - birth.getFullYear();
    let months = selected.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    return years * 12 + months;
  };

  const getChartData = () => {
    const sortedRecords = weightRecords.sort((a, b) => a.age - b.age);

    return {
      labels: sortedRecords.map((record) => `${record.age} mo`),
      datasets: [
        {
          data: sortedRecords.map((record) => record.weight),
          strokeWidth: 2,
        },
      ],
    };
  };

  const getLastRecord = () => {
    const sortedRecords = [...weightRecords].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    return sortedRecords[0];
  };

  const handleAddWeight = async () => {
    if (!newWeight || !date) {
      Alert.alert("Validation Error", "Please fill all the fields.");
      return;
    }

    const ageInMonths = calculateAgeInMonths(date, currentBabyData.dateOfBirth);
    const weightRange = getWeightRange(ageInMonths);

    let remarks = "Normal";

    if (weightRange) {
      if (newWeight < weightRange.lowerWeight) {
        remarks = "Underweight";
      } else if (newWeight > weightRange.upperWeight) {
        remarks = "Overweight";
      }
    }

    const newWeightRecord = {
      babyName: currentBaby,
      userMail: user.email,
      weight: parseFloat(newWeight),
      date: date.toISOString(),
      age: ageInMonths,
      remarks,
    };

    try {
      let weightRecords = [];
      const fileExists = await FileSystem.getInfoAsync(weightFilePath);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(weightFilePath);
        weightRecords = JSON.parse(fileContent);
      }
      weightRecords.push(newWeightRecord);
      await FileSystem.writeAsStringAsync(
        weightFilePath,
        JSON.stringify(weightRecords)
      );

      Alert.alert("Success", "Weight record saved locally.");
      fetchWeightRecords();

      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await addDoc(collection(db, "weight"), newWeightRecord);
        Alert.alert("Success", "Weight record synced with Firestore.");
      } else {
        Alert.alert(
          "Offline",
          "Weight record saved locally. Will sync with Firestore when online."
        );
      }

      setIsModalVisible(false);
      setNewWeight("");
      setDate(new Date());
    } catch (error) {
      console.error("Error saving weight record:", error);
      Alert.alert(
        "Error",
        `Failed to save the weight record: ${error.message}`
      );
    }
  };

  const fetchWeightRecords = async () => {
    setLoading(true);
    let records = [];
    const fileExists = await FileSystem.getInfoAsync(weightFilePath);

    if (fileExists.exists) {
      const fileContent = await FileSystem.readAsStringAsync(weightFilePath);
      records = JSON.parse(fileContent).filter(
        (record) =>
          record.userMail === user.email && record.babyName === currentBaby
      );
    }

    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const weightQuery = query(
          collection(db, "weight"),
          where("userMail", "==", user.email),
          where("babyName", "==", currentBaby)
        );
        const querySnapshot = await getDocs(weightQuery);
        const firestoreRecords = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const uniqueRecords = [...records, ...firestoreRecords].filter(
          (v, i, a) => a.findIndex((t) => t.date === v.date) === i
        );

        records = uniqueRecords;
      } catch (error) {
        console.error("Error fetching records from Firestore:", error);
      }
    }

    setWeightRecords(records);
    setLoading(false);
  };

  useEffect(() => {
    fetchWeightRecords();
  }, [currentBaby, user.email]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWeightRecords();
    setRefreshing(false);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const lastRecord = getLastRecord();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  };

  const handleDataPointClick = (data) => {
    const clickedRecord = weightRecords[data.index];
    setSelectedRecord(clickedRecord);
    setIsRecordModalVisible(true);
  };

  // Function to delete a record from both local storage and Firestore
  const handleDeleteRecord = async (record) => {
    try {
      // Delete from local storage
      try {
        const fileContent = await FileSystem.readAsStringAsync(weightFilePath);
        const records = JSON.parse(fileContent).filter(
          (r) =>
            !(
              r.userMail === record.userMail &&
              r.babyName === record.babyName &&
              r.date === record.date
            )
        );
        await FileSystem.writeAsStringAsync(
          weightFilePath,
          JSON.stringify(records)
        );
        Alert.alert("Success", "Record deleted from local storage.");
      } catch (localError) {
        console.error("Error deleting from local storage:", localError);
        Alert.alert("Error", "Failed to delete the record from local storage.");
      }

      // Delete from Firestore
      try {
        const weightQuery = query(
          collection(db, "weight"),
          where("userMail", "==", record.userMail),
          where("babyName", "==", record.babyName),
          where("date", "==", record.date)
        );
        const querySnapshot = await getDocs(weightQuery);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        Alert.alert("Success", "Record deleted from Firestore.");
      } catch (firestoreError) {
        console.error("Error deleting from Firestore:", firestoreError);
        Alert.alert("Error", "Failed to delete the record from Firestore.");
      }

      setIsRecordModalVisible(false);
      fetchWeightRecords();
    } catch (error) {
      console.error("Error handling deletion:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  return (
    <View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={{ flex: 1 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#6256B1" />
        ) : (
          <>
            <View style={styles.chartContainer}>
              <Text className="text-[#6256B1] text-lg font-bold mb-1 ml-2">
                Weight Growth
              </Text>
              {weightRecords.length > 0 ? (
                <LineChart
                  data={getChartData()}
                  width={screenWidth * 0.95}
                  height={450}
                  yAxisSuffix=" kg"
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
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  onDataPointClick={handleDataPointClick}
                />
              ) : (
                <Text>No weight records available</Text>
              )}

              <View style={styles.dataCardContainer}>
                <View style={styles.cardContainer}>
                  <Text style={styles.cardTitle}>Last Weight Record</Text>
                  <Text style={styles.cardValue}>
                    {lastRecord ? `${lastRecord.weight} kg` : "No Record"}
                  </Text>
                  <Text style={styles.cardDate}>
                    {lastRecord ? formatDate(lastRecord.date) : "N/A"}
                  </Text>
                  <Text
                    style={[
                      styles.cardStatus,
                      {
                        color:
                          lastRecord?.remarks === "Normal" ? "green" : "red",
                      },
                    ]}
                  >
                    {lastRecord ? lastRecord.remarks : ""}
                  </Text>
                </View>

                <View style={styles.cardContainer}>
                  <Text style={styles.cardTitle}>Add New Weight</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setIsModalVisible(true)}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal for adding new weight */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Weight</Text>

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

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter weight"
                keyboardType="decimal-pad"
                value={newWeight}
                onChangeText={setNewWeight}
              />
            </View>

            <TouchableOpacity
              style={styles.addButtonModal}
              onPress={handleAddWeight}
            >
              <Text style={styles.addButtonTextModal}>Add</Text>
            </TouchableOpacity>

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
                  Weight: {selectedRecord.weight} kg
                </Text>
                <Text style={styles.modalLabel}>
                  Age: {selectedRecord.age} months
                </Text>
                <Text style={styles.modalLabel}>
                  Remarks: {selectedRecord.remarks}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteRecord(selectedRecord)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
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
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  chartContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 5,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
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
  deleteButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default WeightGrowthComponent;
