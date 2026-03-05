import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { getVaccinations, deleteVaccination, Vaccination } from '@/services/healthAnalyticsService';
import { useBaby } from '@/contexts/BabyContext';

type TabType = 'all' | 'completed' | 'scheduled' | 'overdue';

export const VaccinationsListScreen: React.FC = () => {
  const router = useRouter();
  const { selectedBaby } = useBaby();
  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedBaby) {
      loadVaccinations();
    }
  }, [selectedBaby, selectedTab]);

  const loadVaccinations = async () => {
    if (!selectedBaby) return;

    try {
      setLoading(true);
      let data;
      
      if (selectedTab === 'all') {
        data = await getVaccinations(selectedBaby._id);
      } else {
        data = await getVaccinations(selectedBaby._id, { status: selectedTab });
      }
      
      setVaccinations(data);
    } catch (error) {
      console.error('Error loading vaccinations:', error);
      Alert.alert('Error', 'Failed to load vaccinations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (vaccinationId: string, vaccineName: string) => {
    Alert.alert(
      'Delete Vaccination',
      `Are you sure you want to delete "${vaccineName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVaccination(vaccinationId);
              Alert.alert('Success', 'Vaccination deleted successfully');
              loadVaccinations();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete vaccination');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'scheduled':
        return '#3B82F6';
      case 'overdue':
        return '#EF4444';
      case 'skipped':
        return '#6B7280';
      default:
        return Colors.inactive;
    }
  };

  const getCompletedCount = () => vaccinations.filter(v => v.status === 'completed').length;
  const getTotalCount = () => vaccinations.length;

  const tabs = [
    { id: 'all' as TabType, label: 'All' },
    { id: 'completed' as TabType, label: 'Completed' },
    { id: 'scheduled' as TabType, label: 'Upcoming' },
    { id: 'overdue' as TabType, label: 'Overdue' },
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
          {/* Title & Progress */}
          <Text style={styles.pageTitle}>Vaccinations</Text>
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Immunization Progress</Text>
            <Text style={styles.progressText}>
              {getCompletedCount()} of {getTotalCount()} vaccines completed
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: getTotalCount() > 0 ? `${(getCompletedCount() / getTotalCount()) * 100}%` : '0%' }
                ]} 
              />
            </View>
          </View>

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

          {/* Vaccinations List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
              <Text style={styles.loadingText}>Loading vaccinations...</Text>
            </View>
          ) : vaccinations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={60} color={Colors.inactive} />
              <Text style={styles.emptyTitle}>No vaccinations</Text>
              <Text style={styles.emptyText}>
                {selectedTab === 'all'
                  ? 'Add your first vaccination record to get started'
                  : `No ${selectedTab} vaccinations found`}
              </Text>
            </View>
          ) : (
            vaccinations.map((vaccination) => (
              <TouchableOpacity
                key={vaccination._id}
                style={styles.vaccinationCard}
                onPress={() =>
                  router.push({
                    pathname: '/health-analytics/vaccinations/edit/[id]',
                    params: { id: vaccination._id },
                  } as any)
                }
              >
                <View style={styles.vaccinationHeader}>
                  <View style={styles.vaccinationLeft}>
                    <Ionicons name="shield-checkmark" size={24} color={Colors.primary.DEFAULT} />
                    <View style={styles.vaccinationInfo}>
                      <Text style={styles.vaccinationName}>{vaccination.vaccineName}</Text>
                      <Text style={styles.vaccinationDose}>
                        Dose {vaccination.doseNumber} of {vaccination.totalDoses}
                        {vaccination.vaccineType && ` • ${vaccination.vaccineType}`}
                      </Text>
                      <View style={styles.vaccinationMeta}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(vaccination.status) },
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {vaccination.status.charAt(0).toUpperCase() +
                              vaccination.status.slice(1)}
                          </Text>
                        </View>
                        {vaccination.administeredDate && (
                          <Text style={styles.dateText}>
                            {new Date(vaccination.administeredDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(vaccination._id ?? '', vaccination.vaccineName)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {vaccination.notes && (
                  <Text style={styles.vaccinationNotes} numberOfLines={2}>
                    {vaccination.notes}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/health-analytics/vaccinations/add' as any)}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
          <Text style={styles.addButtonText}>Add Vaccination</Text>
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
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.DEFAULT,
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
  vaccinationCard: {
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
  vaccinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vaccinationLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  vaccinationInfo: {
    flex: 1,
  },
  vaccinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  vaccinationDose: {
    fontSize: 14,
    color: Colors.inactive,
    marginBottom: 8,
  },
  vaccinationMeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  dateText: {
    fontSize: 12,
    color: Colors.inactive,
  },
  deleteButton: {
    padding: 8,
  },
  vaccinationNotes: {
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
