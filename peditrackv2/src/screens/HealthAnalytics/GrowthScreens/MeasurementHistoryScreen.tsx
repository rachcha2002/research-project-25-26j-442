import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';

export const MeasurementHistoryScreen: React.FC = () => {
  const router = useRouter();

  const allMeasurements = [
    { date: 'Nov 10, 2024', height: '95.5 cm', weight: '14.2 kg', head: '48.0 cm', location: 'Home' },
    { date: 'Oct 10, 2024', height: '94.5 cm', weight: '14.0 kg', head: '47.8 cm', location: 'Home' },
    { date: 'Sep 10, 2024', height: '93.0 cm', weight: '13.8 kg', head: '47.5 cm', location: 'Clinic' },
    { date: 'Aug 10, 2024', height: '91.0 cm', weight: '13.5 kg', head: '47.2 cm', location: 'Home' },
    { date: 'Jul 10, 2024', height: '89.5 cm', weight: '13.2 kg', head: '47.0 cm', location: 'Clinic' },
    { date: 'Jun 10, 2024', height: '88.0 cm', weight: '13.0 kg', head: '46.8 cm', location: 'Home' },
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
        {allMeasurements.map((measurement, index) => (
          <View key={index} style={styles.measurementCard}>
            <View style={styles.dateHeader}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar" size={16} color={Colors.primary.DEFAULT} />
                <Text style={styles.dateText}>{measurement.date}</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={20} color={Colors.inactive} />
              </TouchableOpacity>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Height</Text>
                <Text style={styles.metricValue}>{measurement.height}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Weight</Text>
                <Text style={styles.metricValue}>{measurement.weight}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Head</Text>
                <Text style={styles.metricValue}>{measurement.head}</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.inactive} />
              <Text style={styles.locationText}>{measurement.location}</Text>
            </View>
          </View>
        ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  measurementCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.inactive,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.inactive,
  },
});
