import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { useRouter } from 'expo-router';
import { 
  getHealthRecords, 
  HealthRecord, 
  getActiveMedications, 
  Medication,
  getRecentSymptoms,
  logSymptoms,
  DailySymptom,
  SymptomEntry
} from '@/services/healthAnalyticsService';
import { useBaby } from '@/contexts/BabyContext';
import { useFocusEffect } from 'expo-router';

type Symptom = 'fever' | 'cold' | 'cough' | 'vomit' | 'diarrhea' | 'pain' | 'fatigue' | 'noAppetite';

export const HealthDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { selectedBaby } = useBaby();
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]); // Default empty
  
  const [conditions, setConditions] = useState<HealthRecord[]>([]);
  const [loadingConditions, setLoadingConditions] = useState(true);
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loadingMedications, setLoadingMedications] = useState(true);

  const [recentSymptoms, setRecentSymptoms] = useState<DailySymptom[]>([]);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [loggingSymptom, setLoggingSymptom] = useState(false);

  // Fetch active conditions and medications
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        if (!selectedBaby) return;
        
        try {
          setLoadingConditions(true);
          setLoadingMedications(true);
          setLoadingSymptoms(true);

          const [conditionsData, medsData, symptomsData] = await Promise.all([
            getHealthRecords(selectedBaby._id!, 'illness'),
            getActiveMedications(selectedBaby._id!),
            getRecentSymptoms(selectedBaby._id!)
          ]);

          // Filter active conditions
          const activeConditions = conditionsData.filter(
            record => record.status && ['active', 'monitoring', 'underTreatment'].includes(record.status)
          );
          setConditions(activeConditions);
          setMedications(medsData);
          setRecentSymptoms(symptomsData);

        } catch (error) {
          console.error('Error fetching health data:', error);
        } finally {
          setLoadingConditions(false);
          setLoadingMedications(false);
          setLoadingSymptoms(false);
        }
      };

      fetchData();
    }, [selectedBaby])
  );

  const toggleSymptom = (symptom: Symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleQuickLog = async () => {
    if (!selectedBaby) return;
    if (selectedSymptoms.length === 0) return;

    try {
      setLoggingSymptom(true);
      
      const symptomEntries: SymptomEntry[] = selectedSymptoms.map(s => {
        // Find label
        const symptomObj = symptoms.find(sy => sy.id === s);
        return {
          name: symptomObj?.label || s,
          severity: 'mild', // Default to mild for quick log
          isCustom: false
        };
      });

      await logSymptoms({
        babyId: selectedBaby._id,
        symptoms: symptomEntries,
        recordedAt: new Date().toISOString(),
      });

      // Refresh recent symptoms
      const newRecent = await getRecentSymptoms(selectedBaby._id);
      setRecentSymptoms(newRecent);
      
      // Clear selection
      setSelectedSymptoms([]);
      
    } catch (error) {
      console.error('Error logging symptoms:', error);
    } finally {
      setLoggingSymptom(false);
    }
  };

  const symptoms = [
    { id: 'fever' as Symptom, emoji: '🤒', label: 'Fever' },
    { id: 'cold' as Symptom, emoji: '🤧', label: 'Cold' },
    { id: 'cough' as Symptom, emoji: '😷', label: 'Cough' },
    { id: 'vomit' as Symptom, emoji: '🤢', label: 'Vomit' },
    { id: 'diarrhea' as Symptom, emoji: '💩', label: 'Diarrhea' },
    { id: 'pain' as Symptom, emoji: '😫', label: 'Pain' },
    { id: 'fatigue' as Symptom, emoji: '🥱', label: 'Fatigue' },
    { id: 'noAppetite' as Symptom, emoji: '🍽️', label: 'No Appetite' },
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
          <Text style={styles.pageTitle}>Health Records</Text>

          {/* Active Conditions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Active Conditions ({loadingConditions ? '...' : conditions.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/health-analytics/health-details/all-conditions' as any)}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>
            
            {loadingConditions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
                <Text style={styles.loadingText}>Loading conditions...</Text>
              </View>
            ) : conditions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="medical-outline" size={40} color={Colors.inactive} />
                <Text style={styles.emptyText}>No active conditions</Text>
              </View>
            ) : (
              <>
                {conditions.slice(0, 3).map((condition, index) => (
                  <TouchableOpacity 
                    key={condition._id || index}
                    style={[styles.conditionCard, index > 0 && { marginTop: 12 }]}
                    onPress={() => router.push('/health-analytics/health-details/all-conditions' as any)}
                  >
                    <View style={styles.conditionIconContainer}>
                      <Ionicons name="medical" size={24} color="#EF4444" />
                    </View>
                    <View style={styles.conditionContent}>
                      <Text style={styles.conditionName}>{condition.diagnosis || 'Condition'}</Text>
                      <Text style={styles.conditionStatus}>
                        Severity: {condition.severity ? condition.severity.charAt(0).toUpperCase() + condition.severity.slice(1) : 'Unknown'}
                      </Text>
                      <Text style={styles.conditionDate}>
                        Date: {new Date(condition.recordDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.inactive} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            <TouchableOpacity 
              style={styles.addConditionButton}
              onPress={() => router.push('/health-analytics/health-details/add-condition' as any)}
            >
              <Text style={styles.addConditionText}>+ Add Condition</Text>
            </TouchableOpacity>
          </View>

          {/* Active Medications */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Active Medications ({loadingMedications ? '...' : medications.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/health-analytics/medications' as any)}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>
            
            {loadingMedications ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
                <Text style={styles.loadingText}>Loading medications...</Text>
              </View>
            ) : medications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="medical-outline" size={40} color={Colors.inactive} />
                <Text style={styles.emptyText}>No active medications</Text>
              </View>
            ) : (
              <>
                {medications.slice(0, 2).map((medication, index) => (
                  <TouchableOpacity 
                    key={medication._id || index}
                    style={[styles.medicationCard, index > 0 && { marginTop: 12 }]}
                    onPress={() => router.push('/health-analytics/medications' as any)}
                  >
                    <View style={styles.medIconContainer}>
                      <Ionicons name="medical" size={24} color={Colors.primary.DEFAULT} />
                    </View>
                    <View style={styles.medContent}>
                      <Text style={styles.medName}>{medication.name}</Text>
                      <Text style={styles.medDosage}>
                        {medication.dosage.amount}{medication.dosage.unit} - {medication.frequency}
                      </Text>
                      {medication.reminderEnabled && (
                        <View style={styles.reminderBadge}>
                          <Ionicons name="notifications" size={12} color={Colors.primary.DEFAULT} />
                          <Text style={styles.reminderText}>Reminders On</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.inactive} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            <TouchableOpacity 
              style={styles.addConditionButton}
              onPress={() => router.push('/health-analytics/medications/add' as any)}
            >
              <Text style={styles.addConditionText}>+ Add Medication</Text>
            </TouchableOpacity>
          </View>


          {/* Log Today's Symptoms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Log Today's Symptoms</Text>
            <Text style={styles.sectionSubtitle}>Tap to select, then log</Text>

            <View style={styles.symptomsGrid}>
              {symptoms.map((symptom) => (
                <TouchableOpacity
                  key={symptom.id}
                  style={[
                    styles.symptomButton,
                    selectedSymptoms.includes(symptom.id) && styles.symptomButtonSelected,
                  ]}
                  onPress={() => toggleSymptom(symptom.id)}
                >
                  <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
                  <Text style={styles.symptomLabel}>{symptom.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedSymptoms.length > 0 && (
              <TouchableOpacity 
                style={[styles.quickLogButton, loggingSymptom && styles.quickLogButtonDisabled]}
                onPress={handleQuickLog}
                disabled={loggingSymptom}
              >
                {loggingSymptom ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.quickLogButtonText}>Log Selected Symptoms ({selectedSymptoms.length})</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.addConditionButton, { marginTop: 16 }]}
              onPress={() => router.push('/health-analytics/symptoms/log' as any)}
            >
              <Text style={styles.addConditionText}>+ Add Custom / Details</Text>
            </TouchableOpacity>
          </View>

          {/* Recent (Last 7 Days) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent (Last 7 Days)</Text>
              <TouchableOpacity onPress={() => router.push('/health-analytics/health-details/symptoms-history' as any)}>
                <Text style={styles.viewAllText}>View All History →</Text>
              </TouchableOpacity>
            </View>
            
            {loadingSymptoms ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
                <Text style={styles.loadingText}>Loading recent symptoms...</Text>
              </View>
            ) : recentSymptoms.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recent symptoms recorded</Text>
              </View>
            ) : (
              <View style={styles.recentList}>
                {recentSymptoms.slice(0, 3).map((daily, idx) => (
                  <View key={idx}>
                    {daily.symptoms.map((sym, i) => (
                      <View key={`${idx}-${i}`} style={styles.recentItem}>
                        <Text style={styles.recentBullet}>•</Text>
                        <View style={styles.recentContent}>
                          <Text style={styles.recentText}>
                            {sym.name} {sym.severity ? `(${sym.severity})` : ''}
                          </Text>
                          <Text style={styles.recentTime}>
                             {new Date(daily.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}

              </View>
            )}
          </View>
        </ScrollView>
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary.light,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.inactive,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conditionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  conditionContent: {
    flex: 1,
  },
  conditionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  conditionStatus: {
    fontSize: 13,
    color: Colors.inactive,
    marginBottom: 2,
  },
  conditionDate: {
    fontSize: 13,
    color: Colors.inactive,
  },
  addConditionButton: {
    borderWidth: 1,
    borderColor: Colors.primary.light,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  addConditionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary.light,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  symptomButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  symptomEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  symptomLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.dark,
    textAlign: 'center',
  },
  recentList: {
    marginTop: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recentBullet: {
    fontSize: 16,
    color: Colors.dark,
    marginRight: 8,
    marginTop: 2,
  },
  recentContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentText: {
    fontSize: 15,
    color: Colors.dark,
  },
  recentTime: {
    fontSize: 13,
    color: Colors.inactive,
  },
  viewAllButton: {
    marginTop: 8,
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 8,
  },
  allergyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  allergyBullet: {
    fontSize: 16,
    color: Colors.dark,
    marginRight: 8,
    marginTop: 2,
  },
  allergyContent: {
    flex: 1,
  },
  allergyName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 2,
  },
  allergyRisk: {
    fontSize: 13,
    color: '#DC2626',
  },
  emergencyButton: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.inactive,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.inactive,
  },
  // Medication styles
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  medIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medContent: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  medDosage: {
    fontSize: 13,
    color: Colors.inactive,
    marginBottom: 4,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.primary.light + '15',
    alignSelf: 'flex-start',
  },
  reminderText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.primary.DEFAULT,
  },
  quickLogButton: {
    marginTop: 16,
    backgroundColor: Colors.primary.DEFAULT,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickLogButtonDisabled: {
    opacity: 0.7,
  },
  quickLogButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  sleepCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sleepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sleepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sleepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sleepInfo: {
    flex: 1,
  },
  sleepLabel: {
    fontSize: 14,
    color: Colors.inactive,
    marginBottom: 4,
  },
  sleepValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  sleepActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sleepActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
