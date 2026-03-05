import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { getMedications, deleteMedication, Medication } from '@/services/healthAnalyticsService';
import { cancelMedicationReminders } from '@/services/pushNotificationService';
import { useBaby } from '@/contexts/BabyContext';

type TabType = 'all' | 'active' | 'completed' | 'discontinued';

export const MedicationsListScreen: React.FC = () => {
  const router = useRouter();
  const { selectedBaby } = useBaby();
  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (selectedBaby) {
        loadMedications();
      }
    }, [selectedBaby, selectedTab])
  );

  const loadMedications = async () => {
    if (!selectedBaby) return;

    try {
      setLoading(true);
      let data;
      
      if (selectedTab === 'all') {
        data = await getMedications(selectedBaby._id);
      } else {
        data = await getMedications(selectedBaby._id, { status: selectedTab });
      }
      
      setMedications(data);
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (medication: Medication) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete "${medication.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (medication._id) {
                await deleteMedication(medication._id);
                if (medication.reminderEnabled && medication.reminderTimes) {
                  await cancelMedicationReminders(medication._id, medication.reminderTimes);
                }
              }
              Alert.alert('Success', 'Medication deleted successfully');
              loadMedications();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      case 'discontinued':
        return '#EF4444';
      default:
        return Colors.inactive;
    }
  };

  const tabs = [
    { id: 'all' as TabType, label: 'All' },
    { id: 'active' as TabType, label: 'Active' },
    { id: 'completed' as TabType, label: 'Completed' },
    { id: 'discontinued' as TabType, label: 'Discontinued' },
  ];

  return (
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.pageTitle}>Medications & Vaccines</Text>

          {/* Quick Navigation */}
          <View style={styles.quickNavContainer}>
            <View style={styles.quickNavCard}>
              <Ionicons name="medical" size={24} color={Colors.primary.DEFAULT} />
              <Text style={styles.quickNavTitle}>Medications</Text>
              <Text style={styles.quickNavSubtitle}>Active</Text>
            </View>
            <TouchableOpacity 
              style={styles.quickNavCard}
              onPress={() => router.push('/health-analytics/vaccinations' as any)}
            >
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              <Text style={styles.quickNavTitle}>Vaccinations</Text>
              <Text style={styles.quickNavSubtitle}>View Schedule →</Text>
            </TouchableOpacity>
          </View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>Medications</Text>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  selectedTab === tab.id && styles.activeTab,
                ]}
                onPress={() => setSelectedTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab.id && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Medications List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
              <Text style={styles.loadingText}>Loading medications...</Text>
            </View>
          ) : medications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={60} color={Colors.inactive} />
              <Text style={styles.emptyTitle}>No medications</Text>
              <Text style={styles.emptyText}>
                {selectedTab === 'all'
                  ? 'Add your first medication to get started'
                  : `No ${selectedTab} medications found`}
              </Text>
            </View>
          ) : (
            medications.map((medication) => (
              <TouchableOpacity
                key={medication._id}
                style={styles.medicationCard}
                onPress={() =>
                  router.push({
                    pathname: '/health-analytics/medications/edit/[id]',
                    params: { id: medication._id },
                  } as any)
                }
              >
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationLeft}>
                    <Ionicons name="medical" size={24} color={Colors.primary.DEFAULT} />
                    <View style={styles.medicationInfo}>
                      <Text style={styles.medicationName}>{medication.name}</Text>
                      <Text style={styles.medicationDosage}>
                        {medication.dosage.amount}
                        {medication.dosage.unit} - {medication.frequency}
                      </Text>
                      <View style={styles.medicationMeta}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(medication.status ?? '') },
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {(medication.status ?? '').charAt(0).toUpperCase() +
                              (medication.status ?? '').slice(1)}
                          </Text>
                        </View>
                        {medication.reminderEnabled && (
                          <View style={styles.reminderBadge}>
                            <Ionicons
                              name="notifications"
                              size={12}
                              color={Colors.primary.DEFAULT}
                            />
                            <Text style={styles.reminderText}>Reminders On</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(medication)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {medication.notes && (
                  <Text style={styles.medicationNotes} numberOfLines={2}>
                    {medication.notes}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Add Button — sits above the safe-area bottom edge */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/health-analytics/medications/add' as any)}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
          <Text style={styles.addButtonText}>Add Medication</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 16,
  },
  quickNavContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickNavCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickNavTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginTop: 8,
  },
  quickNavSubtitle: {
    fontSize: 12,
    color: Colors.inactive,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
  },
  activeTabText: {
    color: Colors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.inactive,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.inactive,
    marginTop: 8,
    textAlign: 'center',
  },
  medicationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medicationLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: Colors.inactive,
    marginBottom: 8,
  },
  medicationMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.white,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.primary.light + '20',
  },
  reminderText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary.DEFAULT,
  },
  deleteButton: {
    padding: 8,
  },
  medicationNotes: {
    fontSize: 13,
    color: Colors.inactive,
    marginTop: 12,
    lineHeight: 18,
  },
  addButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
    backgroundColor: Colors.primary.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
