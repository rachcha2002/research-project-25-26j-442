import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

export const MedsScreen: React.FC = () => {
  const router = useRouter();
  const [showMenu1, setShowMenu1] = useState(false);
  const [showMenu2, setShowMenu2] = useState(false);

  // Circular progress component
  const CircularProgress = ({ percentage, size = 80 }: { percentage: number; size?: number }) => {
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10B981"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressPercentage}>{percentage}%</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <SecondaryTopBar />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Medications & Vaccines</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/health-analytics/meds/add-medication' as any)}
            >
              <Ionicons name="add" size={24} color={Colors.primary.light} />
            </TouchableOpacity>
          </View>

          {/* Active Medications */}
          <Text style={styles.sectionTitle}>Active Medications (2)</Text>

          {/* Medication Card 1 - Vitamin D3 */}
          <View style={styles.medCard}>
            <View style={styles.medCardHeader}>
              <View style={[styles.pillIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="medical" size={20} color="#3B82F6" />
              </View>
              <View style={styles.medCardTitleContainer}>
                <Text style={styles.medCardTitle}>Vitamin D3 - 1000 IU</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMenu1(!showMenu1)}>
                <Ionicons name="ellipsis-vertical" size={20} color={Colors.inactive} />
              </TouchableOpacity>
            </View>

            <Text style={styles.scheduleText}>Daily at 8:00 PM</Text>

            <View style={styles.nextDoseContainer}>
              <Ionicons name="time-outline" size={16} color="#F59E0B" />
              <Text style={styles.nextDoseText}>Next: Tonight 8:00 PM</Text>
            </View>

            {/* Adherence Progress Bar */}
            <View style={styles.adherenceContainer}>
              <View style={styles.adherenceBar}>
                <View style={[styles.adherenceProgress, { width: '95%' }]} />
              </View>
              <View style={styles.adherenceInfo}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.adherenceText}>Adherence: 95%</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.medCardActions}>
              <TouchableOpacity style={styles.markTakenButton}>
                <Text style={styles.markTakenText}>Mark Taken</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Medication Card 2 - Allergy Medication */}
          <View style={styles.medCard}>
            <View style={styles.medCardHeader}>
              <View style={[styles.pillIcon, { backgroundColor: '#FED7AA' }]}>
                <Ionicons name="medical" size={20} color="#F97316" />
              </View>
              <View style={styles.medCardTitleContainer}>
                <Text style={styles.medCardTitle}>Allergy Medication</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMenu2(!showMenu2)}>
                <Ionicons name="ellipsis-vertical" size={20} color={Colors.inactive} />
              </TouchableOpacity>
            </View>

            <Text style={styles.scheduleText}>As needed</Text>
            <Text style={styles.lastTakenText}>Last taken: 2 days ago</Text>

            {/* Action Buttons */}
            <View style={styles.medCardActions}>
              <TouchableOpacity style={styles.markTakenButton}>
                <Text style={styles.markTakenText}>Log Dose</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add Medication Button */}
          <TouchableOpacity 
            style={styles.addMedicationButton}
            onPress={() => router.push('/health-analytics/meds/add-medication' as any)}
          >
            <Text style={styles.addMedicationText}>+ Add Medication</Text>
          </TouchableOpacity>

          {/* Immunization Status */}
          <Text style={styles.sectionTitle}>Immunization Status</Text>

          <View style={styles.immunizationCard}>
            <View style={styles.immunizationContent}>
              {/* Circular Progress */}
              <View style={styles.circularProgressContainer}>
                <CircularProgress percentage={80} size={80} />
                <Text style={styles.immunizationFraction}>12/15</Text>
              </View>

              {/* Next Due Info */}
              <View style={styles.nextDueContainer}>
                <Text style={styles.nextDueLabel}>Next Due:</Text>
                <View style={styles.vaccineNameRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.vaccineName}>MMR Booster</Text>
                </View>
                <Text style={styles.vaccineDueDate}>Dec 15 (14 days)</Text>
                <View style={styles.dueSoonBadge}>
                  <Text style={styles.dueSoonText}>Due Soon</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recent Vaccines */}
          <Text style={styles.sectionTitle}>Recent Vaccines:</Text>

          <View style={styles.vaccinesCard}>
            {/* Vaccine Item 1 */}
            <View style={styles.vaccineItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.vaccineItemName}>DTaP</Text>
              <Text style={styles.vaccineItemDate}>Oct 10, 2024</Text>
            </View>

            {/* Vaccine Item 2 */}
            <View style={styles.vaccineItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.vaccineItemName}>Polio</Text>
              <Text style={styles.vaccineItemDate}>Sep 15, 2024</Text>
            </View>

            {/* Vaccine Item 3 */}
            <View style={styles.vaccineItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.vaccineItemName}>Hepatitis</Text>
              <Text style={styles.vaccineItemDate}>Aug 20, 2024</Text>
            </View>

            {/* View Full Schedule Button */}
            <TouchableOpacity style={styles.viewScheduleButton}>
              <Text style={styles.viewScheduleText}>View Full Schedule →</Text>
            </TouchableOpacity>

            {/* Add Vaccine Record Button */}
            <TouchableOpacity style={styles.addVaccineButton}>
              <Text style={styles.addVaccineText}>Add Vaccine Record</Text>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
  },
  addButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
    marginTop: 8,
  },
  medCard: {
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
  medCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pillIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medCardTitleContainer: {
    flex: 1,
  },
  medCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  scheduleText: {
    fontSize: 14,
    color: Colors.inactive,
    marginBottom: 8,
  },
  nextDoseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  nextDoseText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  lastTakenText: {
    fontSize: 13,
    color: Colors.inactive,
    marginBottom: 12,
  },
  adherenceContainer: {
    marginBottom: 12,
  },
  adherenceBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 6,
  },
  adherenceProgress: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  adherenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adherenceText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  medCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  markTakenButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  markTakenText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
  },
  addMedicationButton: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  addMedicationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  immunizationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  immunizationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  circularProgressContainer: {
    alignItems: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  immunizationFraction: {
    fontSize: 13,
    color: Colors.inactive,
    marginTop: 4,
  },
  nextDueContainer: {
    flex: 1,
  },
  nextDueLabel: {
    fontSize: 13,
    color: Colors.inactive,
    marginBottom: 4,
  },
  vaccineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  vaccineDueDate: {
    fontSize: 14,
    color: '#F97316',
    marginBottom: 8,
  },
  dueSoonBadge: {
    backgroundColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dueSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C2410C',
  },
  vaccinesCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vaccineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  vaccineItemName: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark,
  },
  vaccineItemDate: {
    fontSize: 13,
    color: Colors.inactive,
  },
  viewScheduleButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  viewScheduleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  addVaccineButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addVaccineText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
  },
});
