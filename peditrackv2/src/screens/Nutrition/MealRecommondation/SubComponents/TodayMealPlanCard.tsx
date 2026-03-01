import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { DailyGeneratedMealPlan } from '@/services/generatedPlansService';

type TodayMealPlanCardProps = {
  plan: DailyGeneratedMealPlan;
};

export const TodayMealPlanCard: React.FC<TodayMealPlanCardProps> = ({ plan }) => {
  const meals = Object.values(plan);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today&apos;s Meal Plan</Text>

      {meals.map((meal) => (
        <View key={meal.meal_type} style={styles.mealBlock}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealName}>{meal.meal_type}</Text>
            <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
          </View>

          <View style={styles.plateWrap}>
            {Object.entries(meal.plate).map(([itemKey, itemValue]) => (
              <View key={`${meal.meal_type}-${itemKey}`} style={styles.itemRow}>
                <Text style={styles.itemLabel}>{itemKey.replace(/_/g, ' ')}</Text>
                <Text style={styles.itemValue}>{itemValue}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 14,
  },
  mealBlock: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  mealCalories: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  plateWrap: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemLabel: {
    flex: 1,
    textTransform: 'capitalize',
    fontSize: 13,
    color: Colors.inactive,
  },
  itemValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: Colors.dark,
    fontWeight: '500',
  },
});
