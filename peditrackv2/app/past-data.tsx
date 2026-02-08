import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar';
import { Ionicons } from '@expo/vector-icons';
import { DailyNutritionIntakeCard } from '@/screens/Nutrition/MealRecommondation/SubComponents/DailyNutritionIntakeCard';

type MealId = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner';

type PastMeal = {
  id: MealId;
  label: string;
  timeLabel: string;
  givenMeal: string;
  completed: boolean;
};

type PastDay = {
  offset: number; // 0 = yesterday, 1 = two days ago, etc.
  meals: PastMeal[];
};

const PAST_DAYS: PastDay[] = [
  {
    offset: 0, // yesterday
    meals: [
      {
        id: 'breakfast',
        label: 'Breakfast',
        timeLabel: '8:00 AM',
        givenMeal: 'Oatmeal with banana and warm milk',
        completed: true,
      },
      {
        id: 'morningSnack',
        label: 'Snack',
        timeLabel: '10:00 AM',
        givenMeal: 'Yogurt with soft fruit pieces',
        completed: true,
      },
      {
        id: 'lunch',
        label: 'Lunch',
        timeLabel: '1:00 PM',
        givenMeal: 'Rice, steamed veggies, and shredded chicken',
        completed: true,
      },
      {
        id: 'afternoonSnack',
        label: 'Snack',
        timeLabel: '4:00 PM',
        givenMeal: 'Mashed avocado on soft bread',
        completed: true,
      },
      {
        id: 'dinner',
        label: 'Dinner',
        timeLabel: '9:00 PM',
        givenMeal: 'Mashed potatoes with lentils and carrots',
        completed: true,
      },
    ],
  },
  {
    offset: 1, // 1 day before yesterday
    meals: [
      {
        id: 'breakfast',
        label: 'Breakfast',
        timeLabel: '8:10 AM',
        givenMeal: 'Rice porridge with milk',
        completed: true,
      },
      {
        id: 'morningSnack',
        label: 'Snack',
        timeLabel: '10:05 AM',
        givenMeal: 'Apple slices and yogurt',
        completed: true,
      },
      {
        id: 'lunch',
        label: 'Lunch',
        timeLabel: '12:50 PM',
        givenMeal: 'Soft rice, dhal, and carrot curry',
        completed: true,
      },
      {
        id: 'afternoonSnack',
        label: 'Snack',
        timeLabel: '4:15 PM',
        givenMeal: 'Milk and a small banana',
        completed: true,
      },
      {
        id: 'dinner',
        label: 'Dinner',
        timeLabel: '8:45 PM',
        givenMeal: 'Vegetable soup with soft bread',
        completed: true,
      },
    ],
  },
  {
    offset: 2, // 2 days before yesterday
    meals: [
      {
        id: 'breakfast',
        label: 'Breakfast',
        timeLabel: '7:50 AM',
        givenMeal: 'Mashed sweet potato and egg',
        completed: true,
      },
      {
        id: 'morningSnack',
        label: 'Snack',
        timeLabel: '10:00 AM',
        givenMeal: 'Fruit yogurt (no nuts)',
        completed: true,
      },
      {
        id: 'lunch',
        label: 'Lunch',
        timeLabel: '1:10 PM',
        givenMeal: 'Rice with fish and steamed veggies',
        completed: true,
      },
      {
        id: 'afternoonSnack',
        label: 'Snack',
        timeLabel: '4:20 PM',
        givenMeal: 'Cheese cubes and cucumber sticks',
        completed: true,
      },
      {
        id: 'dinner',
        label: 'Dinner',
        timeLabel: '9:05 PM',
        givenMeal: 'Mashed lentils with rice and spinach',
        completed: true,
      },
    ],
  },
];

export default function PastDataScreen() {
  const [dayIndex, setDayIndex] = useState(0); // 0 = yesterday, 1 = -1 day, 2 = -2 days

  const { displayDate, mealsForDay, completedMealIds } = useMemo(() => {
    const today = new Date();
    const base = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 1, // yesterday
    );

    const selected = PAST_DAYS[dayIndex];
    const dateForDay = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() - selected.offset,
    );

    const displayDate = dateForDay.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const completedMealIds = selected.meals
      .filter((m) => m.completed)
      .map((m) => m.id as MealId);

    return {
      displayDate,
      mealsForDay: selected.meals,
      completedMealIds,
    };
  }, [dayIndex]);

  const canGoLeft = dayIndex < PAST_DAYS.length - 1;
  const canGoRight = dayIndex > 0;

  return (
    <>
      <SecondaryTopBar />
      <View style={styles.container}>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.navButton, !canGoLeft && styles.navButtonDisabled]}
            disabled={!canGoLeft}
            onPress={() => {
              if (canGoLeft) {
                setDayIndex((prev) => prev + 1);
              }
            }}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={canGoLeft ? Colors.dark : Colors.inactive}
            />
          </TouchableOpacity>

          <Text style={styles.dateText}>{displayDate}</Text>

          <TouchableOpacity
            style={[styles.navButton, !canGoRight && styles.navButtonDisabled]}
            disabled={!canGoRight}
            onPress={() => {
              if (canGoRight) {
                setDayIndex((prev) => prev - 1);
              }
            }}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={canGoRight ? Colors.dark : Colors.inactive}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Meals of the day</Text>
            <Text style={styles.sectionSubtitle}>Based on your plan</Text>
          </View>

          {mealsForDay.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeaderRow}>
                <Text style={styles.mealLabel}>{meal.label}</Text>
                <Text style={styles.mealTime}>{meal.timeLabel}</Text>
              </View>
              <Text style={styles.mealGivenTitle}>What was given</Text>
              <Text style={styles.mealGivenText}>{meal.givenMeal}</Text>
            </View>
          ))}

          <View style={styles.nutritionCardWrapper}>
            <DailyNutritionIntakeCard
              completedMeals={completedMealIds.length}
              totalMeals={5}
              completedMealIds={completedMealIds}
            />
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.inactive,
  },
  mealCard: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: Colors.white,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  mealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mealLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  mealTime: {
    fontSize: 13,
    color: Colors.inactive,
  },
  mealGivenTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray.DEFAULT,
    marginBottom: 2,
  },
  mealGivenText: {
    fontSize: 13,
    color: Colors.dark,
  },
  nutritionCardWrapper: {
    marginTop: 12,
  },
});
