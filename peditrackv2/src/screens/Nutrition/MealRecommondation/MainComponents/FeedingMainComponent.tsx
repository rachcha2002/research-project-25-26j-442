import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBaby } from '@/contexts/BabyContext';
import {
  createMealPreference,
  getMealPreference,
  MealPreference,
} from '@/services/mealPreferencesService';
import {
  PreferencesForm,
  PreferencesFormValues,
} from '../SubComponents/PreferencesForm';
import { MealPreferencesSummaryCard } from '../SubComponents/MealPreferencesSummaryCard';

export const FeedingMainComponent: React.FC = () => {
  const { user } = useAuth();
  const { selectedBaby } = useBaby();

  const [preferenceData, setPreferenceData] = useState<MealPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parentId = user?._id;
  const childId = selectedBaby?._id;

  const loadPreferences = useCallback(async () => {
    if (!parentId || !childId) {
      setPreferenceData(null);
      setIsLoading(false);
      setIsRefreshing(false);
      setErrorMessage('Parent or child profile is not available.');
      return;
    }

    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }
      setErrorMessage(null);
      const data = await getMealPreference({ parentId, childId });
      setPreferenceData(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load meal preferences.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [parentId, childId, isRefreshing]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPreferences();
  };

  const handleCreatePreference = async (values: PreferencesFormValues) => {
    if (!parentId || !childId) {
      Alert.alert('Profile missing', 'Please select a baby profile and try again.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const savedPreference = await createMealPreference({
        parent_id: parentId,
        child_id: childId,
        diet_type: values.diet_type,
        budget_level: values.budget_level,
        meals_per_day: values.meals_per_day,
        activity_level: values.activity_level,
      });

      setPreferenceData(savedPreference);
      Alert.alert('Saved', 'Meal preferences saved successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save meal preferences.';
      setErrorMessage(message);
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Personalized Meal Plan</Text>
          <Text style={styles.headerDescription}>
            Interactively, we collect this data to build a personalized meal plan for your child.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Loading preferences...</Text>
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn’t load preferences</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadPreferences} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isLoading && !errorMessage && preferenceData ? (
          <MealPreferencesSummaryCard data={preferenceData} />
        ) : null}

        {!isLoading && !errorMessage && !preferenceData ? (
          <>
            <PreferencesForm onSubmit={handleCreatePreference} />
            {isSaving ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
                <Text style={styles.savingText}>Saving preferences...</Text>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 6,
  },
  headerDescription: {
    fontSize: 14,
    color: Colors.inactive,
    lineHeight: 20,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.inactive,
  },
  errorCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorMessage: {
    color: Colors.inactive,
    fontSize: 13,
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  savingContainer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 8,
  },
  savingText: {
    fontSize: 13,
    color: Colors.inactive,
  },
});
