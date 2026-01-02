import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';

type ConditionType = 'acute' | 'chronic' | 'resolved';
type Severity = 'mild' | 'moderate' | 'severe';
type Status = 'monitoring' | 'active' | 'resolved' | 'underTreatment';

export const AddConditionScreen: React.FC = () => {
  const router = useRouter();
  
  // Form state
  const [conditionName, setConditionName] = useState('');
  const [type, setType] = useState<ConditionType>('chronic');
  const [severity, setSeverity] = useState<Severity>('moderate');
  const [diagnosisDate, setDiagnosisDate] = useState('January 2025');
  const [status, setStatus] = useState<Status>('monitoring');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['sneezing', 'runnyNose']);
  const [notes, setNotes] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

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

  const handleSave = () => {
    // Validate required fields
    if (!conditionName.trim()) {
      Alert.alert('Error', 'Please enter a condition name');
      return;
    }

    // TODO: Save to backend
    Alert.alert(
      'Success',
      'Condition saved successfully!',
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
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.pageTitle}>Health Records</Text>

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
            <TouchableOpacity style={styles.dateButton}>
              <Text style={styles.dateText}>{diagnosisDate}</Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.inactive} />
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Condition</Text>
            </TouchableOpacity>
          </View>
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
});
