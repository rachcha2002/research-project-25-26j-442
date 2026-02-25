import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { getSymptoms, DailySymptom, deleteSymptomRecord } from '@/services/healthAnalyticsService';
import { useBaby } from '@/contexts/BabyContext';

type DateRange = 'month' | '3months' | '6months' | 'custom';

  interface SymptomRecord {
    id: string;
    date: string;
    severity?: 'mild' | 'moderate' | 'severe';
    symptoms: string[];
    temperature?: { value: number; unit: string };
    condition?: string;
    notes?: string;
  }

  export const SymptomsHistoryScreen: React.FC = () => {
  const router = useRouter();
  const { selectedBaby } = useBaby();
  const [selectedRange, setSelectedRange] = useState<DateRange>('month');
  const [symptomRecords, setSymptomRecords] = useState<SymptomRecord[]>([]); // Updated type
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SymptomRecord | null>(null); // Updated type
  const [modalVisible, setModalVisible] = useState(false);

  // Calculate date range based on selection
  const getDateRange = (range: DateRange): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    return { startDate, endDate };
  };

  // Helper to determine overall severity from a list of symptoms
  const getOverallSeverity = (symptoms: { severity: 'mild' | 'moderate' | 'severe' }[]): 'mild' | 'moderate' | 'severe' | undefined => {
    if (!symptoms || symptoms.length === 0) return undefined;
    if (symptoms.some(s => s.severity === 'severe')) return 'severe';
    if (symptoms.some(s => s.severity === 'moderate')) return 'moderate';
    return 'mild';
  };

  // Fetch symptoms data
  const fetchSymptoms = async () => {
    if (!selectedBaby) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { startDate, endDate } = getDateRange(selectedRange);
      
      const records = await getSymptoms(
        selectedBaby._id,
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      // Map API data to UI model
      const mappedRecords: SymptomRecord[] = records.map(record => {
        const date = new Date(record.recordedAt);
        return {
          id: record._id || Math.random().toString(),
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          severity: getOverallSeverity(record.symptoms),
          symptoms: record.symptoms.map(s => s.name),
          temperature: record.temperature ? { value: record.temperature, unit: 'C' } : undefined, // Assuming Celsius from API
          condition: undefined, // API doesn't seem to link condition directly yet, or it's not in DailySymptom
          notes: record.notes,
        };
      });

      setSymptomRecords(mappedRecords);
    } catch (err) {
      console.error('Error fetching symptoms:', err);
      setError(err instanceof Error ? err.message : 'Failed to load symptoms');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSymptoms();
  }, [selectedRange, selectedBaby]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSymptoms();
  };

  const openRecordDetail = (record: SymptomRecord) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedRecord(null), 300);
  };

  const handleDelete = () => {
    if (!selectedRecord) return;

    Alert.alert(
      'Delete Symptom Record',
      'Are you sure you want to delete this record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteSymptomRecord(selectedRecord.id);
              closeModal();
              fetchSymptoms();
              Alert.alert('Success', 'Record deleted successfully');
            } catch (error) {
              console.error('Error deleting symptom:', error);
              Alert.alert('Error', 'Failed to delete record');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (!selectedRecord) return;
    const recordId = selectedRecord.id;
    closeModal();
    router.push(`/health-analytics/symptoms/edit/${recordId}`);
  };

  const getSeverityColor = (severity?: 'mild' | 'moderate' | 'severe') => {
    switch (severity) {
      case 'mild':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'moderate':
        return { bg: '#FED7AA', text: '#D97706' };
      case 'severe':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#E5E7EB', text: '#6B7280' };
    }
  };

  const getSymptomIcon = (symptom: string) => {
    const lowerSymptom = symptom.toLowerCase();
    if (lowerSymptom.includes('fever')) return '🤒';
    if (lowerSymptom.includes('cold')) return '🤧';
    if (lowerSymptom.includes('cough')) return '😷';
    if (lowerSymptom.includes('vomit')) return '🤢';
    if (lowerSymptom.includes('diarrhea')) return '💩';
    if (lowerSymptom.includes('pain')) return '😫';
    if (lowerSymptom.includes('fatigue')) return '🥱';
    if (lowerSymptom.includes('appetite')) return '🍽️';
    return '💊';
  };

  const dateRanges = [
    { id: 'month' as DateRange, label: 'This Month' },
    { id: '3months' as DateRange, label: 'Last 3 Months' },
    { id: '6months' as DateRange, label: 'Last 6 Months' },
  ];

  return (
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Symptoms History</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Loading...' : `${symptomRecords.length} symptom record${symptomRecords.length !== 1 ? 's' : ''}`}
            </Text>
          </View>

          {/* Date Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.filterButtons}>
              {dateRanges.map((range) => (
                <TouchableOpacity
                  key={range.id}
                  style={[
                    styles.filterButton,
                    selectedRange === range.id && styles.filterButtonSelected,
                  ]}
                  onPress={() => setSelectedRange(range.id)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedRange === range.id && styles.filterButtonTextSelected,
                    ]}
                  >
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
              <Text style={styles.loadingText}>Loading symptoms...</Text>
            </View>
          )}

          {/* Error State */}
          {!loading && error && (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchSymptoms}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empty State */}
          {!loading && !error && symptomRecords.length === 0 && (
            <View style={styles.centerContainer}>
              <Ionicons name="thermometer-outline" size={64} color={Colors.inactive} />
              <Text style={styles.emptyTitle}>No Symptoms Found</Text>
              <Text style={styles.emptyText}>
                No symptom records found for the selected date range. Try selecting a different range or add new symptoms.
              </Text>
            </View>
          )}

          {/* Symptoms List */}
          {!loading && !error && symptomRecords.length > 0 && (
            <View style={styles.recordsList}>
              {symptomRecords.map((record) => {
                const severityColors = getSeverityColor(record.severity);

                return (
                  <TouchableOpacity
                    key={record.id}
                    style={styles.recordCard}
                    onPress={() => openRecordDetail(record)}
                  >
                    <View style={styles.recordHeader}>
                      <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={16} color={Colors.primary.DEFAULT} />
                        <Text style={styles.dateText}>{record.date}</Text>
                      </View>
                      {record.severity && (
                        <View style={[styles.severityBadge, { backgroundColor: severityColors.bg }]}>
                          <Text style={[styles.severityText, { color: severityColors.text }]}>
                            {record.severity.charAt(0).toUpperCase() + record.severity.slice(1)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.symptomsContainer}>
                      {record.symptoms.slice(0, 3).map((symptom, index) => (
                        <View key={index} style={styles.symptomChip}>
                          <Text style={styles.symptomEmoji}>{getSymptomIcon(symptom)}</Text>
                          <Text style={styles.symptomText}>{symptom}</Text>
                        </View>
                      ))}
                      {record.symptoms.length > 3 && (
                        <View style={styles.moreChip}>
                          <Text style={styles.moreText}>+{record.symptoms.length - 3} more</Text>
                        </View>
                      )}
                    </View>

                    {record.temperature && (
                      <View style={styles.temperatureRow}>
                        <Ionicons name="thermometer" size={16} color="#EF4444" />
                        <Text style={styles.temperatureText}>
                          {record.temperature.value}°{record.temperature.unit}
                        </Text>
                      </View>
                    )}

                    {record.condition && (
                      <View style={styles.conditionRow}>
                        <Ionicons name="medical" size={14} color={Colors.inactive} />
                        <Text style={styles.conditionText}>{record.condition}</Text>
                      </View>
                    )}

                    <View style={styles.viewDetailsRow}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.primary.DEFAULT} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* FAB for Adding Symptoms */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/health-analytics/symptoms/log')}
        >
          <Ionicons name="add" size={32} color={Colors.white} />
        </TouchableOpacity>

        {/* Detail Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedRecord && (
                <>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Symptom Details</Text>
                    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                      <Ionicons name="close" size={28} color={Colors.dark} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Date and Severity */}
                    <View style={styles.modalSection}>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalLabel}>Date:</Text>
                        <Text style={styles.modalValue}>{selectedRecord.date}</Text>
                      </View>
                      {selectedRecord.severity && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalLabel}>Severity:</Text>
                          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selectedRecord.severity).bg }]}>
                            <Text style={[styles.severityText, { color: getSeverityColor(selectedRecord.severity).text }]}>
                              {selectedRecord.severity.charAt(0).toUpperCase() + selectedRecord.severity.slice(1)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Symptoms */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Symptoms</Text>
                      <View style={styles.symptomsList}>
                        {selectedRecord.symptoms.map((symptom, index) => (
                          <View key={index} style={styles.symptomItem}>
                            <Text style={styles.symptomEmoji}>{getSymptomIcon(symptom)}</Text>
                            <Text style={styles.symptomItemText}>{symptom}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Temperature */}
                    {selectedRecord.temperature && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Temperature</Text>
                        <View style={styles.temperatureCard}>
                          <Ionicons name="thermometer" size={24} color="#EF4444" />
                          <Text style={styles.temperatureValue}>
                            {selectedRecord.temperature.value}°{selectedRecord.temperature.unit}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Associated Condition */}
                    {selectedRecord.condition && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Associated Condition</Text>
                        <View style={styles.conditionCard}>
                          <Ionicons name="medical" size={20} color={Colors.primary.DEFAULT} />
                          <Text style={styles.conditionName}>{selectedRecord.condition}</Text>
                        </View>
                      </View>
                    )}

                    {/* Notes */}
                    {selectedRecord.notes && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Notes</Text>
                        <Text style={styles.notesText}>{selectedRecord.notes}</Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                      <Ionicons name="create-outline" size={20} color={Colors.white} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
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
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary.light,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.inactive,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  filterButtonSelected: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
  },
  filterButtonTextSelected: {
    color: Colors.white,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.inactive,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.inactive,
    textAlign: 'center',
    lineHeight: 22,
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderRadius: 16,
  },
  symptomEmoji: {
    fontSize: 16,
  },
  symptomText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.dark,
  },
  moreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.inactive,
  },
  temperatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  temperatureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 13,
    color: Colors.inactive,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark,
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalLabel: {
    fontSize: 15,
    color: Colors.inactive,
  },
  modalValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark,
  },
  symptomsList: {
    gap: 12,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  symptomItemText: {
    fontSize: 15,
    color: Colors.dark,
    flex: 1,
  },
  temperatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  temperatureValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
  },
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  conditionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  notesText: {
    fontSize: 15,
    color: Colors.dark,
    lineHeight: 22,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary.DEFAULT,
    paddingVertical: 14,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
