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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  logSymptoms,
  updateSymptomRecord,
  getSymptomById,
  SymptomEntry,
  DailySymptom,
} from '@/services/healthAnalyticsService';
import { useBaby } from '@/contexts/BabyContext';

type PredefinedSymptom = {
  id: string;
  emoji: string;
  label: string;
};

export const LogSymptomsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { selectedBaby } = useBaby();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const [customSymptomInput, setCustomSymptomInput] = useState('');
  const [symptomSeverities, setSymptomSeverities] = useState<Record<string, 'mild' | 'moderate' | 'severe'>>({});
  const [recordedAt, setRecordedAt] = useState(new Date());
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');

  const predefinedSymptoms: PredefinedSymptom[] = [
    { id: 'Fever', emoji: '🤒', label: 'Fever' },
    { id: 'Cold', emoji: '🤧', label: 'Cold' },
    { id: 'Cough', emoji: '😷', label: 'Cough' },
    { id: 'Vomiting', emoji: '🤢', label: 'Vomiting' },
    { id: 'Diarrhea', emoji: '💩', label: 'Diarrhea' },
    { id: 'Pain', emoji: '😫', label: 'Pain' },
    { id: 'Fatigue', emoji: '🥱', label: 'Fatigue' },
    { id: 'No Appetite', emoji: '🍽️', label: 'No Appetite' },
    { id: 'Rash', emoji: '🔴', label: 'Rash' },
    { id: 'Congestion', emoji: '🤯', label: 'Congestion' },
    { id: 'Headache', emoji: '🤕', label: 'Headache' },
    { id: 'Irritability', emoji: '😠', label: 'Irritability' },
  ];

  useEffect(() => {
    if (isEditMode && id) {
      loadSymptomRecord();
    }
  }, [id]);

  const loadSymptomRecord = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const record = await getSymptomById(id as string);

      // Separate predefined and custom symptoms
      const predefined = new Set<string>();
      const custom: string[] = [];
      const severities: Record<string, 'mild' | 'moderate' | 'severe'> = {};

      record.symptoms.forEach((symptom) => {
        if (symptom.isCustom) {
          custom.push(symptom.name);
        } else {
          predefined.add(symptom.name);
        }
        severities[symptom.name] = symptom.severity;
      });

      setSelectedSymptoms(predefined);
      setCustomSymptoms(custom);
      setSymptomSeverities(severities);
      setRecordedAt(new Date(record.recordedAt));
      setNotes(record.notes || '');
      setTemperature(record.temperature?.toString() || '');
    } catch (error) {
      console.error('Error loading symptom record:', error);
      Alert.alert('Error', 'Failed to load symptom record');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptomId: string) => {
    const newSelected = new Set(selectedSymptoms);
    if (newSelected.has(symptomId)) {
      newSelected.delete(symptomId);
      // Remove severity when deselecting
      const newSeverities = { ...symptomSeverities };
      delete newSeverities[symptomId];
      setSymptomSeverities(newSeverities);
    } else {
      newSelected.add(symptomId);
      // Default to mild severity
      setSymptomSeverities({
        ...symptomSeverities,
        [symptomId]: 'mild',
      });
    }
    setSelectedSymptoms(newSelected);
  };

  const addCustomSymptom = () => {
    const trimmed = customSymptomInput.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Please enter a symptom name');
      return;
    }

    if (customSymptoms.includes(trimmed)) {
      Alert.alert('Duplicate', 'This custom symptom is already added');
      return;
    }

    setCustomSymptoms([...customSymptoms, trimmed]);
    setSymptomSeverities({
      ...symptomSeverities,
      [trimmed]: 'mild',
    });
    setCustomSymptomInput('');
  };

  const removeCustomSymptom = (symptomName: string) => {
    setCustomSymptoms(customSymptoms.filter((s) => s !== symptomName));
    const newSeverities = { ...symptomSeverities };
    delete newSeverities[symptomName];
    setSymptomSeverities(newSeverities);
  };

  const setSeverity = (symptomName: string, severity: 'mild' | 'moderate' | 'severe') => {
    setSymptomSeverities({
      ...symptomSeverities,
      [symptomName]: severity,
    });
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!selectedBaby) {
      Alert.alert('Error', 'No baby selected');
      return;
    }

    // Build symptom entries array
    const allSymptomNames = [...Array.from(selectedSymptoms), ...customSymptoms];

    if (allSymptomNames.length === 0) {
      Alert.alert('Validation', 'Please select at least one symptom');
      return;
    }

    const symptomEntries: SymptomEntry[] = allSymptomNames.map((name) => ({
      name,
      severity: symptomSeverities[name] || 'mild',
      isCustom: customSymptoms.includes(name),
    }));

    const tempValue = temperature ? parseFloat(temperature) : undefined;
    if (tempValue && (tempValue < 30 || tempValue > 45)) {
      Alert.alert('Validation', 'Temperature must be between 30°C and 45°C');
      return;
    }

    try {
      setSaving(true);

      const symptomData: Partial<DailySymptom> = {
        babyId: selectedBaby._id,
        symptoms: symptomEntries,
        recordedAt: recordedAt.toISOString(),
        notes: notes.trim() || undefined,
        temperature: tempValue,
      };

      if (isEditMode && id) {
        await updateSymptomRecord(id as string, symptomData);
        Alert.alert('Success', 'Symptom record updated successfully');
      } else {
        await logSymptoms(symptomData);
        Alert.alert('Success', 'Symptoms logged successfully');
      }

      router.back();
    } catch (error) {
      console.error('Error saving symptoms:', error);
      Alert.alert('Error', 'Failed to save symptoms');
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
          <Text style={styles.title}>{isEditMode ? 'Edit Symptoms' : 'Log Symptoms'}</Text>

          {/* Quick Tap Symptoms */}
          <View style={styles.section}>
            <Text style={styles.label}>Quick Tap Symptoms</Text>
            <View style={styles.symptomGrid}>
              {predefinedSymptoms.map((symptom) => (
                <TouchableOpacity
                  key={symptom.id}
                  style={[
                    styles.symptomButton,
                    selectedSymptoms.has(symptom.id) && styles.symptomButtonActive,
                  ]}
                  onPress={() => toggleSymptom(symptom.id)}
                >
                  <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
                  <Text
                    style={[
                      styles.symptomLabel,
                      selectedSymptoms.has(symptom.id) && styles.symptomLabelActive,
                    ]}
                  >
                    {symptom.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Severity Selectors for Selected Symptoms */}
          {(selectedSymptoms.size > 0 || customSymptoms.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.label}>Symptom Severity</Text>
              {[...Array.from(selectedSymptoms), ...customSymptoms].map((symptomName) => (
                <View key={symptomName} style={styles.severityRow}>
                  <Text style={styles.severitySymptomName}>{symptomName}</Text>
                  <View style={styles.severityButtons}>
                    {(['mild', 'moderate', 'severe'] as const).map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.severityButton,
                          symptomSeverities[symptomName] === level && styles.severityButtonActive,
                          level === 'mild' && styles.severityButtonMild,
                          level === 'moderate' && styles.severityButtonModerate,
                          level === 'severe' && styles.severityButtonSevere,
                        ]}
                        onPress={() => setSeverity(symptomName, level)}
                      >
                        <Text
                          style={[
                            styles.severityButtonText,
                            symptomSeverities[symptomName] === level && styles.severityButtonTextActive,
                          ]}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {customSymptoms.includes(symptomName) && (
                    <TouchableOpacity
                      style={styles.removeCustomButton}
                      onPress={() => removeCustomSymptom(symptomName)}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Custom Symptom Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Add Custom Symptom</Text>
            <View style={styles.customSymptomRow}>
              <TextInput
                placeholder="Enter symptom name"
                value={customSymptomInput}
                onChangeText={setCustomSymptomInput}
                style={styles.customSymptomInput}
                onSubmitEditing={addCustomSymptom}
              />
              <TouchableOpacity style={styles.addButton} onPress={addCustomSymptom}>
                <Ionicons name="add-circle" size={32} color={Colors.primary.DEFAULT} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Temperature (if fever selected) */}
          {(selectedSymptoms.has('Fever') || customSymptoms.some(s => s.toLowerCase().includes('fever'))) && (
            <View style={styles.section}>
              <Text style={styles.label}>Temperature (°C)</Text>
              <TextInput
                placeholder="e.g., 38.5"
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
          )}

          {/* Date/Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Date & Time</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={Colors.inactive} />
              <Text style={styles.dateText}>
                {recordedAt.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={recordedAt}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setRecordedAt(date);
              }}
            />
          )}

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              placeholder="Additional details about symptoms..."
              value={notes}
              onChangeText={setNotes}
              style={styles.textArea}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, saving && styles.disabledButton]}
            onPress={handleCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.saveButtonText}>{isEditMode ? 'Update' : 'Log'} Symptoms</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 12,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  symptomButtonActive: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: Colors.primary.light,
  },
  symptomEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  symptomLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.dark,
    textAlign: 'center',
  },
  symptomLabelActive: {
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  severitySymptomName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
    width: 100,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  severityButtonActive: {
    borderWidth: 2,
  },
  severityButtonMild: {},
  severityButtonModerate: {},
  severityButtonSevere: {},
  severityButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.dark,
  },
  severityButtonTextActive: {
    fontWeight: '600',
  },
  removeCustomButton: {
    padding: 4,
  },
  customSymptomRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  customSymptomInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButton: {
    padding: 4,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
