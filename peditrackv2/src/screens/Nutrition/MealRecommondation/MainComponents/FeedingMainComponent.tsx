import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { MealCard } from '../SubComponents/MealCard';
import { DailyNutritionIntakeCard } from '../SubComponents/DailyNutritionIntakeCard';

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
    hour: 8,
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

  const completedMealsCount = useMemo(
    () => mealsWithDate.filter((m) => m.dateTime < now).length,
    [mealsWithDate, now],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.mealRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealRowContent}
        >
          {mealsWithDate.map((meal) => {
            const isPast = meal.dateTime < now;
            const isActive = meal.id === activeMealId;

            return (
              <MealCard
                key={meal.id}
                label={meal.label}
                timeLabel={meal.timeLabel}
                suggestion={meal.suggestion}
                isPast={isPast}
                isActive={isActive}
                onPress={() => setActiveMealId(meal.id)}
              />
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.nutritionCardWrapper}>
        <DailyNutritionIntakeCard
          completedMeals={completedMealsCount}
          totalMeals={mealsWithDate.length}
        />
      </View>

      <View style={styles.bodyPlaceholder}>
        <Text style={styles.bodyTitle}>Today&apos;s Feeding Overview</Text>
        <Text style={styles.bodyDescription}>
          Select a meal card above to view or update feeding details. This area can show
          logs, notes, and more in the next iteration.
        </Text>
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
