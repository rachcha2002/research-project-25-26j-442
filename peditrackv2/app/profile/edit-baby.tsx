import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useBaby } from '../../src/contexts/BabyContext';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditBabyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { babies, updateBaby, uploadBabyPhoto } = useBaby();
  
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [currentPhoto, setCurrentPhoto] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const babyId = params.id as string;
  const baby = babies.find((b) => b._id === babyId);

  useEffect(() => {
    if (baby) {
      setName(baby.name);
      setDateOfBirth(new Date(baby.dateOfBirth));
      setGender(baby.gender);
      setBloodType(baby.bloodType || '');
      setAllergies(baby.allergies?.join(', ') || '');
      setCurrentPhoto(baby.photo || '');
    }
  }, [baby]);

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

    if (!baby) {
      Alert.alert('Error', 'Baby not found');
      return;
    }

    try {
      setIsLoading(true);

      const allergiesArray = allergies
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const updateData = {
        name: name.trim(),
        dateOfBirth: dateOfBirth.toISOString(),
        gender,
        bloodType: bloodType.trim() || undefined,
        allergies: allergiesArray.length > 0 ? allergiesArray : undefined,
      };

      await updateBaby(babyId, updateData);

      // Upload new photo if selected
      if (photoUri) {
        await uploadBabyPhoto(babyId, photoUri);
      }

      Alert.alert('Success', 'Baby profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update baby profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!baby) {
    return (
      <View style={styles.container}>
        <Text>Baby not found</Text>
      </View>
    );
  }

  const displayPhoto = photoUri || currentPhoto;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Baby Profile</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            {/* Photo */}
            <TouchableOpacity
              style={styles.photoSection}
              onPress={handlePickPhoto}
            >
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Text style={styles.photoText}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.photoOverlay}>
                <Text style={styles.photoIcon}>📷</Text>
              </View>
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

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  photoIcon: {
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  genderTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
