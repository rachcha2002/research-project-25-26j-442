import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import {
  getDocs,
  query,
  collection,
  where,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useGlobalContext } from "../../context/GlobalProvider";
import DateTimePicker from "@react-native-community/datetimepicker";

const screenWidth = Dimensions.get("window").width;

const HeadCircumferenceGrowthComponent = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newRecord, setNewRecord] = useState({
    recordName: "",
    date: new Date(),
    headCircumference: "",
    remarks: "",
  });
  const [circumferenceRecords, setCircumferenceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // For pull-down-to-refresh
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { currentBaby, user, babies } = useGlobalContext();
  const circumferenceFilePath = `${FileSystem.documentDirectory}circumferenceRecords.json`;

  // Calculate the difference in months and years between two dates
  const calculateAgeDifference = (selectedDate, birthDate) => {
    const selected = new Date(selectedDate);
    const birth = new Date(birthDate);

    let years = selected.getFullYear() - birth.getFullYear();
    let months = selected.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    return years > 0 ? `${years} years ${months} months` : `${months} months`;
  };

  const handleAddRecord = async () => {
    if (
      !newRecord.recordName ||
      !newRecord.date ||
      !newRecord.headCircumference
    ) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }

    const age = calculateAgeDifference(
      newRecord.date,
      babies.find(
        (baby) => baby.babyName === currentBaby && baby.userMail === user.email
      ).dateOfBirth
    );

    const newCircumferenceRecord = {
      babyName: currentBaby,
      userMail: user.email,
      date: newRecord.date.toISOString(),
      circum: parseFloat(newRecord.headCircumference),
      recordName: newRecord.recordName,
      remarks: newRecord.remarks || "No remarks",
      age,
    };

    try {
      setLoading(true);

      let localRecords = [];
      const fileExists = await FileSystem.getInfoAsync(circumferenceFilePath);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(
          circumferenceFilePath
        );
        localRecords = JSON.parse(fileContent);
      }

      const recordExists = localRecords.some(
        (record) =>
          record.userMail === newCircumferenceRecord.userMail &&
          record.babyName === newCircumferenceRecord.babyName &&
          record.recordName === newCircumferenceRecord.recordName &&
          record.date === newCircumferenceRecord.date
      );

      if (recordExists) {
        Alert.alert("Duplicate Record", "This record already exists.");
        setLoading(false);
        return;
      }

      localRecords.push(newCircumferenceRecord);
      await FileSystem.writeAsStringAsync(
        circumferenceFilePath,
        JSON.stringify(localRecords)
      );

      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const circumferenceQuery = query(
          collection(db, "circumference"),
          where("userMail", "==", newCircumferenceRecord.userMail),
          where("babyName", "==", newCircumferenceRecord.babyName),
          where("recordName", "==", newCircumferenceRecord.recordName),
          where("date", "==", newCircumferenceRecord.date)
        );
        const querySnapshot = await getDocs(circumferenceQuery);

        if (!querySnapshot.empty) {
          Alert.alert(
            "Duplicate Record",
            "This record already exists in Firestore."
          );
          setLoading(false);
          return;
        }

        await addDoc(collection(db, "circumference"), newCircumferenceRecord);
        Alert.alert("Success", "Record synced with Firestore.");
      } else {
        Alert.alert(
          "Offline",
          "Record saved locally. Will sync with Firestore when online."
        );
      }

      setIsModalVisible(false);
      setNewRecord({
        recordName: "",
        date: new Date(),
        headCircumference: "",
        remarks: "",
      });

      // Refresh the records after adding
      fetchCircumferenceRecords();
    } catch (error) {
      Alert.alert("Error", `Failed to save the record: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCircumferenceRecords = async () => {
    setLoading(true);
    let localRecords = [];
    const fileExists = await FileSystem.getInfoAsync(circumferenceFilePath);

    if (fileExists.exists) {
      const fileContent = await FileSystem.readAsStringAsync(
        circumferenceFilePath
      );
      localRecords = JSON.parse(fileContent).filter(
        (record) =>
          record.userMail === user.email && record.babyName === currentBaby
      );
    }

    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const circumferenceQuery = query(
          collection(db, "circumference"),
          where("userMail", "==", user.email),
          where("babyName", "==", currentBaby)
        );
        const querySnapshot = await getDocs(circumferenceQuery);
        const firestoreRecords = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        localRecords = [...localRecords, ...firestoreRecords].filter(
          (v, i, a) => a.findIndex((t) => t.date === v.date) === i
        );
      } catch (error) {
        console.error("Error fetching records from Firestore:", error);
      }
    }

    setCircumferenceRecords(localRecords);
    setLoading(false);
  };

  useEffect(() => {
    fetchCircumferenceRecords();
  }, [currentBaby, user.email]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCircumferenceRecords();
    setRefreshing(false);
  };

  const handleDeleteRecord = async (record) => {
    try {
      // Step 1: Delete from local storage
      const fileContent = await FileSystem.readAsStringAsync(circumferenceFilePath);
      const updatedRecords = JSON.parse(fileContent).filter(
        (r) => r.date !== record.date || r.userMail !== record.userMail || r.recordName !== record.recordName
      );
      await FileSystem.writeAsStringAsync(
        circumferenceFilePath,
        JSON.stringify(updatedRecords)
      );
  
      // Step 2: Delete from Firestore (if connected)
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const circumferenceQuery = query(
          collection(db, "circumference"),
          where("userMail", "==", record.userMail),
          where("babyName", "==", record.babyName),
          where("recordName", "==", record.recordName),
          where("date", "==", record.date)
        );
        const querySnapshot = await getDocs(circumferenceQuery);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      }
  
      Alert.alert("Success", "Record deleted successfully.");
  
      // Step 3: Explicitly update the state to remove the deleted record
      setCircumferenceRecords(updatedRecords);
      fetchCircumferenceRecords();
  
    } catch (error) {
      console.error("Error deleting record:", error);
      Alert.alert("Error", "Failed to delete the record.");
    }
  };
  

  const RecordCard = ({ record }) => (
    <View style={styles.recordCard}>
      <Text style={styles.recordName}>{record.recordName}</Text>
      <View style={styles.recordRow}>
        <Text style={styles.recordValue}>{record.circum} cm</Text>
        <Text style={styles.recordValue}>Age: {record.age}</Text>
        <Text style={styles.recordDate}>
          {new Date(record.date).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.recordRemarks}>
        Remarks: {record.remarks ? record.remarks : "No Remarks"}
      </Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteRecord(record)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Head Circumference Growth</Text>
      <Text style={styles.warningText}>🔴 Only measure when needed</Text>

      <ScrollView
        style={{ width: "100%" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#6256B1" />
        ) : (
          circumferenceRecords.map(
            (record, index) =>
              record.circum &&
              record.date && <RecordCard key={index} record={record} />
          )
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addRecordButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addRecordButtonText}>Add New Record</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Circumference</Text>

            <Text style={styles.modalLabel}>Record Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter record name"
              value={newRecord.recordName}
              onChangeText={(text) =>
                setNewRecord({ ...newRecord, recordName: text })
              }
            />

            <Text style={styles.modalLabel}>Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                style={styles.modalInput}
                value={newRecord.date.toLocaleDateString("en-GB")}
                editable={false}
              />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={newRecord.date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setNewRecord({ ...newRecord, date: selectedDate });
                  }
                }}
              />
            )}

            <Text style={styles.modalLabel}>Head Circumference (cm)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter head circumference"
              keyboardType="decimal-pad"
              value={newRecord.headCircumference}
              onChangeText={(text) =>
                setNewRecord({ ...newRecord, headCircumference: text })
              }
            />

            <Text style={styles.modalLabel}>Remarks</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter any remarks"
              value={newRecord.remarks}
              onChangeText={(text) =>
                setNewRecord({ ...newRecord, remarks: text })
              }
            />

            <TouchableOpacity
              style={styles.addButtonModal}
              onPress={handleAddRecord}
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
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
    width: screenWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6256B1",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  warningText: {
    fontSize: 14,
    color: "red",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  recordCard: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  recordName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6256B1",
    marginBottom: 8,
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  recordValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  recordDate: {
    fontSize: 16,
    color: "#777",
  },
  recordRemarks: {
    fontSize: 14,
    color: "#777",
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: "flex-end",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  addRecordButton: {
    backgroundColor: "#6256B1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  addRecordButtonText: {
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
    alignSelf: "flex-start",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  modalInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
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

export default HeadCircumferenceGrowthComponent;
