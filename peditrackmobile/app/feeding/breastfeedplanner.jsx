import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import * as Notifications from 'expo-notifications';  
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubScreenHeader from '../../components/SubScreenHeader';
import { useGlobalContext } from '../../context/GlobalProvider';

// Set up notification handler to show alert, play sound, and set badge
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const BreastFeedPlanner = () => {
  const [sessions, setSessions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [sessionTime, setSessionTime] = useState(new Date());
  const [sessionSide, setSessionSide] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [bellStates, setBellStates] = useState({});
  const { user, currentBaby, babies } = useGlobalContext();

  const currentBabyData = babies.find(
    (baby) => baby.babyName === currentBaby && baby.userMail === user.email
  );

  // Load sessions for the current baby from storage
  useEffect(() => {
    loadSessionsFromStorage();
  }, [user, currentBaby]);

  // Save sessions to AsyncStorage for the current baby
  const saveSessionsToStorage = async (sessions) => {
    try {
      const key = `${user.email}_${currentBaby}_breastfeedingSessions`;
      await AsyncStorage.setItem(key, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions to storage:', error);
    }
  };

  // Load sessions from AsyncStorage for the current baby
  const loadSessionsFromStorage = async () => {
    try {
      const key = `${user.email}_${currentBaby}_breastfeedingSessions`;
      const storedSessions = await AsyncStorage.getItem(key);
      if (storedSessions !== null) {
        const parsedSessions = JSON.parse(storedSessions).map((session) => ({
          ...session,
          time: new Date(session.time),
        }));
        setSessions(parsedSessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading sessions from storage:', error);
    }
  };

  // Schedule notification
  const scheduleNotification = async (session) => {
    const now = new Date();
    let triggerDate = new Date(session.time);
    
    // Ensure the notification is set for a future time
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Breastfeeding Reminder: Feed ${session.id}`,
          body: `It's time to breastfeed on the ${session.side} side for ${session.duration} minutes.`,
        },
        trigger: { date: triggerDate, repeats: true },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const addSession = async () => {
    const currentDate = new Date();
    let scheduledTime = new Date(sessionTime);

    // Adjust the scheduled time to be in the future
    if (scheduledTime <= currentDate) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const newSession = {
      id: editingSessionId ? editingSessionId : sessions.length + 1,
      time: scheduledTime,
      side: sessionSide,
      duration: sessionDuration,
    };

    // Schedule the notification and get the ID
    const notificationId = await scheduleNotification(newSession);
    newSession.notificationId = notificationId;

    let updatedSessions;
    if (editingSessionId) {
      updatedSessions = sessions.map((session) =>
        session.id === editingSessionId ? newSession : session
      );
      setEditingSessionId(null);
    } else {
      updatedSessions = [...sessions, newSession];
    }

    setSessions(updatedSessions);
    saveSessionsToStorage(updatedSessions);
    setModalVisible(false);
  };

  const deleteSession = async (sessionId) => {
    const sessionToDelete = sessions.find((session) => session.id === sessionId);
    
    // Cancel the scheduled notification
    if (sessionToDelete && sessionToDelete.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(sessionToDelete.notificationId);
    }

    // Remove the session and save the updated list
    const updatedSessions = sessions.filter((session) => session.id !== sessionId);
    setSessions(updatedSessions);
    saveSessionsToStorage(updatedSessions);
  };

  const editSession = (session) => {
    setSessionTime(new Date(session.time));
    setSessionSide(session.side);
    setSessionDuration(session.duration);
    setEditingSessionId(session.id);
    setModalVisible(true);
  };

  const onChangeTime = (event, selectedDate) => {
    setShowTimePicker(false);
    const currentDate = selectedDate || sessionTime;
    setSessionTime(currentDate);
  };

  const toggleBell = (sessionId) => {
    setBellStates((prevState) => ({
      ...prevState,
      [sessionId]: !prevState[sessionId],
    }));
  };

  const renderRadioButton = (label) => (
    <TouchableOpacity
      onPress={() => setSessionSide(label)}
      className="flex-row items-center mb-2"
    >
      <View
        className={`h-5 w-5 rounded-full border-2 mr-2 ${
          sessionSide === label ? 'border-purple-600 bg-purple-600' : 'border-gray-400'
        }`}
      />
      <Text>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="bg-white flex-1">
      <SubScreenHeader title="Breastfeeding Planner" goBackPath="/feeding" />
      <View className="flex-1 p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1">
            {sessions.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-center text-gray-500">No Sessions Added</Text>
              </View>
            ) : (
              sessions.reduce((resultArray, item, index) => {
                const chunkIndex = Math.floor(index / 2);
                if (!resultArray[chunkIndex]) {
                  resultArray[chunkIndex] = [];
                }
                resultArray[chunkIndex].push(item);
                return resultArray;
              }, []).map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row -mx-1 mb-2">
                  {row.map((session) => (
                    <View key={session.id} className="w-1/2 px-1">
                      <View className="bg-gray-100 rounded-md p-4">
                        <View className="flex-row justify-between">
                          <Text className="text-lg font-bold">Feed {session.id}</Text>
                          <TouchableOpacity onPress={() => toggleBell(session.id)}>
                            <Ionicons
                              name={bellStates[session.id] ? 'notifications' : 'notifications-outline'}
                              size={24}
                              color={bellStates[session.id] ? '#7360f2' : 'black'}
                            />
                          </TouchableOpacity>
                        </View>
                        <Text className="text-sm">Time: {session.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        <Text className="text-sm">Side: {session.side}, Duration: {session.duration} min</Text>
                        <View className="flex-row mt-2 space-x-2">
                          <TouchableOpacity
                            onPress={() => editSession(session)}
                            className="flex-1 bg-purple-200 rounded-md py-1 px-2"
                          >
                            <Text className="text-purple-600 text-center">Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => deleteSession(session.id)}
                            className="flex-1 bg-red-200 rounded-md py-1 px-2"
                          >
                            <Text className="text-red-600 text-center">Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="absolute bottom-5 left-5 right-5 bg-purple-600 rounded-md py-3 flex-row justify-center items-center"
      >
        <Ionicons name="add-circle-outline" size={24} color="white" />
        <Text className="text-white text-lg ml-2">Add Sessions</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView intensity={90} tint="dark" className="flex-1 justify-center items-center">
          <View className="w-3/4 bg-white p-6 rounded-lg">
            <Text className="text-lg font-bold mb-4">Add Breastfeeding Session</Text>

            {/* Time Picker */}
            <TouchableOpacity onPress={() => setShowTimePicker(true)} className="border-b-2 border-gray-300 mb-4 p-2">
              <Text>{sessionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={sessionTime}
                mode="time"
                display="default"
                onChange={onChangeTime}
              />
            )}

            <Text className="font-bold mb-2">Select Side:</Text>
            {renderRadioButton('Left')}
            {renderRadioButton('Right')}

            <TextInput
              placeholder="Enter Duration (min)"
              value={sessionDuration}
              onChangeText={setSessionDuration}
              keyboardType="numeric"
              className="border-b-2 border-gray-300 mb-4 p-2"
            />

            <TouchableOpacity onPress={addSession} className="mt-4 py-3 bg-purple-600 rounded-md">
              <Text className="text-center text-white text-lg">{editingSessionId ? 'Edit Session' : 'Add Session'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} className="mt-4 py-2">
              <Text className="text-center text-purple-600">Cancel</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
};

export default BreastFeedPlanner;
