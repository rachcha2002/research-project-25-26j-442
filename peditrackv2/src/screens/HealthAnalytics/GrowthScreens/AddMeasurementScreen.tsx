import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { addMeasurement, updateMeasurement, Measurement } from '@/services/healthAnalyticsService';
import DateTimePicker from '@react-native-community/datetimepicker';

type EntryMode = 'manual' | 'photo';

export const AddMeasurementScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Check if we're editing an existing measurement
  const editMode = !!params.measurementId;
  const measurementData = params.measurementData ? JSON.parse(params.measurementData as string) as Measurement : null;
  
  const [entryMode, setEntryMode] = useState<EntryMode>(measurementData?.entryMode || 'manual');
  const [height, setHeight] = useState(measurementData?.height.value || 0);
  const [weight, setWeight] = useState(measurementData?.weight.value || 0);
  const [headCircumference, setHeadCircumference] = useState(measurementData?.headCircumference?.value || 0);
  const [location, setLocation] = useState(measurementData?.location || '');
  const [notes, setNotes] = useState(measurementData?.notes || '');
  const [measurementDate, setMeasurementDate] = useState(
    measurementData?.measurementDate ? new Date(measurementData.measurementDate) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // TODO: Get this from route params or context
  const [babyId, setBabyId] = useState(measurementData?.babyId || '674525cc0a8a8b29b8a2bf9c');

  // Calculate BMI
  const calculateBMI = () => {
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return '0.0';
  };

  const incrementValue = (setter: (val: number) => void, currentValue: number, step: number = 0.1) => {
    setter(Number((currentValue + step).toFixed(1)));
  };

  const decrementValue = (setter: (val: number) => void, currentValue: number, step: number = 0.1) => {
    if (currentValue > 0) {
      setter(Number((currentValue - step).toFixed(1)));
    }
  };

  const saveMeasurement = async (saveAndAddAnother: boolean = false) => {
    // Validate required fields
    if (!babyId) {
      Alert.alert('Error', 'Baby ID is required');
      return;
    }

    if (height <= 0 || weight <= 0) {
      Alert.alert('Error', 'Height and Weight are required and must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const measurementPayload = {
        babyId,
        measurementDate: measurementDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        height: {
          value: height,
          unit: 'cm',
        },
        weight: {
          value: weight,
          unit: 'kg',
        },
        headCircumference: headCircumference > 0 ? {
          value: headCircumference,
          unit: 'cm',
        } : undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        entryMode,
      };

      let result;
      if (editMode && params.measurementId) {
        // Update existing measurement
        result = await updateMeasurement(params.measurementId as string, measurementPayload);
      } else {
        // Add new measurement
        result = await addMeasurement(measurementPayload);
      }
      
      Alert.alert(
        'Success',
        editMode ? 'Measurement updated successfully!' : 'Measurement saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (saveAndAddAnother && !editMode) {
                // Reset form for new entry (only in add mode)
                setHeight(0);
                setWeight(0);
                setHeadCircumference(0);
                setNotes('');
                setLocation('');
                setMeasurementDate(new Date());
              } else {
                // Navigate back to growth details screen
                router.back();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving measurement:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : `Failed to ${editMode ? 'update' : 'save'} measurement. Please try again.`
      );
    } finally {
      setLoading(false);
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
          {/* Entry Mode Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, entryMode === 'manual' && styles.activeTab]}
              onPress={() => setEntryMode('manual')}
            >
              <Ionicons 
                name="create-outline" 
                size={18} 
                color={entryMode === 'manual' ? Colors.primary.DEFAULT : Colors.inactive} 
              />
              <Text style={[styles.tabText, entryMode === 'manual' && styles.activeTabText]}>
                Manual Entry
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, entryMode === 'photo' && styles.activeTab]}
              onPress={() => setEntryMode('photo')}
            >
              <Ionicons 
                name="camera-outline" 
                size={18} 
                color={entryMode === 'photo' ? Colors.primary.DEFAULT : Colors.inactive} 
              />
              <Text style={[styles.tabText, entryMode === 'photo' && styles.activeTabText]}>
                Photo Analysis
              </Text>
            </TouchableOpacity>
          </View>

          {/* Measurement Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Measurement Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {measurementDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.inactive} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={measurementDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setMeasurementDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          {/* Height */}
          <View style={styles.section}>
            <Text style={styles.label}>Height*</Text>
            <View style={styles.measurementControl}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => decrementValue(setHeight, height, 0.1)}
              >
                <Ionicons name="remove" size={24} color={Colors.dark} />
              </TouchableOpacity>
              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{height.toFixed(1)}</Text>
                <Text style={styles.unitText}>cm</Text>
              </View>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => incrementValue(setHeight, height, 0.1)}
              >
                <Ionicons name="add" size={24} color={Colors.dark} />
              </TouchableOpacity>
            </View>
            <View style={styles.percentileInfo}>
              <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
              <Text style={styles.percentileText}>48th percentile - Normal range ✓</Text>
            </View>
          </View>

          {/* Weight */}
          <View style={styles.section}>
            <Text style={styles.label}>Weight*</Text>
            <View style={styles.measurementControl}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => decrementValue(setWeight, weight, 0.1)}
              >
                <Ionicons name="remove" size={24} color={Colors.dark} />
              </TouchableOpacity>
              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{weight.toFixed(1)}</Text>
                <Text style={styles.unitText}>kg</Text>
              </View>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => incrementValue(setWeight, weight, 0.1)}
              >
                <Ionicons name="add" size={24} color={Colors.dark} />
              </TouchableOpacity>
            </View>
            <View style={[styles.percentileInfo, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={[styles.percentileText, { color: '#059669' }]}>
                52th percentile - Healthy range
              </Text>
            </View>
          </View>

          {/* Head Circumference */}
          <View style={styles.section}>
            <Text style={styles.labelOptional}>Head Circumference (optional)</Text>
            <View style={styles.measurementControl}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => decrementValue(setHeadCircumference, headCircumference, 0.1)}
              >
                <Ionicons name="remove" size={24} color={Colors.dark} />
              </TouchableOpacity>
              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{headCircumference.toFixed(1)}</Text>
                <Text style={styles.unitText}>cm</Text>
              </View>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => incrementValue(setHeadCircumference, headCircumference, 0.1)}
              >
                <Ionicons name="add" size={24} color={Colors.dark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* BMI Display */}
          <View style={styles.bmiCard}>
            <Text style={styles.bmiLabel}>BMI (Auto-calculated)</Text>
            <Text style={styles.bmiValue}>{calculateBMI()}</Text>
            <View style={styles.bmiStatus}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.bmiStatusText}>Healthy Weight</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.labelOptional}>Location (optional)</Text>
            <TextInput
              style={styles.locationInput}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Home, Clinic, Hospital"
              placeholderTextColor={Colors.inactive}
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.labelOptional}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes about this measurement"
              placeholderTextColor={Colors.inactive}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {!editMode && (
              <TouchableOpacity 
                style={[styles.secondaryButton, loading && styles.disabledButton]}
                onPress={() => saveMeasurement(true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.dark} />
                ) : (
                  <Text style={styles.secondaryButtonText}>Save & Add Another</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[editMode ? styles.primaryButtonFull : styles.primaryButton, loading && styles.disabledButton]}
              onPress={() => saveMeasurement(false)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {editMode ? 'Update Measurement' : 'Save Measurement'}
                </Text>
              )}
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: Colors.background,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.inactive,
  },
  activeTabText: {
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 12,
  },
  labelOptional: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.inactive,
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 15,
    color: Colors.dark,
    fontWeight: '500',
  },
  measurementControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  controlButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.dark,
  },
  unitText: {
    fontSize: 14,
    color: Colors.inactive,
    marginTop: 2,
  },
  percentileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  percentileText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
  },
  bmiCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  bmiLabel: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 8,
  },
  bmiValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  bmiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bmiStatusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.dark,
    fontWeight: '500',
  },
  locationInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
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
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonFull: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
