import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

type Frequency = 'daily' | 'twiceDaily' | 'weekly' | 'asNeeded';

export const AddMedicationScreen: React.FC = () => {
  const router = useRouter();

  // Form state
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [scheduleTime, setScheduleTime] = useState('8:00 PM');
  const [startDate, setStartDate] = useState('January 1, 2025');
  const [purpose, setPurpose] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const dosageUnits = ['mg', 'ml', 'g', 'IU', 'drops', 'tablets'];

  const frequencyOptions = [
    { id: 'daily' as Frequency, label: 'Daily' },
    { id: 'twiceDaily' as Frequency, label: 'Twice daily' },
    { id: 'weekly' as Frequency, label: 'Weekly' },
    { id: 'asNeeded' as Frequency, label: 'As needed' },
  ];

  const handleSave = () => {
    // Validate required fields
    if (!medicationName.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }

    if (!dosage.trim()) {
      Alert.alert('Error', 'Please enter a dosage');
      return;
    }

    // TODO: Save to backend
    Alert.alert(
      'Success',
      'Medication added successfully!',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medication</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
          <Ionicons name="checkmark" size={24} color={Colors.primary.light} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Medication Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Medication Name*</Text>
          <TextInput
            style={styles.input}
            value={medicationName}
            onChangeText={setMedicationName}
            placeholder="e.g., Vitamin D3"
            placeholderTextColor={Colors.inactive}
          />
        </View>

        {/* Dosage */}
        <View style={styles.section}>
          <Text style={styles.label}>Dosage*</Text>
          <View style={styles.dosageContainer}>
            <TextInput
              style={styles.dosageInput}
              value={dosage}
              onChangeText={setDosage}
              placeholder="1000"
              placeholderTextColor={Colors.inactive}
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={styles.unitDropdown}
              onPress={() => setShowUnitDropdown(!showUnitDropdown)}
            >
              <Text style={styles.unitText}>{dosageUnit}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.inactive} />
            </TouchableOpacity>
          </View>
          
          {showUnitDropdown && (
            <View style={styles.dropdownMenu}>
              {dosageUnits.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setDosageUnit(unit);
                    setShowUnitDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.label}>Frequency*</Text>
          <View style={styles.frequencyContainer}>
            {frequencyOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.frequencyButton,
                  frequency === option.id && styles.frequencyButtonActive,
                ]}
                onPress={() => setFrequency(option.id)}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    frequency === option.id && styles.frequencyButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.label}>Schedule</Text>
          <Text style={styles.subLabel}>When to take medication</Text>
          <TouchableOpacity style={styles.timeButton}>
            <Text style={styles.timeLabel}>Time:</Text>
            <Text style={styles.timeText}>{scheduleTime}</Text>
            <Ionicons name="time-outline" size={20} color={Colors.primary.light} />
          </TouchableOpacity>
        </View>

        {/* Start Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity style={styles.dateButton}>
            <Text style={styles.dateText}>{startDate}</Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.inactive} />
          </TouchableOpacity>
        </View>

        {/* Purpose */}
        <View style={styles.section}>
          <Text style={styles.labelOptional}>Purpose (Optional)</Text>
          <TextInput
            style={styles.input}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="e.g., Bone health support"
            placeholderTextColor={Colors.inactive}
          />
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.labelOptional}>Instructions (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="e.g., Take with food"
            placeholderTextColor={Colors.inactive}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Notification Toggle */}
        <View style={styles.notificationContainer}>
          <View style={styles.notificationLeft}>
            <Ionicons name="notifications-outline" size={24} color={Colors.primary.light} />
            <Text style={styles.notificationText}>Notify 30 minutes before</Text>
          </View>
          <Switch
            value={notifyEnabled}
            onValueChange={setNotifyEnabled}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={notifyEnabled ? '#22C55E' : '#F3F4F6'}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  labelOptional: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 12,
    color: Colors.inactive,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    fontSize: 15,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dosageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dosageInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    fontSize: 15,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    minWidth: 100,
  },
  unitText: {
    fontSize: 15,
    color: Colors.dark,
  },
  dropdownMenu: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 15,
    color: Colors.dark,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  frequencyButtonActive: {
    backgroundColor: '#3B82F6',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
  },
  frequencyButtonTextActive: {
    color: Colors.white,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  timeLabel: {
    fontSize: 15,
    color: Colors.inactive,
  },
  timeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 15,
    color: Colors.dark,
  },
  textArea: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationText: {
    fontSize: 15,
    color: Colors.dark,
  },
});
