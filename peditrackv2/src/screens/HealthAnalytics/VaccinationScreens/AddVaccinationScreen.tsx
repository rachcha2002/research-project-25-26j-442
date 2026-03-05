import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  addVaccination,
  updateVaccination,
  getVaccinationById,
  getVaccineTypes,
  seedVaccineTypes,
  Vaccination,
  VaccineType,
} from '@/services/healthAnalyticsService';
import { useBaby } from '@/contexts/BabyContext';
import { scheduleVaccinationReminder, cancelVaccinationReminder } from '@/services/pushNotificationService';

export const AddVaccinationScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { selectedBaby } = useBaby();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [vaccineTypes, setVaccineTypes] = useState<VaccineType[]>([]);

  // Form state
  const [vaccineName, setVaccineName] = useState('');
  const [vaccineType, setVaccineType] = useState('');
  const [doseNumber, setDoseNumber] = useState('1');
  const [totalDoses, setTotalDoses] = useState('1');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [administeredDate, setAdministeredDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<'scheduled' | 'completed' | 'overdue' | 'skipped'>('scheduled');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [providerName, setProviderName] = useState('');
  const [providerContact, setProviderContact] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [sideEffects, setSideEffects] = useState('');

  const [showScheduledDatePicker, setShowScheduledDatePicker] = useState(false);
  const [showAdministeredDatePicker, setShowAdministeredDatePicker] = useState(false);
  
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderOffsetDays, setReminderOffsetDays] = useState(1);

  useEffect(() => {
    loadVaccineTypes();
    if (isEditMode && id) {
      loadVaccination();
    }
  }, [id]);

  const loadVaccineTypes = async () => {
    try {
      const types = await getVaccineTypes();
      setVaccineTypes(types);
      
      if (types.length === 0) {
        Alert.alert(
          'No Vaccine Types',
          'No vaccine types found. Would you like to load default vaccines?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Load Defaults',
              onPress: async () => {
                try {
                  await seedVaccineTypes();
                  const freshTypes = await getVaccineTypes();
                  setVaccineTypes(freshTypes);
                  Alert.alert('Success', 'Vaccine types loaded successfully');
                } catch (error) {
                  Alert.alert('Error', 'Failed to load vaccine types');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error loading vaccine types:', error);
      Alert.alert('Error', 'Failed to load vaccine types');
    }
  };

  const loadVaccination = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getVaccinationById(id as string);
      
      setVaccineName(data.vaccineName);
      setVaccineType(data.vaccineType || '');
      setDoseNumber(data.doseNumber.toString());
      setTotalDoses(data.totalDoses.toString());
      setStatus(data.status);
      
      if (data.scheduledDate) {
        setScheduledDate(new Date(data.scheduledDate));
      }
      if (data.administeredDate) {
        setAdministeredDate(new Date(data.administeredDate));
      }
      
      setClinicName(data.location?.clinic || '');
      setClinicAddress(data.location?.address || '');
      setProviderName(data.provider?.name || '');
      setProviderContact(data.provider?.contact || '');
      setBatchNumber(data.batchNumber || '');
      setNotes(data.notes || '');
      setSideEffects(data.sideEffects?.join(', ') || '');
      
      if (data.reminderEnabled !== undefined) setReminderEnabled(data.reminderEnabled);
      if (data.reminderOffsetDays !== undefined) setReminderOffsetDays(data.reminderOffsetDays);
    } catch (error) {
      console.error('Error loading vaccination:', error);
      Alert.alert('Error', 'Failed to load vaccination details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBaby) {
      Alert.alert('Error', 'No baby selected');
      return;
    }

    if (!vaccineName.trim()) {
      Alert.alert('Validation Error', 'Please enter vaccine name');
      return;
    }

    const dose = parseInt(doseNumber);
    const total = parseInt(totalDoses);

    if (isNaN(dose) || dose < 1) {
      Alert.alert('Validation Error', 'Dose number must be at least 1');
      return;
    }

    if (isNaN(total) || total < 1) {
      Alert.alert('Validation Error', 'Total doses must be at least 1');
      return;
    }

    if (dose > total) {
      Alert.alert('Validation Error', 'Dose number cannot exceed total doses');
      return;
    }

    try {
      setSaving(true);

      const vaccinationData: Partial<Vaccination> = {
        babyId: selectedBaby._id,
        vaccineName: vaccineName.trim(),
        vaccineType: vaccineType.trim() || undefined,
        doseNumber: dose,
        totalDoses: total,
        scheduledDate: scheduledDate.toISOString(),
        administeredDate: administeredDate?.toISOString() || undefined,
        status,
        location: {
          clinic: clinicName.trim() || undefined,
          address: clinicAddress.trim() || undefined,
        },
        provider: {
          name: providerName.trim() || undefined,
          contact: providerContact.trim() || undefined,
        },
        batchNumber: batchNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        sideEffects: sideEffects.trim() ? sideEffects.split(',').map(s => s.trim()) : undefined,
        reminderEnabled,
        reminderOffsetDays: reminderEnabled ? reminderOffsetDays : undefined,
      };

      if (isEditMode && id) {
        await updateVaccination(id as string, vaccinationData);
        // Clear any old reminders for this vaccination
        await cancelVaccinationReminder(id as string);
        
        // Try to schedule the replacement (it won't do anything if not 'scheduled')
        // We need the full object to schedule, so merge `id` in
        await scheduleVaccinationReminder({ _id: id as string, ...vaccinationData } as Vaccination);
        
        Alert.alert('Success', 'Vaccination updated successfully');
      } else {
        const newVaccine = await addVaccination(vaccinationData);
        // addVaccination returns the created record containing the _id. Schedule it!
        await scheduleVaccinationReminder(newVaccine);
        
        Alert.alert('Success', 'Vaccination added successfully');
      }

      router.back();
    } catch (error) {
      console.error('Error saving vaccination:', error);
      Alert.alert('Error', 'Failed to save vaccination');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <SecondaryTopBar />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.title}>{isEditMode ? 'Edit Vaccination' : 'Add Vaccination'}</Text>

          {/* Vaccine Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Vaccine Name *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowVaccineModal(true)}
            >
              <Text style={vaccineName ? styles.dropdownText : styles.dropdownPlaceholder}>
                {vaccineName || 'Select vaccine'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={Colors.inactive}
              />
            </TouchableOpacity>

            {vaccineName === 'Other' && (
              <TextInput
                placeholder="Enter vaccine name"
                value={vaccineType}
                onChangeText={setVaccineType}
                style={[styles.input, { marginTop: 8 }]}
              />
            )}
          </View>

          {/* Vaccine Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Vaccine Type (Optional)</Text>
            <TextInput
              placeholder="e.g., DTaP, MMR"
              value={vaccineType}
              onChangeText={setVaccineType}
              style={styles.input}
            />
          </View>

          {/* Dose Information */}
          <View style={styles.row}>
            <View style={styles.halfSection}>
              <Text style={styles.label}>Dose Number *</Text>
              <TextInput
                placeholder="1"
                value={doseNumber}
                onChangeText={setDoseNumber}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
            <View style={styles.halfSection}>
              <Text style={styles.label}>Total Doses *</Text>
              <TextInput
                placeholder="1"
                value={totalDoses}
                onChangeText={setTotalDoses}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {(['scheduled', 'completed', 'overdue', 'skipped'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusButton, status === s && styles.statusButtonActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.statusButtonText, status === s && styles.statusButtonTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Scheduled Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Scheduled Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowScheduledDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.inactive} />
              <Text style={styles.dateText}>{scheduledDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>

          {showScheduledDatePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowScheduledDatePicker(Platform.OS === 'ios');
                if (date) setScheduledDate(date);
              }}
            />
          )}

          {/* Reminder Section */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Enable Reminder</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: '#D1D5DB', true: Colors.primary.light }}
                thumbColor={reminderEnabled ? Colors.primary.DEFAULT : '#f4f3f4'}
              />
            </View>

            {reminderEnabled && (
              <View style={[styles.section, { marginTop: 12, marginBottom: 0 }]}>
                <Text style={styles.label}>Remind me</Text>
                <View style={styles.statusRow}>
                  {[
                    { label: 'On day of', value: 0 },
                    { label: '1 day before', value: 1 },
                    { label: '2 days before', value: 2 },
                    { label: '1 week before', value: 7 },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.statusButton, reminderOffsetDays === option.value && styles.statusButtonActive]}
                      onPress={() => setReminderOffsetDays(option.value)}
                    >
                      <Text style={[styles.statusButtonText, reminderOffsetDays === option.value && styles.statusButtonTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Administered Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Administered Date (if completed)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowAdministeredDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.inactive} />
              <Text style={styles.dateText}>
                {administeredDate ? administeredDate.toLocaleDateString() : 'Not administered yet'}
              </Text>
            </TouchableOpacity>
            {administeredDate && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setAdministeredDate(null)}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {showAdministeredDatePicker && (
            <DateTimePicker
              value={administeredDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowAdministeredDatePicker(Platform.OS === 'ios');
                if (date) setAdministeredDate(date);
              }}
            />
          )}

          {/* Location Section */}
          <Text style={styles.sectionTitle}>Location Information</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Clinic Name</Text>
            <TextInput
              placeholder="Enter clinic name"
              value={clinicName}
              onChangeText={setClinicName}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Clinic Address</Text>
            <TextInput
              placeholder="Enter clinic address"
              value={clinicAddress}
              onChangeText={setClinicAddress}
              style={styles.input}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Provider Section */}
          <Text style={styles.sectionTitle}>Provider Information</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Provider Name</Text>
            <TextInput
              placeholder="Doctor's name"
              value={providerName}
              onChangeText={setProviderName}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Provider Contact</Text>
            <TextInput
              placeholder="Phone number"
              value={providerContact}
              onChangeText={setProviderContact}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          {/* Additional Information */}
          <Text style={styles.sectionTitle}>Additional Information</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Batch/Lot Number</Text>
            <TextInput
              placeholder="Enter batch number"
              value={batchNumber}
              onChangeText={setBatchNumber}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Side Effects (comma-separated)</Text>
            <TextInput
              placeholder="e.g., Fever, Soreness, Fatigue"
              value={sideEffects}
              onChangeText={setSideEffects}
              style={styles.input}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              placeholder="Additional notes"
              value={notes}
              onChangeText={setNotes}
              style={styles.textArea}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, saving && styles.disabledButton]}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{isEditMode ? 'Update' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Full-screen loader overlay */}
        {saving && (
          <View style={styles.loaderOverlay}>
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
              <Text style={styles.loaderText}>
                {isEditMode ? 'Updating vaccination...' : 'Saving vaccination...'}
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Vaccine Selection Modal */}
      <Modal
        visible={showVaccineModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVaccineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vaccine</Text>
              <TouchableOpacity onPress={() => setShowVaccineModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={vaccineTypes}
              keyExtractor={(item) => item._id || item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setVaccineName(item.name);
                    setTotalDoses(item.recommendedDoses.toString());
                    setShowVaccineModal(false);
                  }}
                >
                  <View>
                    <Text style={styles.modalItemText}>{item.name}</Text>
                    {item.ageRecommendations && (
                      <Text style={styles.modalItemSubtext}>
                        {item.recommendedDoses} doses • {item.ageRecommendations}
                      </Text>
                    )}
                  </View>
                  {vaccineName === item.name && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary.DEFAULT} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.inactive,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
    marginTop: 24,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  halfSection: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.dark,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: Colors.inactive,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusButtonActive: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
  },
  statusButtonTextActive: {
    color: Colors.white,
  },
  dateButton: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 16,
    color: Colors.dark,
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#EF4444',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark,
  },
  modalItemSubtext: {
    fontSize: 12,
    color: Colors.inactive,
    marginTop: 4,
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
