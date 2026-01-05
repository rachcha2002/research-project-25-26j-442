import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';

interface MealCardProps {
  label: string;
  timeLabel: string;
  suggestion?: string;
  isActive?: boolean;
  isPast?: boolean;
  onPress?: () => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  label,
  timeLabel,
  suggestion,
  isActive = false,
  isPast = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        isPast ? styles.cardCompleted : styles.cardPending,
        isActive && styles.cardActive,
      ]}
    >
      <Text style={styles.mealLabel}>{label}</Text>
      <Text style={styles.timeLabel}>{timeLabel}</Text>
      {suggestion ? (
        <View style={styles.suggestionContainer}>
          <Text style={styles.suggestionTitle}>Suggested meal</Text>
          <Text style={styles.suggestionText}>{suggestion}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: 'center',
  },
  cardActive: {
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardCompleted: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  cardPending: {
    borderWidth: 2,
    borderColor: Colors.primary.DEFAULT,
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: Colors.inactive,
  },
  suggestionContainer: {
    marginTop: 8,
  },
  suggestionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
    marginBottom: 2,
  },
  suggestionText: {
    fontSize: 11,
    color: Colors.dark,
  },
});
