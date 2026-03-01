import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useBaby } from '../../contexts/BabyContext';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SecondaryTopBar } from '../../components/SecondaryTopBar/SecondaryTopBar';
import { Colors } from '@/constants/Colors';

export default function AddBabyScreen() {
  const router = useRouter();
  const { createBaby, uploadBabyPhoto } = useBaby();
  
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Birth & prematurity fields (Survey Q5a, Q5b)
  const [birthWeight, setBirthWeight] = useState('');
  const [isPremature, setIsPremature] = useState<'full_term' | 'premature' | 'dont_know' | null>(null);
  const [gestationalWeeks, setGestationalWeeks] = useState('');

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter baby name');
      return;
    }

    try {
      setIsLoading(true);

      const allergiesArray = allergies
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const babyData = {
        name: name.trim(),
        dateOfBirth: dateOfBirth.toISOString(),
        gender,
        bloodType: bloodType.trim() || undefined,
        allergies: allergiesArray.length > 0 ? allergiesArray : undefined,
        // Birth & prematurity data (Survey Q5a, Q5b)
        birthWeight: birthWeight.trim() ? parseFloat(birthWeight.trim()) : undefined,
        isPremature: isPremature === 'premature' ? true : isPremature === 'full_term' ? false : undefined,
        gestationalWeeks:
          isPremature === 'premature' && gestationalWeeks.trim()
            ? parseInt(gestationalWeeks.trim(), 10)
            : undefined,
      };

      const newBaby = await createBaby(babyData);

      // Upload photo if selected
      if (photoUri) {
        await uploadBabyPhoto(newBaby._id, photoUri);
      }

      Alert.alert('Success', 'Baby profile created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create baby profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SecondaryTopBar
        title="Add Baby Profile"
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView keyboardShouldPersistTaps="handled">

          <View style={styles.content}>
            {/* Photo */}
            <TouchableOpacity
              style={styles.photoSection}
              onPress={handlePickPhoto}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Text style={styles.photoIcon}>📷</Text>
                  <Text style={styles.photoText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter baby's name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {dateOfBirth.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDateOfBirth(selectedDate);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Gender */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                  onPress={() => setGender('male')}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === 'male' && styles.genderTextActive,
                    ]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                  onPress={() => setGender('female')}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === 'female' && styles.genderTextActive,
                    ]}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
                  onPress={() => setGender('other')}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === 'other' && styles.genderTextActive,
                    ]}
                  >
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Blood Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Blood Type (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., O+"
                value={bloodType}
                onChangeText={setBloodType}
                autoCapitalize="characters"
              />
            </View>

            {/* Allergies */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Allergies (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter allergies separated by commas"
                value={allergies}
                onChangeText={setAllergies}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* ── Birth & Prematurity (Survey Q5a, Q5b) ── */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Birth Weight in kg (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 3.2"
                value={birthWeight}
                onChangeText={setBirthWeight}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Was your child born prematurely? (Optional)</Text>
              <View style={styles.genderContainer}>
                {(['full_term', 'premature', 'dont_know'] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.genderButton,
                      isPremature === opt && styles.genderButtonActive,
                    ]}
                    onPress={() => setIsPremature(opt)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        isPremature === opt && styles.genderTextActive,
                      ]}
                    >
                      {opt === 'full_term' ? 'Full Term' : opt === 'premature' ? 'Premature' : "Don't Know"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {isPremature === 'premature' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Gestational Weeks at Birth</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 34"
                  value={gestationalWeeks}
                  onChangeText={setGestationalWeeks}
                  keyboardType="number-pad"
                />
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>Create Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Full Screen Loader */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 14,
    color: Colors.inactive,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.dark,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 16,
    color: Colors.dark,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.inactive,
  },
  genderTextActive: {
    color: Colors.white,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary.DEFAULT,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
