import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar';
import { Colors } from '@/constants/Colors';
import { useBaby } from '@/contexts/BabyContext';
import {
  getAcceptedMeals,
  getRejectedMeals,
  removeBehavioralItems,
} from '@/services/behavioralStateService';

type TabType = 'accepted' | 'rejected';

export default function PastDataScreen() {
  const router = useRouter();
  const { selectedBaby } = useBaby();

  const [activeTab, setActiveTab] = useState<TabType>('accepted');
  const [acceptedMeals, setAcceptedMeals] = useState<string[]>([]);
  const [rejectedMeals, setRejectedMeals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const childId = selectedBaby?._id;

  const loadLists = useCallback(async () => {
    if (!childId) {
      setAcceptedMeals([]);
      setRejectedMeals([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [acceptedResponse, rejectedResponse] = await Promise.all([
        getAcceptedMeals(childId),
        getRejectedMeals(childId),
      ]);

      setAcceptedMeals(acceptedResponse.meals ?? []);
      setRejectedMeals(rejectedResponse.meals ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load past data.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const visibleItems = useMemo(
    () => (activeTab === 'accepted' ? acceptedMeals : rejectedMeals),
    [acceptedMeals, rejectedMeals, activeTab],
  );

  const acceptedCount = acceptedMeals.length;
  const rejectedCount = rejectedMeals.length;

  const onRefresh = useCallback(async () => {
    if (!childId) {
      return;
    }

    try {
      setIsRefreshing(true);
      await loadLists();
    } finally {
      setIsRefreshing(false);
    }
  }, [childId, loadLists]);

  const handleDeleteItem = async (item: string) => {
    if (!childId || isDeleting) {
      return;
    }

    const targetList = activeTab === 'accepted' ? 'Accepted Meals' : 'Rejected Meals';

    Alert.alert(
      'Delete meal',
      `Remove "${item}" from ${targetList}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const response = await removeBehavioralItems(childId, activeTab, [item]);

              if (activeTab === 'accepted') {
                setAcceptedMeals(response.meals ?? []);
              } else {
                setRejectedMeals(response.meals ?? []);
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to delete item.';
              Alert.alert('Error', message);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <SecondaryTopBar
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Meal Acceptance History</Text>
          <Text style={styles.summarySubtitle}>
            Track what {selectedBaby?.name || 'your child'} usually accepts or rejects.
          </Text>

          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success.DEFAULT} />
              <Text style={styles.summaryStatValue}>{acceptedCount}</Text>
              <Text style={styles.summaryStatLabel}>Accepted</Text>
            </View>

            <View style={styles.summaryStatDivider} />

            <View style={styles.summaryStatItem}>
              <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.summaryStatValue}>{rejectedCount}</Text>
              <Text style={styles.summaryStatLabel}>Rejected</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'accepted' && styles.tabButtonActive]}
            onPress={() => setActiveTab('accepted')}
            activeOpacity={0.8}
          >
            <View style={styles.tabButtonContent}>
              <Text
                style={[styles.tabText, activeTab === 'accepted' && styles.tabTextActive]}
              >
                Accepted Meals
              </Text>
              <View style={[styles.tabCountPill, activeTab === 'accepted' && styles.tabCountPillActive]}>
                <Text style={[styles.tabCountText, activeTab === 'accepted' && styles.tabCountTextActive]}>
                  {acceptedCount}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'rejected' && styles.tabButtonActive]}
            onPress={() => setActiveTab('rejected')}
            activeOpacity={0.8}
          >
            <View style={styles.tabButtonContent}>
              <Text
                style={[styles.tabText, activeTab === 'rejected' && styles.tabTextActive]}
              >
                Rejected Meals
              </Text>
              <View style={[styles.tabCountPill, activeTab === 'rejected' && styles.tabCountPillActive]}>
                <Text style={[styles.tabCountText, activeTab === 'rejected' && styles.tabCountTextActive]}>
                  {rejectedCount}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Loading meal history...</Text>
          </View>
        ) : (
          <FlatList
            data={visibleItems}
            keyExtractor={(item, index) => `${item}-${index}`}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary.DEFAULT}
              />
            }
            contentContainerStyle={
              visibleItems.length === 0 ? styles.emptyListContainer : styles.listContainer
            }
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemTextWrap}>
                  <Ionicons
                    name={activeTab === 'accepted' ? 'thumbs-up-outline' : 'thumbs-down-outline'}
                    size={16}
                    color={activeTab === 'accepted' ? Colors.success.DEFAULT : Colors.error}
                  />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item)}
                  disabled={isDeleting}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyStateCard}>
                <Ionicons name="restaurant-outline" size={24} color={Colors.inactive} />
                <Text style={styles.emptyTitle}>No meals yet</Text>
                <Text style={styles.emptyText}>
                  No {activeTab} meals found for this child.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  summarySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.inactive,
  },
  summaryStatsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: Colors.inactive,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabCountPill: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  tabCountPillActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark,
  },
  tabCountTextActive: {
    color: Colors.white,
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 28,
    gap: 8,
  },
  loadingText: {
    color: Colors.inactive,
    fontSize: 13,
  },
  listContainer: {
    paddingBottom: 24,
    gap: 10,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  itemTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  itemText: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emptyStateCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.inactive,
    textAlign: 'center',
  },
});
