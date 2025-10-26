import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useGlobalContext } from "../../context/GlobalProvider";

const BMICalculator = () => {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBMI] = useState(null);
  const [remarks, setRemarks] = useState("");
  const { currentBaby, user, babies } = useGlobalContext(); // Access the current baby and user from GlobalContext

  const currentBabyData = babies.find(
    (baby) => baby.babyName === currentBaby && baby.userMail === user.email
  );

  // Function to calculate BMI
  const calculateBMI = () => {
    if (!height || !weight) {
      Alert.alert("Validation Error", "Please enter both height and weight.");
      return;
    }

    const heightMeters = parseFloat(height) / 100; // Convert height to meters
    const bmiValue = parseFloat(weight) / (heightMeters * heightMeters);

    setBMI(bmiValue.toFixed(2)); // Set BMI value with 2 decimal points

    determineBMIRemarks(bmiValue);
  };

  // Function to give remarks based on BMI and baby's age
  const determineBMIRemarks = (bmiValue) => {
    const ageInMonths = calculateAgeInMonths(
      new Date(),
      currentBabyData.dateOfBirth
    );

    let bmiCategory = "Normal";
    if (ageInMonths < 24) {
      // Under 2 years
      if (bmiValue < 14) {
        bmiCategory = "Underweight";
      } else if (bmiValue > 18) {
        bmiCategory = "Overweight";
      }
    } else {
      // 2 years and above
      if (bmiValue < 15) {
        bmiCategory = "Underweight";
      } else if (bmiValue > 19) {
        bmiCategory = "Overweight";
      }
    }
    setRemarks(bmiCategory);
  };

  // Function to calculate age in months
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BMI Calculator</Text>

      <Text style={styles.label}>Height (in cm)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter height"
        keyboardType="decimal-pad"
        value={height}
        onChangeText={setHeight}
      />

      <Text style={styles.label}>Weight (in kg)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter weight"
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={setWeight}
      />

      <TouchableOpacity style={styles.button} onPress={calculateBMI}>
        <Text style={styles.buttonText}>Calculate BMI</Text>
      </TouchableOpacity>

      {bmi && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>BMI: {bmi}</Text>
          <Text style={styles.resultText}>Remarks: {remarks}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#6256B1",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  resultText: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 5,
  },
});

export default BMICalculator;
