import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';

export const MedsScreen: React.FC = () => {
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
            <Ionicons name="medkit" size={32} color={Colors.primary.light} />
          </View>
          <Text style={styles.headerTitle}>Medications</Text>
          <Text style={styles.headerSubtitle}>
            Manage and track your child's medication schedule
          </Text>
        </View>

        {/* Active Medications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Medications</Text>
          <TouchableOpacity>
            <Ionicons name="add-circle" size={24} color={Colors.primary.light} />
          </TouchableOpacity>
        </View>

        <View style={styles.medCard}>
          <View style={styles.medHeader}>
            <View style={styles.medIconContainer}>
              <Ionicons name="medical" size={24} color={Colors.primary.light} />
            </View>
            <View style={styles.medInfo}>
              <Text style={styles.medName}>Vitamin D Drops</Text>
              <Text style={styles.medDosage}>2 drops daily</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          </View>
          
          <View style={styles.medDetails}>
            <View style={styles.medDetailRow}>
              <Ionicons name="time-outline" size={16} color={Colors.inactive} />
              <Text style={styles.medDetailText}>Next dose: 9:00 AM</Text>
            </View>
            <View style={styles.medDetailRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.inactive} />
              <Text style={styles.medDetailText}>Started: Nov 1, 2025</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.markTakenButton}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={styles.markTakenText}>Mark as Taken</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.medCard}>
          <View style={styles.medHeader}>
            <View style={styles.medIconContainer}>
              <Ionicons name="medical" size={24} color={Colors.primary.light} />
            </View>
            <View style={styles.medInfo}>
              <Text style={styles.medName}>Paracetamol Syrup</Text>
              <Text style={styles.medDosage}>5ml every 6 hours</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          </View>
          
          <View style={styles.medDetails}>
            <View style={styles.medDetailRow}>
              <Ionicons name="time-outline" size={16} color={Colors.inactive} />
              <Text style={styles.medDetailText}>Next dose: 2:00 PM</Text>
            </View>
            <View style={styles.medDetailRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.inactive} />
              <Text style={styles.medDetailText}>Started: Nov 20, 2025</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.markTakenButton}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={styles.markTakenText}>Mark as Taken</Text>
          </TouchableOpacity>
        </View>

        {/* Medication History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent History</Text>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Ionicons name="checkmark" size={16} color="#10B981" />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyMedName}>Vitamin D Drops</Text>
              <Text style={styles.historyTime}>Today, 9:00 AM</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>

          <View style={styles.historyDivider} />

          <View style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Ionicons name="checkmark" size={16} color="#10B981" />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyMedName}>Paracetamol Syrup</Text>
              <Text style={styles.historyTime}>Today, 8:00 AM</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>

          <View style={styles.historyDivider} />

          <View style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Ionicons name="checkmark" size={16} color="#10B981" />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyMedName}>Vitamin D Drops</Text>
              <Text style={styles.historyTime}>Yesterday, 9:00 AM</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>
        </View>

        {/* Reminders Card */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderHeader}>
            <Ionicons name="notifications" size={24} color={Colors.primary.light} />
            <Text style={styles.reminderTitle}>Medication Reminders</Text>
          </View>
          <Text style={styles.reminderDescription}>
            Get notified when it's time to give medication
          </Text>
          <TouchableOpacity style={styles.reminderButton}>
            <Text style={styles.reminderButtonText}>Manage Reminders</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary.light} />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '600',
  },
  medCard: {
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
  medHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  medIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  medDosage: {
    color: Colors.inactive,
    fontSize: 14,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  medDetails: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  medDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  medDetailText: {
    color: Colors.inactive,
    fontSize: 14,
    marginLeft: 8,
  },
  markTakenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.light,
    paddingVertical: 12,
    borderRadius: 12,
  },
  markTakenText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  historyCard: {
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
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyMedName: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyTime: {
    color: Colors.inactive,
    fontSize: 13,
  },
  historyDivider: {
    height: 1,
    backgroundColor: Colors.background,
  },
  reminderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderTitle: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  reminderDescription: {
    color: Colors.inactive,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reminderButtonText: {
    color: Colors.primary.light,
    fontSize: 15,
    fontWeight: '600',
  },
});
