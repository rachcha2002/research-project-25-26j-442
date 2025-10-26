import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';  
import { BlurView } from 'expo-blur';  
import * as FileSystem from 'expo-file-system';
import SubScreenHeader from '../../components/SubScreenHeader'; 
import { images } from '../../constants'; // Assuming you have images imported from a constants file

const DailyMealPlanner = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [meals, setMeals] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [newMeal, setNewMeal] = useState('');
  const [editingMealIndex, setEditingMealIndex] = useState(null); // State to track which meal is being edited

  const mealFilePath = `${FileSystem.documentDirectory}meals.json`;

  useEffect(() => {
    loadMealsFromStorage(); 
  }, []);

  const saveMealsToStorage = async (updatedMeals) => {
    try {
      await FileSystem.writeAsStringAsync(mealFilePath, JSON.stringify(updatedMeals));
      setMeals(updatedMeals);
    } catch (error) {
      console.error('Error saving meals to storage:', error);
    }
  };

  const loadMealsFromStorage = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(mealFilePath);
      
      if (!fileInfo.exists) {
        // If the file doesn't exist, create it with an empty object
        await FileSystem.writeAsStringAsync(mealFilePath, JSON.stringify({}));
        setMeals({});
      } else {
        const storedMeals = await FileSystem.readAsStringAsync(mealFilePath);
        setMeals(JSON.parse(storedMeals));
      }
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  };

  const handleAddMeal = () => {
    const updatedMeals = {
      ...meals,
      [selectedDate]: editingMealIndex !== null
        ? meals[selectedDate].map((meal, index) =>
            index === editingMealIndex ? newMeal : meal
          )
        : [...(meals[selectedDate] || []), newMeal],
    };
    saveMealsToStorage(updatedMeals);
    setModalVisible(false);
    setNewMeal('');
    setEditingMealIndex(null); // Reset edit index
  };

  const handleEditMeal = (index) => {
    setNewMeal(meals[selectedDate][index]);
    setEditingMealIndex(index);
    setModalVisible(true);
  };

  const handleDeleteMeal = (index) => {
    const updatedMeals = {
      ...meals,
      [selectedDate]: meals[selectedDate].filter((_, i) => i !== index),
    };
    saveMealsToStorage(updatedMeals);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <SubScreenHeader title="Daily Meal Planner" goBackPath="/feeding" />

      <ScrollView className="p-4">
        {/* Calendar Section */}
        <Text className="text-xl font-bold text-purple-700">September 2024</Text>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, marked: true, selectedColor: '#6B46C1' },
          }}
          theme={{
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#6B46C1',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#00adf5',
            dayTextColor: '#2d4150',
            arrowColor: '#6B46C1',
            monthTextColor: '#6B46C1',
          }}
        />

        {/* Meals for the Selected Date */}
        <View className={`mt-4 ${meals[selectedDate]?.length === 0 ? 'justify-center flex-1' : ''}`}>
          <Text className="text-lg font-semibold text-purple-700">
            {selectedDate ? `Meals for ${selectedDate}` : 'Select a date to view or add meals'}
          </Text>
          {meals[selectedDate]?.map((meal, index) => (
            <View key={index} className="mt-2 p-2 bg-[#EAE6F8] rounded-lg flex-row justify-between items-center">
              <View>
                <Text className="text-base text-black">{`Meal ${index + 1}: ${meal}`}</Text>
                <View className="flex-row space-x-4 mt-2">
                  <TouchableOpacity onPress={() => handleEditMeal(index)} className="bg-purple-200 px-3 py-1 rounded-md">
                    <Text className="text-purple-600">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteMeal(index)} className="bg-red-200 px-3 py-1 rounded-md">
                    <Text className="text-red-600">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Image source={images.meal} className="w-12 h-12 rounded-md" />
            </View>
          ))}

          {/* Add Meal Button */}
          {selectedDate && (
            <View className="items-center">
              <TouchableOpacity
                className="mt-4 px-4 py-3 bg-purple-600 rounded-lg w-1/2"
                onPress={() => setModalVisible(true)}
              >
                <Text className="text-white text-center font-semibold">Add Meal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Add Meal Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <BlurView intensity={90} tint="dark" className="flex-1 justify-center items-center">
            <View className="w-3/4 bg-white p-6 rounded-lg">
              <Text className="text-lg font-bold mb-4">{editingMealIndex !== null ? 'Edit Meal' : 'Add a New Meal'}</Text>
              <TextInput
                className="border p-2 mb-4 rounded-lg"
                placeholder="Enter meal name"
                value={newMeal}
                onChangeText={setNewMeal}
              />
              <View className="flex-row justify-between">
                <TouchableOpacity onPress={() => setModalVisible(false)} className="py-3 px-6 bg-purple-200 rounded-md">
                  <Text className="text-purple-600 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddMeal} className="py-3 px-6 bg-purple-600 rounded-md">
                  <Text className="text-white font-semibold">{editingMealIndex !== null ? 'Edit' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DailyMealPlanner;
