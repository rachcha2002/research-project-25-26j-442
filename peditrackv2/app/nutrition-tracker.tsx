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
import { useRouter } from 'expo-router';

type MealId = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner';

type NutrientKey =
  | 'energy'
  | 'carbohydrates'
  | 'protein'
  | 'fat'
  | 'fiber'
  | 'iron'
  | 'calcium'
  | 'vitaminA'
  | 'vitaminC'
  | 'vitaminD'
  | 'omega3';

const NUTRIENT_LABELS: Record<NutrientKey, string> = {
  energy: 'Energy',
  carbohydrates: 'Carbohydrates',
  protein: 'Protein',
  fat: 'Healthy fats',
  fiber: 'Fiber',
  iron: 'Iron',
  calcium: 'Calcium',
  vitaminA: 'Vitamin A',
  vitaminC: 'Vitamin C',
  vitaminD: 'Vitamin D',
  omega3: 'Omega-3',
};

// Simple keyword-based nutrient detection
const KEYWORD_MAP: { keywords: string[]; nutrients: NutrientKey[] }[] = [
  {
    keywords: ['rice', 'bread', 'roti', 'noodle', 'pasta', 'potato'],
    nutrients: ['energy', 'carbohydrates', 'fiber'],
  },
  {
    keywords: ['milk', 'cheese', 'yogurt', 'curd'],
    nutrients: ['protein', 'calcium', 'vitaminD'],
  },
  {
    keywords: ['egg', 'chicken', 'meat'],
    nutrients: ['protein', 'iron', 'energy'],
  },
  {
    keywords: ['fish', 'salmon', 'sardine'],
    nutrients: ['protein', 'omega3', 'vitaminD'],
  },
  {
    keywords: ['apple', 'orange', 'banana', 'fruit', 'mango', 'berry'],
    nutrients: ['fiber', 'vitaminC', 'energy'],
  },
  {
    keywords: ['carrot', 'pumpkin', 'spinach', 'leafy'],
    nutrients: ['vitaminA', 'iron', 'fiber'],
  },
  {
    keywords: ['oil', 'butter', 'ghee', 'avocado'],
    nutrients: ['fat', 'energy'],
  },
];

const TODAY_MEALS: { id: MealId; hour: number; minute: number }[] = [
  { id: 'breakfast', hour: 8, minute: 0 },
  { id: 'morningSnack', hour: 10, minute: 0 },
  { id: 'lunch', hour: 13, minute: 0 },
  { id: 'afternoonSnack', hour: 16, minute: 0 },
  { id: 'dinner', hour: 19, minute: 0 },
];

export default function NutritionTrackerScreen() {
  const router = useRouter();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [detectedNutrients, setDetectedNutrients] = useState<NutrientKey[]>([]);
  const [hasPeanutWarning, setHasPeanutWarning] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);

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
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });
        if (!result.canceled) {
          setImageUri(result.assets[0]?.uri ?? null);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const analyzeMeal = () => {
    if (!hasInput) {
      Alert.alert('Add details', 'Please add a photo or describe the meal.');
      return;
    }

    const text = description.toLowerCase();
    const found = new Set<NutrientKey>();

    KEYWORD_MAP.forEach(({ keywords, nutrients }) => {
      if (keywords.some((k) => text.includes(k))) {
        nutrients.forEach((n) => found.add(n));
      }
    });

    // Always include energy if we have any input
    if (hasInput) {
      found.add('energy');
    }

    const peanutWords = ['peanut', 'peanuts', 'groundnut', 'groundnuts'];
    const hasPeanut = peanutWords.some((w) => text.includes(w));

    setDetectedNutrients(Array.from(found));
    setHasPeanutWarning(hasPeanut);
    setAnalysisDone(true);

    if (hasPeanut) {
      Alert.alert('Allergy alert', "Don't give this meal to the child (peanut allergy).");
    }
  };

  const getNextMealId = (): MealId | null => {
    const now = new Date();
    const today = new Date();
    const mealsWithDate = TODAY_MEALS.map((meal) =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        meal.hour,
        meal.minute,
      ),
    );

    const upcomingIndexes = mealsWithDate
      .map((dt, index) => ({ dt, index }))
      .filter(({ dt }) => dt >= now);

    if (upcomingIndexes.length === 0) {
      return null;
    }

    const next = upcomingIndexes.reduce((prev, curr) =>
      curr.dt < prev.dt ? curr : prev,
    );

    return TODAY_MEALS[next.index].id;
  };

  const handleAddToUpcomingMeal = () => {
    const nextMealId = getNextMealId();
    if (!nextMealId) {
      Alert.alert('No upcoming meals', 'All meals for today are already past.');
      return;
    }

    router.replace({
      pathname: '/(tabs)/location',
      params: { completedMealId: nextMealId },
    });
  };

  const isMealBad = useMemo(
    () => analysisDone && (hasPeanutWarning || detectedNutrients.length === 0),
    [analysisDone, hasPeanutWarning, detectedNutrients],
  );

  const isMealGood = useMemo(
    () => analysisDone && !hasPeanutWarning && detectedNutrients.length > 0,
    [analysisDone, hasPeanutWarning, detectedNutrients],
  );

  const alternativeSuggestions = useMemo(
    () => [
      'Fruit and yogurt bowl without nuts',
      'Rice with vegetables and egg (no peanuts)',
      'Soft steamed vegetables with mashed potato',
    ],
    [],
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
          Capture or describe a meal to see basic nutrition and safety for your child.
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
        >
          <Text style={styles.analyzeButtonText}>Analyze meal</Text>
        </TouchableOpacity>

        {analysisDone && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Meal nutrition</Text>
            {detectedNutrients.length > 0 ? (
              <View style={styles.nutrientChipsRow}>
                {detectedNutrients.map((key) => (
                  <View key={key} style={styles.nutrientChip}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={Colors.primary.DEFAULT}
                      style={styles.nutrientChipIcon}
                    />
                    <Text style={styles.nutrientChipText}>{NUTRIENT_LABELS[key]}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.helperText}>
                We could not detect specific nutrients from this description, but the meal
                still provides energy.
              </Text>
            )}

            {hasPeanutWarning && (
              <View style={styles.warningBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={Colors.error}
                  style={styles.warningIcon}
                />
                <Text style={styles.warningText}>
                  This meal seems to include peanuts. Don&apos;t give this meal to the child
                  (peanut allergy).
                </Text>
              </View>
            )}
            {isMealBad && (
              <View style={styles.addToPlanBox}>
                <Text style={styles.addToPlanTitle}>This meal may not be ideal</Text>
                <Text style={styles.addToPlanSubtitle}>
                  Based on our simple checks, this meal might not be the best choice for
                  your child today. Here are some quick alternatives you can consider
                  (without peanuts).
                </Text>
                {alternativeSuggestions.map((alt) => (
                  <View key={alt} style={styles.alternativeRow}>
                    <Ionicons
                      name="sparkles-outline"
                      size={16}
                      color={Colors.primary.DEFAULT}
                      style={styles.alternativeIcon}
                    />
                    <Text style={styles.alternativeText}>{alt}</Text>
                  </View>
                ))}
              </View>
            )}

            {isMealGood && (
              <View style={styles.addToPlanBox}>
                <Text style={styles.addToPlanTitle}>
                  Add to upcoming meal and mark as completed?
                </Text>
                <Text style={styles.addToPlanSubtitle}>
                  Optional: we can treat this meal as the next meal in today&apos;s plan and
                  mark that meal as completed.
                </Text>
                <TouchableOpacity
                  style={styles.addToPlanButton}
                  activeOpacity={0.8}
                  onPress={handleAddToUpcomingMeal}
                >
                  <Text style={styles.addToPlanButtonText}>
                    Add to next meal & mark completed
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  nutrientChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  nutrientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.gray.light,
  },
  nutrientChipIcon: {
    marginRight: 4,
  },
  nutrientChipText: {
    fontSize: 13,
    color: Colors.dark,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    color: Colors.gray.DEFAULT,
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  warningIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
  },
  addToPlanBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#EEF5FF',
  },
  addToPlanTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  addToPlanSubtitle: {
    fontSize: 13,
    color: Colors.gray.DEFAULT,
    marginBottom: 10,
  },
  alternativeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  alternativeIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  alternativeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark,
  },
  addToPlanButton: {
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.primary.DEFAULT,
  },
  addToPlanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
