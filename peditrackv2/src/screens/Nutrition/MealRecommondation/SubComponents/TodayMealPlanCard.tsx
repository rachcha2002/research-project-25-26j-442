import React, { useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import {
  DailyGeneratedMealPlan,
  MealFeedbackMap,
  MealPlanEntry,
  submitMealFeedback,
} from '@/services/generatedPlansService';

type TodayMealPlanCardProps = {
  plan: DailyGeneratedMealPlan;
  mealFeedback?: MealFeedbackMap;
  childId: string;
  onPlanUpdated?: (updatedPlan: DailyGeneratedMealPlan) => void;
  onFeedbackDone?: () => void;
};

export const TodayMealPlanCard: React.FC<TodayMealPlanCardProps> = ({
  plan,
  mealFeedback,
  childId,
  onPlanUpdated,
  onFeedbackDone,
}) => {
  const meals = Object.values(plan);
  const [activeRejectMeal, setActiveRejectMeal] = useState<MealPlanEntry | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [newMeal, setNewMeal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getMealFeedbackStatus = (mealType: string) => {
    if (!mealFeedback) {
      return null;
    }

    if (mealFeedback[mealType]) {
      return mealFeedback[mealType];
    }

    const normalizedMealType = mealType.toLowerCase().replace(/\s+/g, '');
    const matchedKey = Object.keys(mealFeedback).find(
      (key) => key.toLowerCase().replace(/\s+/g, '') === normalizedMealType,
    );

    return matchedKey ? mealFeedback[matchedKey] : null;
  };

  const rejectItems = useMemo(() => {
    if (!activeRejectMeal) {
      return [];
    }
    return Object.values(activeRejectMeal.plate);
  }, [activeRejectMeal]);

  const toggleItem = (item: string) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((entry) => entry !== item) : [...prev, item],
    );
  };

  const handleAcceptMeal = async (meal: MealPlanEntry) => {
    try {
      await submitMealFeedback({
        child_id: childId,
        meal_type: meal.meal_type.toLowerCase(),
        action: 'accept',
        new_meal: false,
        actioned_items: Object.values(meal.plate),
      });
      Alert.alert('Thanks', `${meal.meal_type} accepted.`);
      onFeedbackDone?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit acceptance.';
      Alert.alert('Error', message);
    }
  };

  const handleOpenRejectModal = (meal: MealPlanEntry) => {
    setActiveRejectMeal(meal);
    setSelectedItems([]);
    setNewMeal(false);
  };

  const handleSubmitReject = async () => {
    if (!activeRejectMeal) {
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Select items', 'Please select at least one item to reject.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitMealFeedback({
        child_id: childId,
        meal_type: activeRejectMeal.meal_type.toLowerCase(),
        action: 'reject',
        new_meal: newMeal,
        actioned_items: selectedItems,
      });

      if (newMeal && response.updated_plan) {
        onPlanUpdated?.(response.updated_plan);
      }

      onFeedbackDone?.();
      Alert.alert('Submitted', response.message);
      setActiveRejectMeal(null);
      setSelectedItems([]);
      setNewMeal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit rejection.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>

      {meals.map((meal) => {
        const feedback = getMealFeedbackStatus(meal.meal_type);

        return (
        <View key={meal.meal_type} style={styles.card}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealName}>{meal.meal_type}</Text>
            <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
          </View>

          {feedback?.status ? (
            <View
              style={[
                styles.feedbackStatusBadge,
                feedback.status === 'accepted'
                  ? styles.acceptedStatusBadge
                  : styles.rejectedStatusBadge,
              ]}
            >
              <Text
                style={[
                  styles.feedbackStatusText,
                  feedback.status === 'accepted'
                    ? styles.acceptedStatusText
                    : styles.rejectedStatusText,
                ]}
              >
                {feedback.status === 'accepted' ? 'Accepted' : 'Rejected'}
              </Text>
            </View>
          ) : null}

          <View style={styles.mealSetWrap}>
            <Text style={styles.mealSetTitle}>Meal Set</Text>
            <View style={styles.mealSetItemsWrap}>
              {Object.entries(meal.plate).map(([itemKey, itemValue]) => (
                <View key={`${meal.meal_type}-${itemKey}`} style={styles.mealSetItemChip}>
                  <Text style={styles.mealSetItemText}>{itemValue}</Text>
                </View>
              ))}
            </View>
          </View>

          {!feedback?.status ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                activeOpacity={0.8}
                onPress={() => handleAcceptMeal(meal)}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                activeOpacity={0.8}
                onPress={() => handleOpenRejectModal(meal)}
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )})}

      <Modal
        transparent
        animationType="fade"
        visible={!!activeRejectMeal}
        onRequestClose={() => setActiveRejectMeal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Items - {activeRejectMeal?.meal_type}</Text>

            {rejectItems.map((item) => {
              const selected = selectedItems.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItemRow, selected && styles.modalItemRowSelected]}
                  onPress={() => toggleItem(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  <Text style={styles.modalItemCheck}>{selected ? '✓' : ''}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Regenerate meal</Text>
              <Switch value={newMeal} onValueChange={setNewMeal} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setActiveRejectMeal(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, isSubmitting && styles.disabledButton]}
                onPress={handleSubmitReject}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.white,
    marginBottom: 12,
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
  feedbackStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    backgroundColor: Colors.gray.light,
  },
  acceptedStatusBadge: {
    borderWidth: 1,
    borderColor: Colors.primary.light,
  },
  rejectedStatusBadge: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  feedbackStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
  },
  acceptedStatusText: {
    color: Colors.primary.light,
  },
  rejectedStatusText: {
    color: Colors.error,
  },
  mealSetWrap: {
    marginTop: 2,
  },
  mealSetTitle: {
    fontSize: 12,
    color: Colors.inactive,
    fontWeight: '600',
    marginBottom: 8,
  },
  mealSetItemsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealSetItemChip: {
    backgroundColor: Colors.gray.light,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mealSetItemText: {
    fontSize: 13,
    color: Colors.dark,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 10,
  },
  modalItemRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalItemRowSelected: {
    borderColor: Colors.error,
    backgroundColor: '#FEF2F2',
  },
  modalItemText: {
    flex: 1,
    color: Colors.dark,
    fontSize: 13,
  },
  modalItemCheck: {
    color: Colors.error,
    fontWeight: '700',
    width: 16,
    textAlign: 'center',
  },
  toggleRow: {
    marginTop: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray.light,
  },
  submitButton: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: Colors.dark,
    fontWeight: '600',
    fontSize: 13,
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
