import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBaby } from '@/contexts/BabyContext';
import { addMedication, updateMedication, getMedicationById, Medication } from '@/services/healthAnalyticsService';
import { scheduleMedicationReminders, cancelMedicationReminders } from '@/services/pushNotificationService';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';

// Updated: 2026-02-18

type RouteType = 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';

export const AddMedicationScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { selectedBaby } = useBaby();
  
  const editMode = !!params.id;
  const medicationId = params.id as string;

  // Form state
  const [loading, setLoading] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [dosageAmount, setDosageAmount] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [frequency, setFrequency] = useState('');
  const [route, setRoute] = useState<RouteType>('oral');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [hasEndDate, setHasEndDate] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  
  // Prescription fields
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  
  // Reminder fields
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<string[]>(['08:00']);
  const [initialReminderTimes, setInitialReminderTimes] = useState<string[]>([]);
  
  // UI state
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);

  const dosageUnits = ['mg', 'ml', 'g', 'IU', 'drops', 'tablets'];
  const routes: RouteType[] = ['oral', 'topical', 'injection', 'inhalation', 'other'];

  useEffect(() => {
    if (editMode && medicationId) {
      loadMedication();
    }
  }, [editMode, medicationId]);

  const loadMedication = async () => {
    try {
      setLoading(true);
      const medication = await getMedicationById(medicationId);
      
      setMedicationName(medication.name);
      setDosageAmount(medication.dosage.amount.toString());
      setDosageUnit(medication.dosage.unit);
      setFrequency(medication.frequency);
      setRoute(medication.route as RouteType);
      setStartDate(new Date(medication.startDate));
      
      if (medication.endDate) {
        setEndDate(new Date(medication.endDate));
        setHasEndDate(true);
      }
      
      setPurpose(medication.purpose || '');
      setNotes(medication.notes || '');
      
      if (medication.prescribedBy) {
        setDoctorName(medication.prescribedBy.doctorName || '');
        setClinicName(medication.prescribedBy.clinicName || '');
        setContactNumber(medication.prescribedBy.contactNumber || '');
      }
      
      setPrescriptionNumber(medication.prescriptionNumber || '');
      setReminderEnabled(medication.reminderEnabled || false);
      const initialTimes = medication.reminderTimes && medication.reminderTimes.length > 0 ? medication.reminderTimes : ['08:00'];
      setReminderTimes(initialTimes);
      setInitialReminderTimes(initialTimes);
      
    } catch (error) {
      console.error('Error loading medication:', error);
      Alert.alert('Error', 'Failed to load medication');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!medicationName.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }

    if (!dosageAmount.trim() || parseFloat(dosageAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid dosage');
      return;
    }

    if (!frequency.trim()) {
      Alert.alert('Error', 'Please enter frequency');
      return;
    }

    if (!selectedBaby) {
      Alert.alert('Error', 'Please select a baby profile first');
      return;
    }

    setLoading(true);
    try {
      const medicationData: Partial<Medication> = {
        babyId: selectedBaby._id,
        name: medicationName.trim(),
        dosage: {
          amount: parseFloat(dosageAmount),
          unit: dosageUnit,
        },
        frequency: frequency.trim(),
        route,
        startDate: startDate.toISOString(),
        endDate: hasEndDate && endDate ? endDate.toISOString() : undefined,
        purpose: purpose.trim() || undefined,
        notes: notes.trim() || undefined,
        prescribedBy: (doctorName || clinicName || contactNumber) ? {
          doctorName: doctorName.trim() || '',
          clinicName: clinicName.trim() || undefined,
          contactNumber: contactNumber.trim() || undefined,
        } as { doctorName: string; clinicName?: string; contactNumber?: string } : undefined,
        prescriptionNumber: prescriptionNumber.trim() || undefined,
        reminderEnabled,
        reminderTimes: reminderEnabled ? reminderTimes : [],
        status: 'active',
      };

      let result;
      if (editMode && medicationId) {
        // Cancel old ones strictly before re-saving scheduling
        await cancelMedicationReminders(medicationId, initialReminderTimes);
        result = await updateMedication(medicationId, medicationData);
      } else {
        result = await addMedication(medicationData);
      }

      // Schedule new pushes if enabled
      if (result.reminderEnabled) {
        await scheduleMedicationReminders(result);
      }

      Alert.alert(
        'Success',
        editMode ? 'Medication updated successfully!' : 'Medication added successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', editMode ? 'Failed to update medication' : 'Failed to add medication');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const addReminderTime = () => {
    if (reminderTimes.length < 5) {
      setReminderTimes([...reminderTimes, '12:00']);
    }
  };

  const removeReminderTime = (index: number) => {
    if (reminderTimes.length > 1) {
      setReminderTimes(reminderTimes.filter((_, i) => i !== index));
    }
  };

  const updateReminderTime = (index: number, time: string) => {
    const newTimes = [...reminderTimes];
    newTimes[index] = time;
    setReminderTimes(newTimes);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime && event.type !== 'dismissed') {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      updateReminderTime(currentTimeIndex, timeString);
    }
  };

  return (
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
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
              placeholder="e.g., Amoxicillin"
              placeholderTextColor={Colors.inactive}
            />
          </View>

          {/* Dosage */}
          <View style={styles.section}>
            <Text style={styles.label}>Dosage*</Text>
            <View style={styles.dosageContainer}>
              <TextInput
                style={styles.dosageInput}
                value={dosageAmount}
                onChangeText={setDosageAmount}
                placeholder="250"
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
            <TextInput
              style={styles.input}
              value={frequency}
              onChangeText={setFrequency}
              placeholder="e.g., Three times daily, Every 8 hours"
              placeholderTextColor={Colors.inactive}
            />
          </View>

          {/* Route */}
          <View style={styles.section}>
            <Text style={styles.label}>Route</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowRouteDropdown(!showRouteDropdown)}
            >
              <View style={styles.dropdownTrigger}>
                <Text style={styles.dropdownValue}>{route.charAt(0).toUpperCase() + route.slice(1)}</Text>
                <Ionicons name="chevron-down" size={16} color={Colors.inactive} />
              </View>
            </TouchableOpacity>
            
            {showRouteDropdown && (
              <View style={styles.dropdownMenu}>
                {routes.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setRoute(r);
                      setShowRouteDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Start Date*</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
              <Text style={styles.dateText}>{startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.inactive} />
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowStartDatePicker(Platform.OS === 'ios');
                  if (date) setStartDate(date);
                }}
              />
            )}
          </View>

          {/* End Date Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.label}>Set end date?</Text>
            <Switch
              value={hasEndDate}
              onValueChange={(value) => {
                setHasEndDate(value);
                if (value && !endDate) {
                  setEndDate(new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)); // 7 days later
                }
              }}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={hasEndDate ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          {/* End Date */}
          {hasEndDate && (
            <View style={styles.section}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
                <Text style={styles.dateText}>{endDate?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                <Ionicons name="calendar-outline" size={20} color={Colors.inactive} />
              </TouchableOpacity>
              {showEndDatePicker && endDate && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  minimumDate={startDate}
                  onChange={(event, date) => {
                    setShowEndDatePicker(Platform.OS === 'ios');
                    if (date) setEndDate(date);
                  }}
                />
              )}
            </View>
          )}

          {/* Purpose */}
          <View style={styles.section}>
            <Text style={styles.labelOptional}>Purpose (Optional)</Text>
            <TextInput
              style={styles.input}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="e.g., Treat ear infection"
              placeholderTextColor={Colors.inactive}
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.labelOptional}>Notes (Optional)</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., Take with food, avoid dairy"
              placeholderTextColor={Colors.inactive}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Prescription Details */}
          <Text style={styles.sectionHeader}>Prescription Details (Optional)</Text>

          <View style={styles.section}>
            <Text style={styles.labelOptional}>Doctor Name</Text>
            <TextInput
              style={styles.input}
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="Dr. Smith"
              placeholderTextColor={Colors.inactive}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.labelOptional}>Clinic/Hospital</Text>
            <TextInput
              style={styles.input}
              value={clinicName}
              onChangeText={setClinicName}
              placeholder="City Hospital"
              placeholderTextColor={Colors.inactive}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.labelOptional}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="+1 234 567 8900"
              placeholderTextColor={Colors.inactive}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.labelOptional}>Prescription Number</Text>
            <TextInput
              style={styles.input}
              value={prescriptionNumber}
              onChangeText={setPrescriptionNumber}
              placeholder="RX123456"
              placeholderTextColor={Colors.inactive}
            />
          </View>

          {/* Reminder Settings */}
          <Text style={styles.sectionHeader}>Reminders</Text>

          <View style={styles.toggleContainer}>
            <Text style={styles.label}>Enable reminders</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={reminderEnabled ? '#22C55E' : '#F3F4F6'}
            />
          </View>

          {reminderEnabled && (
            <View style={styles.section}>
              <Text style={styles.label}>Reminder Times</Text>
              {reminderTimes.map((time, index) => (
                <View key={index} style={styles.reminderTimeRow}>
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => {
                      setCurrentTimeIndex(index);
                      setShowTimePicker(true);
                    }}
                  >
                    <Ionicons name="time-outline" size={20} color={Colors.primary.DEFAULT} />
                    <Text style={styles.timeText}>{time}</Text>
                  </TouchableOpacity>
                  {reminderTimes.length > 1 && (
                    <TouchableOpacity onPress={() => removeReminderTime(index)}>
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {reminderTimes.length < 5 && (
                <TouchableOpacity style={styles.addTimeButton} onPress={addReminderTime}>
                  <Ionicons name="add-circle-outline" size={20} color={Colors.primary.DEFAULT} />
                  <Text style={styles.addTimeText}>Add Time</Text>
                </TouchableOpacity>
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={(() => {
                    const [hours, minutes] = reminderTimes[currentTimeIndex].split(':');
                    const date = new Date();
                    date.setHours(parseInt(hours), parseInt(minutes));
                    return date;
                  })()}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
          
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.disabledButton]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>{editMode ? 'Update' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Full-screen loader overlay */}
        {loading && (
          <View style={styles.loaderOverlay}>
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
              <Text style={styles.loaderText}>
                {editMode ? 'Updating medication...' : 'Saving medication...'}
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
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
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginTop: 24,
    marginBottom: 16,
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 15,
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  reminderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    marginRight: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  addTimeText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary.DEFAULT,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderContainer: {
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
});
