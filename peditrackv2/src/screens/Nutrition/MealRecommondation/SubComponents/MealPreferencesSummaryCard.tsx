import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { MealPreference } from '@/services/mealPreferencesService';

type MealPreferencesSummaryCardProps = {
  data: MealPreference;
};

const formatDiet = (dietType: string | null) => {
  if (dietType === 'Veg') return 'Veg';
  if (dietType === 'Standard') return 'Non-Veg';
  return '-';
};

const toText = (value: string | number | null) =>
  value === null || value === undefined || value === '' ? '-' : String(value);

export const MealPreferencesSummaryCard: React.FC<MealPreferencesSummaryCardProps> = ({ data }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Saved Meal Preferences</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Diet Type</Text>
        <Text style={styles.value}>{formatDiet(data.diet_type)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Budget Level</Text>
        <Text style={styles.value}>{toText(data.budget_level)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Meals Per Day</Text>
        <Text style={styles.value}>{toText(data.meals_per_day)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Activity Level</Text>
        <Text style={styles.value}>{toText(data.activity_level)}</Text>
      </View>
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 14,
    color: Colors.inactive,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
});
