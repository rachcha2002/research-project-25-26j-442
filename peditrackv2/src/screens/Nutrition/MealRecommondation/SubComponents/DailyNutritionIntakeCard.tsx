import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface DailyNutritionIntakeCardProps {
  completedMeals: number;
  totalMeals: number;
}

type NutrientKey = 'energy' | 'protein' | 'iron' | 'calcium';

const NUTRIENT_LABELS: Record<NutrientKey, string> = {
  energy: 'Energy',
  protein: 'Protein',
  iron: 'Iron',
  calcium: 'Calcium',
};

export const DailyNutritionIntakeCard: React.FC<DailyNutritionIntakeCardProps> = ({
  completedMeals,
  totalMeals,
}) => {
  const nutrients = useMemo(() => {
    const completionRatio = totalMeals > 0 ? completedMeals / totalMeals : 0;

    return (Object.keys(NUTRIENT_LABELS) as NutrientKey[]).map((key) => {
      const met = completionRatio >= 0.8;

      return {
        key,
        label: NUTRIENT_LABELS[key],
        met,
      };
    });
  }, [completedMeals, totalMeals]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Daily nutrition intake</Text>
      <Text style={styles.subtitle}>
        Based on today&apos;s completed meals
      </Text>

      <View style={styles.rowsContainer}>
        {nutrients.map((n) => (
          <View
            key={n.key}
            style={[styles.row, !n.met && styles.rowUnmet]}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={n.met ? 'checkmark-circle' : 'alert-circle-outline'}
                size={20}
                color={n.met ? Colors.primary.DEFAULT : Colors.error}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.nutrientLabel}>{n.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.inactive,
    marginTop: 2,
    marginBottom: 12,
  },
  rowsContainer: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: Colors.gray.light,
  },
  rowUnmet: {
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: '#FEE2E2',
  },
  iconContainer: {
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  nutrientLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
  },
  nutrientMeta: {
    fontSize: 11,
    color: Colors.gray.DEFAULT,
    marginTop: 2,
  },
});
