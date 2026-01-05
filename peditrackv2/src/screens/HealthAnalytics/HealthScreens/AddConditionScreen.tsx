import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addHealthRecord, getHealthRecordById, updateHealthRecord } from '@/services/healthAnalyticsService';

type ConditionType = 'acute' | 'chronic' | 'resolved';
type Severity = 'mild' | 'moderate' | 'severe';
type Status = 'monitoring' | 'active' | 'resolved' | 'underTreatment';

export const AddConditionScreen: React.FC = () => {
  const router = useRouter();
  const { recordId } = useLocalSearchParams<{ recordId?: string }>();
  const isEditMode = !!recordId;
  
  // Form state
  const [conditionName, setConditionName] = useState('');
  const [type, setType] = useState<ConditionType>('chronic');
  const [severity, setSeverity] = useState<Severity>('moderate');
  const [diagnosisDate, setDiagnosisDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState<Status>('monitoring');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  
  // TODO: Get this from route params or context
  const [babyId] = useState('674525cc0a8a8b29b8a2bf9c'); // Temporary placeholder

  const symptoms = [
    { id: 'sneezing', label: 'Sneezing' },
    { id: 'runnyNose', label: 'Runny nose' },
    { id: 'itchyEyes', label: 'Itchy eyes' },
    { id: 'rash', label: 'Rash' },
  ];

  const statusOptions = [
    { id: 'monitoring' as Status, label: 'Monitoring' },
    { id: 'active' as Status, label: 'Active' },
    { id: 'resolved' as Status, label: 'Resolved' },
    { id: 'underTreatment' as Status, label: 'Under Treatment' },
  ];

  const toggleSymptom = (symptomId: string) => {
    if (selectedSymptoms.includes(symptomId)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomId]);
    }
  };

  const getStatusLabel = (statusId: Status) => {
    const option = statusOptions.find(s => s.id === statusId);
    return option ? option.label : '';
  };

  // Load existing record data if in edit mode
  useEffect(() => {
    const loadRecordData = async () => {
      if (!recordId) return;
      
      try {
        setLoadingData(true);
        const record = await getHealthRecordById(recordId);
        
        // Pre-fill form with existing data
        setConditionName(record.diagnosis || '');
        setSeverity(record.severity || 'moderate');
        if (record.recordDate) {
          setDiagnosisDate(new Date(record.recordDate));
        }
        setSelectedSymptoms(record.symptoms || []);
        setNotes(record.notes || record.doctorNotes || '');
        if (record.status) {
          setStatus(record.status as Status);
        }
        // Note: type is not in HealthRecord, keeping default
      } catch (error) {
        console.error('Error loading record:', error);
        Alert.alert('Error', 'Failed to load condition data');
        router.back();
      } finally {
        setLoadingData(false);
      }
    };

    loadRecordData();
  }, [recordId]);

  const handleSave = async () => {
    console.log('=== SAVE BUTTON PRESSED ===');
    console.log('Condition Name:', conditionName);
    console.log('Baby ID:', babyId);
    console.log('Status:', status);
    console.log('Severity:', severity);
    
    // Validate required fields
    if (!conditionName.trim()) {
      console.log('Validation failed: Empty condition name');
      Alert.alert('Error', 'Please enter a condition name');
      return;
    }

    if (!babyId) {
      console.log('Validation failed: No baby ID');
      Alert.alert('Error', 'Baby ID is required');
      return;
    }

    console.log('Validation passed, preparing to save...');
    setLoading(true);
    try {
      const healthRecordData = {
        babyId,
        recordDate: diagnosisDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        recordType: 'illness' as const, // Using 'illness' as default for conditions
        diagnosis: conditionName,
        severity: severity,
        status: status, // Add status field
        symptoms: selectedSymptoms,
        notes: notes.trim() || undefined,
      };

      console.log('Sending data to API:', JSON.stringify(healthRecordData, null, 2));
      
      let result;
      if (isEditMode && recordId) {
        // Update existing record
        result = await updateHealthRecord(recordId, healthRecordData);
        console.log('Update API Response:', result);
      } else {
        // Create new record
        result = await addHealthRecord(healthRecordData);
        console.log('Create API Response:', result);
      }
      
      Alert.alert(
        'Success',
        isEditMode ? 'Condition updated successfully!' : 'Condition saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('=== ERROR SAVING CONDITION ===');
      console.error('Error details:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'save'} condition. Please try again.`
      );
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDiagnosisDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
          {/* Title */}
          <Text style={styles.pageTitle}>{isEditMode ? 'Edit Condition' : 'Add Condition'}</Text>
          
          {/* Loading Indicator for Data Fetch */}
          {loadingData && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
              <Text style={styles.loadingText}>Loading condition data...</Text>
            </View>
          )}

          {!loadingData && (<>

          {/* Condition Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Condition Name*</Text>
            <TextInput
              style={styles.input}
              value={conditionName}
              onChangeText={setConditionName}
              placeholder="Enter condition name"
              placeholderTextColor={Colors.inactive}
            />
          </View>

          {/* Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Type*</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'acute' && styles.typeButtonActive]}
                onPress={() => setType('acute')}
              >
                <Text style={[styles.typeButtonText, type === 'acute' && styles.typeButtonTextActive]}>
                  Acute
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'chronic' && styles.typeButtonActive]}
                onPress={() => setType('chronic')}
              >
                <Text style={[styles.typeButtonText, type === 'chronic' && styles.typeButtonTextActive]}>
                  Chronic
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'resolved' && styles.typeButtonActive]}
                onPress={() => setType('resolved')}
              >
                <Text style={[styles.typeButtonText, type === 'resolved' && styles.typeButtonTextActive]}>
                  Resolved
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Severity */}
          <View style={styles.section}>
            <Text style={styles.label}>Severity*</Text>
            
            <TouchableOpacity
              style={[styles.severityOption, styles.severityMild, severity === 'mild' && styles.severitySelected]}
              onPress={() => setSeverity('mild')}
            >
              <View style={[styles.radioOuter, severity === 'mild' && styles.radioOuterSelected]}>
                {severity === 'mild' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.severityText}>Mild</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.severityOption, styles.severityModerate, severity === 'moderate' && styles.severitySelected]}
              onPress={() => setSeverity('moderate')}
            >
              <View style={[styles.radioOuter, severity === 'moderate' && styles.radioOuterSelected]}>
                {severity === 'moderate' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.severityText}>Moderate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.severityOption, styles.severitySevere, severity === 'severe' && styles.severitySelected]}
              onPress={() => setSeverity('severe')}
            >
              <View style={[styles.radioOuter, severity === 'severe' && styles.radioOuterSelected]}>
                {severity === 'severe' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.severityText}>Severe</Text>
            </TouchableOpacity>
          </View>

          {/* Diagnosis Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Diagnosis Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(diagnosisDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.inactive} />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={diagnosisDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <Text style={styles.dropdownText}>{getStatusLabel(status)}</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.inactive} />
            </TouchableOpacity>
            
            {showStatusDropdown && (
              <View style={styles.dropdownMenu}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setStatus(option.id);
                      setShowStatusDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Quick Symptoms */}
          <View style={styles.section}>
            <Text style={styles.labelOptional}>Quick Symptoms (Optional)</Text>
            {symptoms.map((symptom) => (
              <TouchableOpacity
                key={symptom.id}
                style={styles.checkboxRow}
                onPress={() => toggleSymptom(symptom.id)}
              >
                <View style={[styles.checkbox, selectedSymptoms.includes(symptom.id) && styles.checkboxChecked]}>
                  {selectedSymptoms.includes(symptom.id) && (
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{symptom.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.labelOptional}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional observations..."
              placeholderTextColor={Colors.inactive}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
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
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>{isEditMode ? 'Update Condition' : 'Save Condition'}</Text>
              )}
            </TouchableOpacity>
          </View>
          </>) /* End of !loadingData wrapper */}
        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary.light,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
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
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
  },
  typeButtonTextActive: {
    color: Colors.white,
  },
  severityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  severitySelected: {
    borderColor: '#3B82F6',
  },
  severityMild: {
    backgroundColor: '#D1FAE5',
  },
  severityModerate: {
    backgroundColor: '#FED7AA',
  },
  severitySevere: {
    backgroundColor: '#FEE2E2',
  },
  severityText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark,
    marginLeft: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
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
    fontWeight: '500',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownText: {
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxLabel: {
    fontSize: 15,
    color: Colors.dark,
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    backgroundColor: '#3B82F6',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.inactive,
  },
});
