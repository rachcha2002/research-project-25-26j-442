import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useBaby } from '@/contexts/BabyContext';
import {
  scanFoodText,
  scanFoodVision,
  ClinicalSafetyResponse,
} from '@/services/nutritionExtractionService';

export default function NutritionTrackerScreen() {
  const { selectedBaby } = useBaby();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [foodIdentified, setFoodIdentified] = useState('');
  const [nutrients, setNutrients] = useState<string[]>([]);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [safetyStatus, setSafetyStatus] = useState<string | null>(null);

  const hasInput = useMemo(
    () => !!imageUri || description.trim().length > 0,
    [imageUri, description],
  );

  const handlePickImage = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Camera permission', 'Camera permission is required to take a photo.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.7,
        });
        if (!result.canceled) {
          setImageUri(result.assets[0]?.uri ?? null);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.7,
        });
        if (!result.canceled) {
          setImageUri(result.assets[0]?.uri ?? null);
        }
      }
    } catch (e) {
      console.warn('Image pick error', e);
    }
  };

  const analyzeMeal = async () => {
    if (!hasInput) {
      Alert.alert('Add details', 'Please add a photo or describe the meal.');
      return;
    }

    setIsAnalyzing(true);

    const childProfile = {
      allergies: selectedBaby?.allergies ?? [],
      medical_conditions: [],
      medications: [],
    };

    try {
      const response: ClinicalSafetyResponse = imageUri
        ? await scanFoodVision(imageUri, childProfile, description)
        : await scanFoodText(description.trim(), childProfile);

      setFoodIdentified(response.food_identified);
      setNutrients(response.nutrients?.length ? response.nutrients : ['Energy']);
      setSafetyStatus(response.safety_status);
      setAnalysisSummary(response.clinical_reasoning);
      setAnalysisDone(true);
    } catch (error) {
      setFoodIdentified('');
      setNutrients([]);
      setSafetyStatus(null);
      setAnalysisSummary('Could not extract nutrition from service right now. Please try again.');
      setAnalysisDone(true);

      console.error('Nutrition extraction API analysis failed:', error);
      Alert.alert(
        'Service unavailable',
        'Could not reach nutrition extraction service. Please try again.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isSafeForChild = useMemo(
    () => !!safetyStatus && safetyStatus.toLowerCase() === 'safe',
    [safetyStatus],
  );

  return (
    <>
      <SecondaryTopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Nutrition Tracker</Text>
        <Text style={styles.subtitle}>
          Capture or describe a meal to extract nutrition information for your child.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Meal photo (optional)</Text>
          <View style={styles.photoButtonsRow}>
            <TouchableOpacity
              style={styles.photoButton}
              activeOpacity={0.8}
              onPress={() => handlePickImage(true)}
            >
              <Ionicons name="camera" size={18} color={Colors.primary.DEFAULT} />
              <Text style={styles.photoButtonText}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              activeOpacity={0.8}
              onPress={() => handlePickImage(false)}
            >
              <Ionicons name="image" size={18} color={Colors.primary.DEFAULT} />
              <Text style={styles.photoButtonText}>Upload photo</Text>
            </TouchableOpacity>
          </View>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Describe the meal (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Example: Rice, chicken, vegetables cooked in coconut milk"
            placeholderTextColor={Colors.inactive}
          />
        </View>

        <TouchableOpacity
          style={[styles.analyzeButton, !hasInput && styles.analyzeButtonDisabled]}
          activeOpacity={0.8}
          onPress={analyzeMeal}
          disabled={!hasInput || isAnalyzing}
        >
          <Text style={styles.analyzeButtonText}>
            {isAnalyzing ? 'Analyzing...' : 'Analyze meal'}
          </Text>
        </TouchableOpacity>

        {analysisDone && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Extracted nutrition</Text>
            {!!foodIdentified && (
              <Text style={styles.helperText}>Detected meal: {foodIdentified}</Text>
            )}

            {!!safetyStatus && (
              <View style={[styles.safetyBadge, isSafeForChild ? styles.safeBadge : styles.unsafeBadge]}>
                <Ionicons
                  name={isSafeForChild ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={isSafeForChild ? Colors.primary.DEFAULT : Colors.error}
                />
                <Text style={[styles.safetyBadgeText, isSafeForChild ? styles.safeText : styles.unsafeText]}>
                  {isSafeForChild ? 'Safe to give' : 'Not safe to give'}
                </Text>
              </View>
            )}

            {nutrients.length > 0 ? (
              <View style={styles.nutrientChipsRow}>
                {nutrients.map((item) => (
                  <View key={item} style={styles.nutrientChip}>
                    <Ionicons
                      name="nutrition-outline"
                      size={16}
                      color={Colors.primary.DEFAULT}
                      style={styles.nutrientChipIcon}
                    />
                    <Text style={styles.nutrientChipText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.helperText}>No nutrients were returned by the analysis.</Text>
            )}

            {!!analysisSummary && <Text style={styles.helperText}>{analysisSummary}</Text>}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.inactive,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.gray.light,
  },
  photoButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.dark,
  },
  previewImage: {
    marginTop: 12,
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  textInput: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.dark,
    minHeight: 80,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.gray.light,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    marginTop: 4,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary.DEFAULT,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  helperText: {
    fontSize: 13,
    color: Colors.gray.DEFAULT,
    marginTop: 4,
  },
  safetyBadge: {
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  safeBadge: {
    backgroundColor: Colors.gray.light,
    borderColor: Colors.primary.DEFAULT,
  },
  unsafeBadge: {
    backgroundColor: Colors.gray.light,
    borderColor: Colors.error,
  },
  safetyBadgeText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  safeText: {
    color: Colors.primary.DEFAULT,
  },
  unsafeText: {
    color: Colors.error,
  },
  nutrientChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  nutrientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.gray.light,
  },
  nutrientChipIcon: {
    marginRight: 6,
  },
  nutrientChipText: {
    fontSize: 13,
    color: Colors.dark,
    fontWeight: '600',
  },
});
