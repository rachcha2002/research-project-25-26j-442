import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

  const handleDeleteItem = (item: string) => {
    if (!childId || isDeleting) {
      return;
    }

    Alert.alert('Remove item', `Delete "${item}" from ${activeTab} meals?`, [
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
    ]);
  };

  return (
    <View style={styles.container}>
      <SecondaryTopBar
        title="Past Meals"
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'accepted' && styles.tabButtonActive]}
            onPress={() => setActiveTab('accepted')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabText, activeTab === 'accepted' && styles.tabTextActive]}
            >
              Accepted Meals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'rejected' && styles.tabButtonActive]}
            onPress={() => setActiveTab('rejected')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabText, activeTab === 'rejected' && styles.tabTextActive]}
            >
              Rejected Meals
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Loading meals...</Text>
          </View>
        ) : (
          <FlatList
            data={visibleItems}
            keyExtractor={(item, index) => `${item}-${index}`}
            contentContainerStyle={
              visibleItems.length === 0 ? styles.emptyListContainer : styles.listContainer
            }
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <Text style={styles.itemText}>{item}</Text>
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
              <Text style={styles.emptyText}>
                No {activeTab} meals found.
              </Text>
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
  },
  tabButtonActive: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  tabText: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.white,
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 20,
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
  },
  itemText: {
    flex: 1,
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
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
  emptyText: {
    fontSize: 14,
    color: Colors.inactive,
    textAlign: 'center',
  },
});
