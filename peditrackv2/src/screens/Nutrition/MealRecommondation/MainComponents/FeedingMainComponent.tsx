import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { MealCard } from '../SubComponents/MealCard';
import { DailyNutritionIntakeCard } from '../SubComponents/DailyNutritionIntakeCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

type MealId = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner';

type Meal = {
  id: MealId;
  label: string;
  hour: number;
  minute: number;
  timeLabel: string;
  suggestion: string;
};

const TODAY_MEALS: Meal[] = [
  {
    id: 'breakfast',
    label: 'Breakfast',
    hour: 0,
    minute: 0,
    timeLabel: '8:00 AM',
    suggestion: 'Oatmeal with banana and warm milk',
  },
  {
    id: 'morningSnack',
    label: 'Snack',
    hour: 10,
    minute: 0,
    timeLabel: '10:00 AM',
    suggestion: 'Yogurt with soft fruit pieces',
  },
  {
    id: 'lunch',
    label: 'Lunch',
    hour: 13,
    minute: 0,
    timeLabel: '1:00 PM',
    suggestion: 'Rice, steamed veggies, and shredded chicken',
  },
  {
    id: 'afternoonSnack',
    label: 'Snack',
    hour: 16,
    minute: 0,
    timeLabel: '4:00 PM',
    suggestion: 'Mashed avocado on soft bread',
  },
  {
    id: 'dinner',
    label: 'Dinner',
    hour: 19,
    minute: 0,
    timeLabel: '9:00 PM',
    suggestion: 'Mashed potatoes with lentils and carrots',
  },
];

export const FeedingMainComponent: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ completedMealId?: string }>();
  const manuallyCompletedId = (params.completedMealId as MealId | undefined) ?? undefined;
  const { mealsWithDate, initialActiveMealId, now } = useMemo(() => {
    const today = new Date();
    const now = new Date();

    const mealsWithDate = TODAY_MEALS.map((meal) => ({
      ...meal,
      dateTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        meal.hour,
        meal.minute,
      ),
    }));

    const upcoming = mealsWithDate.filter((m) => m.dateTime >= now);
    const activeMeal =
      upcoming.length > 0
        ? upcoming.reduce((next, current) =>
            current.dateTime < next.dateTime ? current : next,
          upcoming[0])
        : mealsWithDate[mealsWithDate.length - 1];

    return { mealsWithDate, initialActiveMealId: activeMeal.id as MealId, now };
  }, []);

  const [activeMealId, setActiveMealId] = useState<MealId>(initialActiveMealId);

  const completedMealIds = useMemo(
    () =>
      mealsWithDate
        .filter(
          (m) =>
            (m.id !== 'dinner' && m.dateTime < now) ||
            (manuallyCompletedId && m.id === manuallyCompletedId),
        )
        .map((m) => m.id),
    [mealsWithDate, now, manuallyCompletedId],
  );

  const completedMealsCount = completedMealIds.length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.mealRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealRowContent}
        >
          {mealsWithDate.map((meal) => {
              // Treat dinner as incomplete by time, but allow manual completion override
              const isPastByTime = meal.id !== 'dinner' && meal.dateTime < now;
              const isPast =
                (manuallyCompletedId && meal.id === manuallyCompletedId) || isPastByTime;
            const isActive = meal.id === activeMealId;

            return (
              <MealCard
                key={meal.id}
                label={meal.label}
                timeLabel={meal.timeLabel}
                suggestion={meal.suggestion}
                isPast={isPast}
                isActive={isActive}
                onPress={() => {
                  setActiveMealId(meal.id);
                  router.push({
                    pathname: '/meal-details',
                    params: {
                      id: meal.id,
                      label: meal.label,
                      timeLabel: meal.timeLabel,
                      suggestion: meal.suggestion,
                      isPast: String(isPast),
                    },
                  });
                }}
              />
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.nutritionCardWrapper}>
        <DailyNutritionIntakeCard
          completedMeals={completedMealsCount}
          totalMeals={mealsWithDate.length}
          completedMealIds={completedMealIds}
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={() => {
            router.push('/nutrition-tracker');
          }}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#E0E7FF' }]}>
            <Ionicons name="add-circle" size={24} color={Colors.primary.light} />
          </View>
          <Text style={styles.actionTitle}>Nutrition Checker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={() => {
            router.push('/past-data');
          }}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#E0E7FF' }]}>
            <Ionicons name="time" size={24} color={Colors.primary.light} />
          </View>
          <Text style={styles.actionTitle}>Past data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 8,
  },
  mealRowWrapper: {
    paddingVertical: 8,
  },
  mealRowContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  nutritionCardWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    textAlign: 'center',
  },
  bodyPlaceholder: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  bodyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  bodyDescription: {
    fontSize: 14,
    color: Colors.inactive,
    lineHeight: 20,
  },
});
