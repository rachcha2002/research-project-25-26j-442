import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useGlobalContext } from "../context/GlobalProvider"; // Adjust the path as needed
import { icons, images } from "../constants"; // Adjust the path as needed
import { router } from "expo-router";
import { Colors } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";

const MainHeader = ({ title }) => {
  const { user, babies, currentBaby, changeCurrentBaby } = useGlobalContext(); // Get babies, currentBaby, and the function to change the current baby
  const [modalVisible, setModalVisible] = useState(false); // State to control modal visibility

  // Function to handle baby selection
  const handleSelectBaby = (babyName) => {
    changeCurrentBaby(babyName); // Change the current baby in the global context
    setModalVisible(false); // Close the modal
  };

  return (
    <View
      style={{
        padding: 15,
        backgroundColor: Colors.PRIMARY,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        flexDirection: "column", // Fix the typo "colomn" to "column"
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Image
          source={images.peditracklogo} // Replace with the correct path for your logo
          style={{
            width: 140,
            height: 40,
          }}
          resizeMode="contain"
        />
        <TouchableOpacity
          onPress={() => {
            router.push("/profile/profilescreen");
          }}
        >
          <Image
            source={{ uri: user?.imageUrl }}
            style={{
              width: 45,
              height: 45,
              borderRadius: 50,
            }}
          />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text
        style={{
          color: "#fff",
          fontSize: 25,
          fontWeight: "bold",
          alignSelf: "left",
          marginTop: -2,
        }}
      >
        {title}
      </Text>

      {/* Baby Selection Button*/}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 2,
          alignItems: "center",
        }}
      >
        {/* Custom Baby Selection Button */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
          onPress={() => setModalVisible(true)} // Open modal on button click
        >
          <Text style={{ color: "#fff", fontSize: 16 }}>
            {currentBaby ? `${currentBaby}` : "No Baby Selected"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal for Baby Selection */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)} // Close the modal when back button is pressed
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Baby</Text>
            <FlatList
              data={babies}
              keyExtractor={(item) => item.babyName}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.babyItem}
                  onPress={() => handleSelectBaby(item.babyName)} // Set the selected baby
                >
                  <Text style={styles.babyItemText}>{item.babyName}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(false)} // Close the modal
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MainHeader;

// Modal styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: 300,
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  babyItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  babyItemText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: Colors.PRIMARY,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
