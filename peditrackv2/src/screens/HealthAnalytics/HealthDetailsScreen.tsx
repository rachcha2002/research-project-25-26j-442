import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';

export const HealthDetailsScreen: React.FC = () => {
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
          <View style={styles.iconCircle}>
            <Ionicons name="medical" size={32} color={Colors.primary.light} />
          </View>
          <Text style={styles.headerTitle}>Health Records</Text>
          <Text style={styles.headerSubtitle}>
            Track your child's health records and medical history
          </Text>
        </View>

        {/* Vaccination Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.primary.light} />
            <Text style={styles.cardTitle}>Vaccinations</Text>
          </View>
          <Text style={styles.cardDescription}>
            Keep track of all vaccination schedules and records
          </Text>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.statusText}>Up to date</Text>
          </View>
        </View>

        {/* Medical History Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color={Colors.primary.light} />
            <Text style={styles.cardTitle}>Medical History</Text>
          </View>
          <Text style={styles.cardDescription}>
            View past diagnoses, treatments, and medical notes
          </Text>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Records</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary.light} />
          </TouchableOpacity>
        </View>

        {/* Appointments Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color={Colors.primary.light} />
            <Text style={styles.cardTitle}>Appointments</Text>
          </View>
          <Text style={styles.cardDescription}>
            Schedule and manage upcoming medical appointments
          </Text>
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentLabel}>Next Appointment:</Text>
            <Text style={styles.appointmentDate}>Dec 15, 2025</Text>
          </View>
        </View>

        {/* Allergies Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.cardTitle}>Allergies</Text>
          </View>
          <Text style={styles.cardDescription}>
            Record and monitor any known allergies
          </Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle" size={20} color={Colors.primary.light} />
            <Text style={styles.addButtonText}>Add Allergy</Text>
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
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: Colors.dark,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: Colors.inactive,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  cardDescription: {
    color: Colors.inactive,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewButtonText: {
    color: Colors.primary.light,
    fontSize: 15,
    fontWeight: '600',
  },
  appointmentInfo: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
  },
  appointmentLabel: {
    color: Colors.inactive,
    fontSize: 13,
    marginBottom: 4,
  },
  appointmentDate: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: Colors.primary.light,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
