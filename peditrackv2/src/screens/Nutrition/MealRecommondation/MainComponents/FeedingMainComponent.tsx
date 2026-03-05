import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useBaby } from '@/contexts/BabyContext';
import {
  getActiveConditions,
  getActiveMedications,
  getLatestMeasurement,
} from '@/services/healthAnalyticsService';
import {
  DailyGeneratedMealPlan,
  GenerateMealPlanPayload,
  generateMealPlan,
  getTodayGeneratedPlan,
  MealFeedbackMap,
} from '@/services/generatedPlansService';
import { getBehavioralState } from '@/services/behavioralStateService';
import {
  createMealPreference,
  getMealPreference,
  MealPreference,
  updateMealPreference,
} from '@/services/mealPreferencesService';
import { PreferencesForm, PreferencesFormValues } from '../SubComponents/PreferencesForm';
import { TodayMealPlanCard } from '../SubComponents/TodayMealPlanCard';

const calculateAgeMonths = (selectedBaby: any): number | null => {
  if (selectedBaby?.dateOfBirth) {
    const birth = new Date(selectedBaby.dateOfBirth);
    if (!Number.isNaN(birth.getTime())) {
      const now = new Date();
      return (
        (now.getFullYear() - birth.getFullYear()) * 12 +
        (now.getMonth() - birth.getMonth())
      );
    }
  }

  if (typeof selectedBaby?.age === 'number') {
    return selectedBaby.age;
  }

  if (selectedBaby?.age && typeof selectedBaby.age === 'object') {
    const years = Number(selectedBaby.age.years ?? 0);
    const months = Number(selectedBaby.age.months ?? 0);
    if (!Number.isNaN(years) && !Number.isNaN(months)) {
      return years * 12 + months;
    }
  }

  return null;
};

export const FeedingMainComponent: React.FC = () => {
  const { selectedBaby } = useBaby();
  const router = useRouter();

  const [todayPlan, setTodayPlan] = useState<DailyGeneratedMealPlan | null>(null);
  const [mealFeedback, setMealFeedback] = useState<MealFeedbackMap>({});
  const [mealPreference, setMealPreference] = useState<MealPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [isPreferencesModalVisible, setIsPreferencesModalVisible] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  const childId = selectedBaby?._id;
  const parentId = selectedBaby?.userId;
  const isChildProfileAvailable = Boolean(childId);

  const buildAndLogFinalPayload = useCallback(async (prefData: MealPreference | null) => {
    if (!selectedBaby?._id) {
      return null;
    }

    try {
      const [latestMeasurement, activeMedications, activeConditions, behavioralState] = await Promise.all([
        getLatestMeasurement(selectedBaby._id),
        getActiveMedications(selectedBaby._id),
        getActiveConditions(selectedBaby._id),
        getBehavioralState(selectedBaby._id),
      ]);

      const finalPayload: GenerateMealPlanPayload = {
        child_id: selectedBaby._id,
        health_data: {
          age_months: calculateAgeMonths(selectedBaby) ?? 0,
          weight_kg: latestMeasurement?.weight?.value ?? 0,
          height_cm: latestMeasurement?.height?.value ?? 0,
          gender: selectedBaby.gender ?? 'string',
          activity_level: prefData?.activity_level ?? 'Moderate',
          medical_conditions: (activeConditions ?? [])
            .map((condition) => condition.conditionName)
            .filter(Boolean),
          medications: (activeMedications ?? [])
            .map((medication) => medication.name)
            .filter(Boolean),
          daily_calorie_target: 0,
        },
        preferences: {
          diet_type: prefData?.diet_type ?? 'Standard',
          allergies: selectedBaby.allergies ?? [],
          budget_level: prefData?.budget_level ?? 'Medium',
        },
        lifestyle: {
          meals_per_day: prefData?.meals_per_day ?? 5,
        },
        behavioral_state: {
          disliked_ingredients: behavioralState?.disliked_ingredients ?? [],
          liked_ingredients: behavioralState?.liked_ingredients ?? [],
        },
      };

      console.log('[FeedingMainComponent] Final generate-plan payload:', finalPayload);
      return finalPayload;
    } catch (error) {
      console.error('[FeedingMainComponent] Failed to build final payload:', error);
      return null;
    }
  }, [selectedBaby]);

  const loadTodayPlan = useCallback(async () => {
    if (!childId) {
      setTodayPlan(null);
      setMealFeedback({});
      setMealPreference(null);
      setIsLoading(false);
      setIsRefreshing(false);
      setErrorMessage('Child profile is not available.');
      return;
    }

    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }
      setErrorMessage(null);
      const [plan, preferences] = await Promise.all([
        getTodayGeneratedPlan(childId),
        parentId ? getMealPreference({ parentId, childId }) : Promise.resolve(null),
      ]);
      setMealPreference(preferences);
      setTodayPlan(plan?.plan ?? null);
      setMealFeedback(plan?.meal_feedback ?? {});

      if (!plan?.plan && preferences) {
        const finalPayload = await buildAndLogFinalPayload(preferences);
        if (finalPayload) {
          await generateMealPlan(finalPayload);
          const generatedTodayPlan = await getTodayGeneratedPlan(childId);
          setTodayPlan(generatedTodayPlan?.plan ?? null);
          setMealFeedback(generatedTodayPlan?.meal_feedback ?? {});
        }
      } else if (!plan?.plan) {
        await buildAndLogFinalPayload(preferences);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load today meal plan.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [childId, parentId, isRefreshing, buildAndLogFinalPayload]);

  useEffect(() => {
    loadTodayPlan();
  }, [loadTodayPlan]);

  const handleSavePreference = async (values: PreferencesFormValues) => {
    if (!childId || !parentId) {
      Alert.alert('Missing profile', 'Parent or child profile is not available.');
      return;
    }

    try {
      setIsSavingPreference(true);
      const payload = {
        parent_id: parentId,
        child_id: childId,
        diet_type: values.diet_type,
        budget_level: values.budget_level,
        meals_per_day: values.meals_per_day,
        activity_level: values.activity_level,
      };

      const saved = mealPreference
        ? await updateMealPreference(payload)
        : await createMealPreference(payload);

      setMealPreference(saved);
      setIsEditingPreferences(false);
      setIsPreferencesModalVisible(false);
      Alert.alert('Saved', 'Preferences saved successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save preferences.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSavingPreference(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTodayPlan();
  };

  const handleOpenPreferences = () => {
    if (!isChildProfileAvailable) {
      return;
    }
    setIsEditingPreferences(false);
    setIsPreferencesModalVisible(true);
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

          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={[
                styles.pastIconButton,
                !isChildProfileAvailable && styles.pastIconButtonDisabled,
              ]}
              activeOpacity={0.8}
              disabled={!isChildProfileAvailable}
              onPress={handleOpenPreferences}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={isChildProfileAvailable ? Colors.primary.DEFAULT : Colors.inactive}
              />
              <Text
                style={[
                  styles.pastIconButtonText,
                  !isChildProfileAvailable && styles.pastIconButtonTextDisabled,
                ]}
              >
                Preferences
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pastIconButton,
                !isChildProfileAvailable && styles.pastIconButtonDisabled,
              ]}
              activeOpacity={0.8}
              disabled={!isChildProfileAvailable}
              onPress={() => router.push('/past-data')}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={isChildProfileAvailable ? Colors.primary.DEFAULT : Colors.inactive}
              />
              <Text
                style={[
                  styles.pastIconButtonText,
                  !isChildProfileAvailable && styles.pastIconButtonTextDisabled,
                ]}
              >
                Past
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Loading today&apos;s meal plan...</Text>
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn&apos;t load today&apos;s meal plan</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadTodayPlan} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isLoading && !errorMessage && todayPlan ? (
          <TodayMealPlanCard
            plan={todayPlan}
            mealFeedback={mealFeedback}
            childId={childId!}
            onPlanUpdated={setTodayPlan}
            onFeedbackDone={loadTodayPlan}
          />
        ) : null}

        {!isLoading && !errorMessage && !mealPreference ? (
          <>
            <PreferencesForm onSubmit={handleSavePreference} />
            {isSavingPreference ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
                <Text style={styles.savingText}>Saving preferences...</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {!isLoading && !errorMessage && !todayPlan && !!mealPreference ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No meal plan displayed for today.</Text>
            <Text style={styles.emptyStateDescription}>
              Generate a meal plan first, then pull to refresh to view it here.
            </Text>
          </View>
        ) : null}

        <Modal
          transparent
          animationType="fade"
          visible={isPreferencesModalVisible}
          onRequestClose={() => setIsPreferencesModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {isEditingPreferences || !mealPreference ? (
                <>
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>
                      {mealPreference ? 'Update Meal Preferences' : 'Create Meal Preferences'}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalSecondaryButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        setIsEditingPreferences(false);
                        setIsPreferencesModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>

                  <PreferencesForm
                    onSubmit={handleSavePreference}
                    initialValues={
                      mealPreference
                        ? {
                            diet_type:
                              mealPreference.diet_type === 'Veg' ? 'Veg' : 'Standard',
                            budget_level:
                              mealPreference.budget_level === 'Low' ||
                              mealPreference.budget_level === 'High'
                                ? mealPreference.budget_level
                                : 'Medium',
                            meals_per_day: mealPreference.meals_per_day ?? 3,
                            activity_level:
                              mealPreference.activity_level === 'Light' ||
                              mealPreference.activity_level === 'Active'
                                ? mealPreference.activity_level
                                : 'Moderate',
                          }
                        : undefined
                    }
                  />

                  {isSavingPreference ? (
                    <View style={styles.savingContainer}>
                      <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
                      <Text style={styles.savingText}>Saving preferences...</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.modalTitle}>Meal Preferences</Text>

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Diet Type</Text>
                    <Text style={styles.modalValue}>{mealPreference.diet_type ?? '-'}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Budget Level</Text>
                    <Text style={styles.modalValue}>{mealPreference.budget_level ?? '-'}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Meals Per Day</Text>
                    <Text style={styles.modalValue}>{mealPreference.meals_per_day ?? '-'}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Activity Level</Text>
                    <Text style={styles.modalValue}>{mealPreference.activity_level ?? '-'}</Text>
                  </View>

                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      style={styles.modalSecondaryButton}
                      activeOpacity={0.8}
                      onPress={() => setIsPreferencesModalVisible(false)}
                    >
                      <Text style={styles.modalSecondaryButtonText}>Close</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      activeOpacity={0.8}
                      onPress={() => setIsEditingPreferences(true)}
                    >
                      <Text style={styles.modalCloseButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
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
  headerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  settingsButton: {
    flex: 1,
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  settingsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  pastIconButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary.DEFAULT,
  },
  pastIconButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  pastIconButtonDisabled: {
    borderColor: Colors.gray.light,
    backgroundColor: Colors.gray.light,
  },
  pastIconButtonTextDisabled: {
    color: Colors.inactive,
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
  emptyStateCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyStateDescription: {
    color: Colors.inactive,
    fontSize: 13,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  modalLabel: {
    color: Colors.inactive,
    fontSize: 14,
  },
  modalValue: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  modalEmptyText: {
    color: Colors.inactive,
    fontSize: 14,
    marginBottom: 14,
  },
  modalCloseButton: {
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalCloseButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  modalActionRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalSecondaryButton: {
    backgroundColor: Colors.gray.light,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalSecondaryButtonText: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '600',
  },
});
