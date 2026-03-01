import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useBaby } from '@/contexts/BabyContext';
import {
  DailyGeneratedMealPlan,
  getTodayGeneratedPlan,
} from '@/services/generatedPlansService';
import { TodayMealPlanCard } from '../SubComponents/TodayMealPlanCard';

export const FeedingMainComponent: React.FC = () => {
  const { selectedBaby } = useBaby();

  const [todayPlan, setTodayPlan] = useState<DailyGeneratedMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const childId = selectedBaby?._id;

  const loadTodayPlan = useCallback(async () => {
    if (!childId) {
      setTodayPlan(null);
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
      const plan = await getTodayGeneratedPlan(childId);
      setTodayPlan(plan);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load today meal plan.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [childId, isRefreshing]);

  useEffect(() => {
    loadTodayPlan();
  }, [loadTodayPlan]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTodayPlan();
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
            Here is your child&apos;s generated meal plan for today.
          </Text>
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
          <TodayMealPlanCard plan={todayPlan} />
        ) : null}

        {!isLoading && !errorMessage && !todayPlan ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No meal plan displayed for today.</Text>
            <Text style={styles.emptyStateDescription}>
              Generate a meal plan first, then pull to refresh to view it here.
            </Text>
          </View>
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
});
