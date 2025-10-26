import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import SubScreenHeader from '../../components/SubScreenHeader';
import { router } from 'expo-router'; // Direct import of router
import { useGlobalContext } from '../../context/GlobalProvider'; // Import global context

const MealReminders = () => {
  const [reminders, setReminders] = useState(null);
  const { user, currentBaby } = useGlobalContext(); // Get user and currentBaby from global context

  // Load reminders from the file system for the current baby
  useEffect(() => {
    const loadReminders = async () => {
      const fileName = `${user.email}_${currentBaby}_reminders.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      const fileExists = await FileSystem.getInfoAsync(fileUri);

      if (fileExists.exists) {
        const remindersJSON = await FileSystem.readAsStringAsync(fileUri);
        const savedReminders = JSON.parse(remindersJSON);
        setReminders(savedReminders);
      }
    };

    loadReminders();
  }, [user, currentBaby]);

  if (!reminders) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <SubScreenHeader goBackPath={'/feeding'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No meal reminders found for {currentBaby}.</Text>
        </View>
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => router.push('/feeding/setreminder')}
            style={{ backgroundColor: '#7360f2', padding: 12, borderRadius: 8 }}
          >
            <Text style={{ textAlign: 'center', color: '#ffffff', fontSize: 16 }}>Add Reminder</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Handle reminder deletion
  const deleteReminder = async (index) => {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to delete this reminder?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            // Remove the selected reminder
            const updatedReminders = { ...reminders };
            const deletedMeal = updatedReminders.meals[index];
            updatedReminders.meals.splice(index, 1);

            // Save updated reminders to the file system
            const fileName = `${user.email}_${currentBaby}_reminders.json`;
            const remindersJSON = JSON.stringify(updatedReminders);
            await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + fileName, remindersJSON);

            // Cancel the scheduled notification (assuming each reminder is scheduled by a unique identifier)
            const notificationIds = deletedMeal.notificationIds || [];
            for (const id of notificationIds) {
              await Notifications.cancelScheduledNotificationAsync(id);
            }

            // Update state
            setReminders(updatedReminders);
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  // Render each meal reminder
  const renderMealReminder = ({ item, index }) => (
    <View
      key={index}
      style={{
        padding: 16,
        margin: 8,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Meal: {item.meal}</Text>
      <Text style={{ fontSize: 14 }}>Time: {item.time}</Text>
      <Text style={{ fontSize: 14 }}>Notification Times: {getNotificationTimesString(reminders.notificationTimes)}</Text>
      <Text style={{ fontSize: 14 }}>Days: {reminders.selectedDays.join(', ')}</Text>

      {/* Edit and Delete Buttons in a Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        {/* Edit Button */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/feeding/setreminder', params: { editMode: true, meal: item, index } })}
          style={{ padding: 10, backgroundColor: '#7360f2', borderRadius: 6, width: '45%' }}
        >
          <Text style={{ textAlign: 'center', color: '#ffffff' }}>Edit</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={() => deleteReminder(index)}
          style={{ padding: 10, backgroundColor: '#e63946', borderRadius: 6, width: '45%' }}
        >
          <Text style={{ textAlign: 'center', color: '#ffffff' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Convert notification times object to a string
  const getNotificationTimesString = (notificationTimes) => {
    return Object.keys(notificationTimes)
      .filter((time) => notificationTimes[time])
      .join(', ');
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#ffffff', flex: 1 }}>
      <SubScreenHeader goBackPath={'/feeding'} />
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Meal Reminders for {currentBaby}</Text>
      </View>

      <FlatList
        data={reminders.meals}
        renderItem={renderMealReminder}
        keyExtractor={(item, index) => index.toString()}
      />

      {/* Add a button to go to SetReminder screen */}
      <View style={{ padding: 16 }}>
        <TouchableOpacity
          onPress={() => router.push('/feeding/setreminder')}
          style={{ backgroundColor: '#7360f2', padding: 12, borderRadius: 8 }}
        >
          <Text style={{ textAlign: 'center', color: '#ffffff', fontSize: 16 }}>Add Reminder</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MealReminders;
