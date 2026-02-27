import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { getMeasurements, Measurement } from '@/services/healthAnalyticsService';
import { useBaby } from '@/contexts/BabyContext';

export const MeasurementHistoryScreen: React.FC = () => {
  const router = useRouter();
  const { selectedBaby } = useBaby();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBaby) {
      loadMeasurements();
    } else {
      setLoading(false);
    }
  }, [selectedBaby]);

  const loadMeasurements = async () => {
    if (!selectedBaby) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getMeasurements(selectedBaby._id);
      setMeasurements(data);
    } catch (err) {
      console.error('Error loading measurements:', err);
      setError('Failed to load measurements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Loading measurements...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle" size={48} color={Colors.inactive} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadMeasurements}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : measurements.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="analytics-outline" size={48} color={Colors.inactive} />
            <Text style={styles.emptyText}>No measurements yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your baby's growth by adding measurements</Text>
          </View>
        ) : (
          measurements.map((measurement) => (
            <View key={measurement._id} style={styles.measurementCard}>
              <View style={styles.dateHeader}>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar" size={16} color={Colors.primary.DEFAULT} />
                  <Text style={styles.dateText}>{formatDate(measurement.measurementDate)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/health-analytics/growth-details/add-measurement',
                    params: {
                      measurementId: measurement._id,
                      measurementData: JSON.stringify(measurement)
                    }
                  })}
                >
                  <Ionicons name="create-outline" size={20} color={Colors.inactive} />
                </TouchableOpacity>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Height</Text>
                  <Text style={styles.metricValue}>{measurement.height.value} {measurement.height.unit}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Weight</Text>
                  <Text style={styles.metricValue}>{measurement.weight.value} {measurement.weight.unit}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Head</Text>
                  <Text style={styles.metricValue}>
                    {measurement.headCircumference?.value ? 
                      `${measurement.headCircumference.value} ${measurement.headCircumference.unit}` : 
                      'N/A'
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.inactive} />
                <Text style={styles.locationText}>{measurement.location || 'Not specified'}</Text>
              </View>
            </View>
          ))
        )}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.inactive,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.dark,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.inactive,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
