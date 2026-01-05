import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar';
import { Ionicons } from '@expo/vector-icons';

type MealId = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner';

const MEAL_NUTRIENTS: Record<MealId, string[]> = {
  breakfast: ['Energy', 'Carbohydrates', 'Protein', 'Calcium', 'Vitamin D'],
  morningSnack: ['Energy', 'Protein', 'Calcium'],
  lunch: ['Energy', 'Protein', 'Iron', 'Fiber', 'Vitamin C'],
  afternoonSnack: ['Energy', 'Healthy fats', 'Fiber'],
  dinner: ['Energy', 'Protein', 'Iron', 'Calcium'],
};

const ALT_SUGGESTIONS: Record<MealId, string[]> = {
  breakfast: [
    'Wholegrain toast with mashed banana',
    'Scrambled egg with soft veggies',
  ],
  morningSnack: [
    'Fruit yogurt with berries',
    'Handful of soft fruit slices',
  ],
  lunch: [
    'Pasta with tomato sauce and lentils',
    'Rice with beans and steamed veggies',
  ],
  afternoonSnack: [
    'Peanut butter on soft bread (if safe)',
    'Cheese cubes with cucumber sticks',
  ],
  dinner: [
    'Mashed sweet potato with chicken',
    'Vegetable soup with soft bread',
  ],
};

export default function MealDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    label?: string;
    timeLabel?: string;
    suggestion?: string;
    isPast?: string;
  }>();

  const mealId = (params.id as MealId) || 'breakfast';
  const label = params.label || 'Meal';
  const timeLabel = params.timeLabel || '';
  const suggestion = params.suggestion || '';
  const initiallyCompleted = params.isPast === 'true';

  const [completed, setCompleted] = useState<boolean>(initiallyCompleted);
  const [time, setTime] = useState<string>(timeLabel);
  const [timeDate, setTimeDate] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editedSuggestion, setEditedSuggestion] = useState<string>(suggestion);
  const [rejected, setRejected] = useState<boolean>(false);

  const nutrients = useMemo(() => MEAL_NUTRIENTS[mealId] ?? [], [mealId]);

  return (
    <>
      <SecondaryTopBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <Text style={styles.mealLabel}>{label}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color={Colors.inactive} />
            <Text style={styles.timeText}>{time || 'Set meal time'}</Text>
            <TouchableOpacity
              style={styles.editTimeButton}
              activeOpacity={0.7}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="create-outline" size={16} color={Colors.primary.DEFAULT} />
            </TouchableOpacity>
          </View>

          <View style={styles.suggestionBlock}>
            <Text style={styles.sectionTitle}>Suggested meal</Text>
            <TextInput
              style={styles.suggestionInput}
              value={editedSuggestion}
              onChangeText={setEditedSuggestion}
              multiline
              placeholder={suggestion || 'Describe the meal you plan to give'}
              placeholderTextColor={Colors.inactive}
            />

            {suggestion ? (
              <TouchableOpacity
                style={styles.rejectButton}
                activeOpacity={0.8}
                onPress={() => setRejected((prev) => !prev)}
              >
                <Text style={styles.rejectButtonText}>
                  {rejected ? 'Undo reject system suggestion' : 'Reject system suggestion'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={timeDate}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                setTimeDate(selectedDate);
                const formatted = selectedDate.toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                setTime(formatted);
              }
            }}
          />
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Covered nutrition</Text>
          <View style={styles.chipContainer}>
            {nutrients.map((n) => (
              <View key={n} style={styles.chip}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Colors.primary.DEFAULT}
                  style={styles.chipIcon}
                />
                <Text style={styles.chipText}>{n}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <Ionicons
              name={completed ? 'checkmark-circle' : 'alert-circle-outline'}
              size={20}
              color={completed ? '#10B981' : Colors.error}
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>
              {completed ? 'Meal marked as completed' : 'Meal not marked as completed yet'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.completeButton, completed && styles.completeButtonCompleted]}
            activeOpacity={0.8}
            onPress={() => {
              if (completed) {
                setCompleted(false);
              } else {
                setCompleted(true);
                if (mealId) {
                  router.replace({
                    pathname: '/(tabs)/location',
                    params: { completedMealId: mealId },
                  });
                }
              }
            }}
          >
            <Text style={styles.completeButtonText}>
              {completed ? 'Undo completed' : 'Mark as completed'}
            </Text>
          </TouchableOpacity>

          {rejected && suggestion ? (
            <View style={styles.originalSuggestionBlock}>
              <Text style={styles.sectionTitle}>System suggested meal</Text>
              <Text style={styles.originalSuggestionText}>{suggestion}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>More suggestions</Text>
          <View style={styles.moreSuggestionsList}>
            {(ALT_SUGGESTIONS[mealId] || []).map((alt) => (
              <TouchableOpacity
                key={alt}
                style={styles.moreSuggestionChip}
                activeOpacity={0.8}
                onPress={() => setEditedSuggestion(alt)}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={14}
                  color={Colors.primary.DEFAULT}
                  style={styles.moreSuggestionIcon}
                />
                <Text style={styles.moreSuggestionText}>{alt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  headerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  mealLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    marginLeft: 4,
    fontSize: 15,
    color: Colors.inactive,
  },
  editTimeButton: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: Colors.gray.light,
  },
  suggestionBlock: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 6,
  },
  suggestionInput: {
    marginTop: 4,
    fontSize: 15,
    color: Colors.dark,
    lineHeight: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Colors.gray.light,
    textAlignVertical: 'top',
  },
  rejectButton: {
    marginTop: 6,
  },
  rejectButtonText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Colors.gray.light,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 14,
    color: Colors.dark,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 15,
    color: Colors.gray.DEFAULT,
    flex: 1,
  },
  completeButton: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary.DEFAULT,
  },
  completeButtonCompleted: {
    backgroundColor: '#10B981',
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  originalSuggestionBlock: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  originalSuggestionText: {
    fontSize: 15,
    color: Colors.gray.DEFAULT,
    lineHeight: 18,
  },
  moreSuggestionsList: {
    marginTop: 6,
    gap: 8,
  },
  moreSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Colors.gray.light,
  },
  moreSuggestionIcon: {
    marginRight: 4,
  },
  moreSuggestionText: {
    fontSize: 14,
    color: Colors.dark,
  },
});
