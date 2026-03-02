import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { getHealthRecords, HealthRecord, deleteHealthRecord } from '@/services/healthAnalyticsService';
import { useBaby } from '@/contexts/BabyContext';

type ConditionType = 'acute' | 'chronic' | 'resolved';
type Severity = 'mild' | 'moderate' | 'severe';
type Status = 'monitoring' | 'active' | 'resolved' | 'underTreatment';

interface Condition {
  id: string;
  name: string;
  type: ConditionType;
  severity: Severity;
  diagnosisDate: string;
  status: Status;
  symptoms: string[];
  notes: string;
}

export const AllConditionsScreen: React.FC = () => {
  const router = useRouter();
  const { selectedBaby } = useBaby();
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map backend HealthRecord to frontend Condition
  const mapHealthRecordToCondition = (record: HealthRecord): Condition => {
    return {
      id: record._id || '',
      name: record.diagnosis || 'Unnamed Condition',
      type: (record.conditionType as ConditionType) || 'chronic', // Map from actual backend field
      severity: record.severity || 'mild',
      diagnosisDate: new Date(record.recordDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      }),
      status: record.status || 'monitoring', // Use status from backend
      symptoms: record.symptoms || [],
      notes: record.notes || record.doctorNotes || '',
    };
  };

  const fetchConditions = useCallback(async () => {
    if (!selectedBaby) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const records = await getHealthRecords(selectedBaby._id, 'illness');
      const mappedConditions = records.map(mapHealthRecordToCondition);
      setConditions(mappedConditions);
    } catch (err) {
      console.error('Error fetching conditions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conditions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBaby]);

  useFocusEffect(
    useCallback(() => {
      fetchConditions();
    }, [fetchConditions])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConditions();
  };

  const openConditionDetail = (condition: Condition) => {
    setSelectedCondition(condition);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedCondition(null), 300);
  };

  const handleDelete = (condition: Condition) => {
    Alert.alert(
      'Delete Condition',
      `Are you sure you want to delete "${condition.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              closeModal();
              setLoading(true);
              await deleteHealthRecord(condition.id);
              // Refresh the list
              await fetchConditions();
              Alert.alert('Success', 'Condition deleted successfully');
            } catch (error) {
              console.error('Error deleting condition:', error);
              Alert.alert('Error', 'Failed to delete condition. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'mild':
        return { bg: '#D1FAE5', border: '#10B981', text: '#059669' };
      case 'moderate':
        return { bg: '#FED7AA', border: '#F59E0B', text: '#D97706' };
      case 'severe':
        return { bg: '#FEE2E2', border: '#EF4444', text: '#DC2626' };
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'monitoring':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'active':
        return { bg: '#FED7AA', text: '#D97706' };
      case 'resolved':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'underTreatment':
        return { bg: '#E9D5FF', text: '#7C3AED' };
    }
  };

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case 'monitoring':
        return 'Monitoring';
      case 'active':
        return 'Active';
      case 'resolved':
        return 'Resolved';
      case 'underTreatment':
        return 'Under Treatment';
    }
  };

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
            <Text style={styles.pageTitle}>All Conditions</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Loading...' : `${conditions.length} total condition${conditions.length !== 1 ? 's' : ''}`}
            </Text>
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
              <Text style={styles.loadingText}>Loading conditions...</Text>
            </View>
          )}

          {/* Error State */}
          {!loading && error && (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchConditions}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empty State */}
          {!loading && !error && conditions.length === 0 && (
            <View style={styles.centerContainer}>
              <Ionicons name="medical-outline" size={64} color={Colors.inactive} />
              <Text style={styles.emptyTitle}>No Conditions</Text>
              <Text style={styles.emptyText}>
                No health conditions have been added yet. Add your first condition to start tracking!
              </Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/health-analytics/health-details/add-condition' as any)}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={styles.addButtonText}>Add Condition</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Conditions List */}
          {!loading && !error && conditions.length > 0 && (
            <View style={styles.conditionsList}>
              {conditions.map((condition) => {
                const severityColors = getSeverityColor(condition.severity);
                const statusColors = getStatusColor(condition.status);

                return (
                  <TouchableOpacity
                    key={condition.id}
                    style={[
                      styles.conditionCard,
                      { borderLeftColor: severityColors.border, borderLeftWidth: 4 },
                    ]}
                    onPress={() => openConditionDetail(condition)}
                  >
                    <View style={styles.conditionHeader}>
                      <View style={styles.conditionTitleRow}>
                        <Text style={styles.conditionName}>{condition.name}</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.inactive} />
                      </View>
                      <View style={styles.badgesRow}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                          <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {getStatusLabel(condition.status)}
                          </Text>
                        </View>
                        <View style={[styles.severityBadge, { backgroundColor: severityColors.bg }]}>
                          <Text style={[styles.severityText, { color: severityColors.text }]}>
                            {condition.severity.charAt(0).toUpperCase() + condition.severity.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.conditionDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color={Colors.inactive} />
                        <Text style={styles.detailText}>{condition.diagnosisDate}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="medical-outline" size={16} color={Colors.inactive} />
                        <Text style={styles.detailText}>
                          {condition.symptoms.length} symptom{condition.symptoms.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Condition Detail Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedCondition && (
                <>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedCondition.name}</Text>
                    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                      <Ionicons name="close" size={28} color={Colors.dark} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Status and Severity */}
                    <View style={styles.modalBadges}>
                      <View
                        style={[
                          styles.modalBadge,
                          { backgroundColor: getStatusColor(selectedCondition.status).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalBadgeText,
                            { color: getStatusColor(selectedCondition.status).text },
                          ]}
                        >
                          {getStatusLabel(selectedCondition.status)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.modalBadge,
                          { backgroundColor: getSeverityColor(selectedCondition.severity).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalBadgeText,
                            { color: getSeverityColor(selectedCondition.severity).text },
                          ]}
                        >
                          {selectedCondition.severity.charAt(0).toUpperCase() +
                            selectedCondition.severity.slice(1)} Severity
                        </Text>
                      </View>
                    </View>

                    {/* Details Section */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Details</Text>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalLabel}>Type:</Text>
                        <Text style={styles.modalValue}>
                          {selectedCondition.type.charAt(0).toUpperCase() +
                            selectedCondition.type.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalLabel}>Diagnosed:</Text>
                        <Text style={styles.modalValue}>{selectedCondition.diagnosisDate}</Text>
                      </View>
                    </View>

                    {/* Symptoms Section */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Symptoms</Text>
                      <View style={styles.symptomsList}>
                        {selectedCondition.symptoms.map((symptom, index) => (
                          <View key={index} style={styles.symptomItem}>
                            <View style={styles.symptomBullet} />
                            <Text style={styles.symptomText}>{symptom}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Notes Section */}
                    {selectedCondition.notes && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Notes</Text>
                        <Text style={styles.notesText}>{selectedCondition.notes}</Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => {
                          closeModal();
                          router.push(`/health-analytics/health-details/add-condition?recordId=${selectedCondition.id}` as any);
                        }}
                      >
                        <Ionicons name="create-outline" size={20} color={Colors.primary.DEFAULT} />
                        <Text style={styles.editButtonText}>Edit Condition</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDelete(selectedCondition)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
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
  conditionsList: {
    gap: 12,
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  conditionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conditionHeader: {
    marginBottom: 12,
  },
  conditionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark,
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  conditionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.inactive,
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
  modalBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  modalBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  modalBadgeText: {
    fontSize: 14,
    fontWeight: '600',
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
    gap: 8,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  symptomBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary.DEFAULT,
    marginTop: 7,
  },
  symptomText: {
    fontSize: 15,
    color: Colors.dark,
    flex: 1,
  },
  notesText: {
    fontSize: 15,
    color: Colors.dark,
    lineHeight: 22,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.DEFAULT,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
});
