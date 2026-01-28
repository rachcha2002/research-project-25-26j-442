import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { useRouter } from 'expo-router';
import { getHealthRecords, HealthRecord } from '@/services/healthAnalyticsService';

type Symptom = 'fever' | 'cold' | 'cough' | 'vomit' | 'diarrhea' | 'pain' | 'fatigue' | 'noAppetite';

export const HealthDetailsScreen: React.FC = () => {
  const router = useRouter();
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>(['fatigue']);
  const [conditions, setConditions] = useState<HealthRecord[]>([]);
  const [loadingConditions, setLoadingConditions] = useState(true);
  
  // TODO: Get this from route params or context
  const babyId = '674525cc0a8a8b29b8a2bf9c';

  // Fetch active conditions
  useEffect(() => {
    const fetchConditions = async () => {
      try {
        setLoadingConditions(true);
        const records = await getHealthRecords(babyId, 'illness');
        setConditions(records);
      } catch (error) {
        console.error('Error fetching conditions:', error);
      } finally {
        setLoadingConditions(false);
      }
    };

    fetchConditions();
  }, []);

  const toggleSymptom = (symptom: Symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
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
              <TouchableOpacity 
                style={styles.conditionCard}
                onPress={() => router.push('/health-analytics/health-details/all-conditions' as any)}
              >
                <View style={styles.conditionIconContainer}>
                  <Ionicons name="medical" size={24} color="#EF4444" />
                </View>
                <View style={styles.conditionContent}>
                  <Text style={styles.conditionName}>{conditions[0].diagnosis || 'Condition'}</Text>
                  <Text style={styles.conditionStatus}>
                    Severity: {conditions[0].severity ? conditions[0].severity.charAt(0).toUpperCase() + conditions[0].severity.slice(1) : 'Unknown'}
                  </Text>
                  <Text style={styles.conditionDate}>
                    Date: {new Date(conditions[0].recordDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.inactive} />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.addConditionButton}
              onPress={() => router.push('/health-analytics/health-details/add-condition' as any)}
            >
              <Text style={styles.addConditionText}>+ Add Condition</Text>
            </TouchableOpacity>
          </View>

          {/* Log Today's Symptoms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Log Today's Symptoms</Text>
            <Text style={styles.sectionSubtitle}>Tap to log quickly</Text>

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
          </View>

          {/* Recent (Last 7 Days) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent (Last 7 Days):</Text>
            
            <View style={styles.recentList}>
              <View style={styles.recentItem}>
                <Text style={styles.recentBullet}>•</Text>
                <View style={styles.recentContent}>
                  <Text style={styles.recentText}>Mild fever 38.2°C</Text>
                  <Text style={styles.recentTime}>3 days ago</Text>
                </View>
              </View>

              <View style={styles.recentItem}>
                <Text style={styles.recentBullet}>•</Text>
                <View style={styles.recentContent}>
                  <Text style={styles.recentText}>Cough</Text>
                  <Text style={styles.recentTime}>5 days ago</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/health-analytics/health-details/symptoms-history' as any)}
              >
                <Text style={styles.viewAllText}>View All History →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Severe Allergies Alert */}
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.alertTitle}>Severe Allergies: 1</Text>
            </View>

            <View style={styles.allergyItem}>
              <Text style={styles.allergyBullet}>•</Text>
              <View style={styles.allergyContent}>
                <Text style={styles.allergyName}>Peanuts (Severe)</Text>
                <Text style={styles.allergyRisk}>Risk: Anaphylaxis</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.emergencyButton}>
              <Text style={styles.emergencyButtonText}>View Emergency Plan →</Text>
            </TouchableOpacity>
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
});
