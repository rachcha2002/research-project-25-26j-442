import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { getMeasurements, Measurement } from '@/services/healthAnalyticsService';
import { useBaby } from '@/contexts/BabyContext';

const { width } = Dimensions.get('window');

type MetricTab = 'Height' | 'Weight' | 'BMI' | 'Head';

export const GrowthDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { selectedBaby } = useBaby();
  const [selectedTab, setSelectedTab] = useState<MetricTab>('Height');
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
      
      // Sort by date descending (newest first)
      const sortedData = data.sort((a, b) => {
        return new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime();
      });
      
      // Get only the last 5 measurements
      setMeasurements(sortedData.slice(0, 5));
      console.log('[GrowthDetails] Loaded measurements:', sortedData.length, 'total,', sortedData.slice(0, 5).length, 'displayed');
    } catch (err) {
      console.error('Error loading measurements:', err);
      setError('Failed to load measurements.');
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

  const chartData = {
    labels: ['2y', '2.5y', '3y', '3.5y'],
    datasets: [
      {
        data: [85, 88, 92, 95],
        color: () => '#10B981',
        strokeWidth: 3,
      },
      {
        data: [80, 84, 88, 92],
        color: () => '#93C5FD',
        strokeWidth: 2,
      },
      {
        data: [88, 92, 96, 100],
        color: () => '#93C5FD',
        strokeWidth: 2,
      },
      {
        data: [82, 86, 90, 94],
        color: () => '#60A5FA',
        strokeWidth: 2,
      },
    ],
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
          {/* Title */}
          <Text style={styles.pageTitle}>Growth Tracking</Text>

          {/* Growth Chart Card */}
          <View style={styles.chartCard}>
            <LineChart
              data={chartData}
              width={width - 60}
              height={220}
              chartConfig={{
                backgroundColor: Colors.white,
                backgroundGradientFrom: Colors.white,
                backgroundGradientTo: Colors.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                labelColor: () => Colors.inactive,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: Colors.white,
                },
              }}
              bezier
              style={styles.chart}
            />
            
            {/* Chart Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#93C5FD' }]} />
                <Text style={styles.legendText}>WHO 95th</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#60A5FA' }]} />
                <Text style={styles.legendText}>WHO 50th</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#93C5FD' }]} />
                <Text style={styles.legendText}>WHO 5th</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Your Child</Text>
              </View>
            </View>

            {/* Metric Tabs */}
            <View style={styles.tabContainer}>
              {(['Height', 'Weight', 'BMI', 'Head'] as MetricTab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    selectedTab === tab && styles.activeTab,
                  ]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === tab && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Measurements */}
          <View style={styles.measurementsCard}>
            <Text style={styles.sectionTitle}>Recent Measurements (Last 5)</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
                <Text style={styles.loadingText}>Loading measurements...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadMeasurements}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : measurements.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No measurements yet</Text>
                <Text style={styles.emptySubtext}>Start tracking by adding a measurement</Text>
              </View>
            ) : (
              measurements.map((measurement) => (
                <View key={measurement._id} style={styles.measurementItem}>
                  <View style={styles.measurementLeft}>
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.inactive} />
                      <Text style={styles.measurementDate}>{formatDate(measurement.measurementDate)}</Text>
                    </View>
                    <Text style={styles.measurementValues}>
                      {measurement.height.value} {measurement.height.unit} | {measurement.weight.value} {measurement.weight.unit}
                      {measurement.headCircumference?.value && ` | ${measurement.headCircumference.value} ${measurement.headCircumference.unit}`}
                    </Text>
                    <Text style={styles.measurementLocation}>{measurement.location || 'Not specified'}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.editButton}
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
              ))
            )}

            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/health-analytics/growth-details/measurement-history')}
            >
              <Text style={styles.viewAllText}>View All History</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/health-analytics/growth-details/add-measurement')}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add Measurement</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => router.push('/health-analytics/growth-details/ai-predictions')}
          >
            <Ionicons name="sparkles-outline" size={20} color={Colors.primary.DEFAULT} />
            <Text style={styles.aiButtonText}>View AI Predictions</Text>
          </TouchableOpacity>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  logoSubtext: {
    fontSize: 10,
    color: Colors.inactive,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.inactive,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.inactive,
  },
  activeTabText: {
    color: Colors.white,
  },
  measurementsCard: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 16,
  },
  measurementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  measurementLeft: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  measurementDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  measurementValues: {
    fontSize: 14,
    color: Colors.dark,
    marginBottom: 4,
  },
  measurementLocation: {
    fontSize: 13,
    color: Colors.inactive,
  },
  editButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.DEFAULT,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.DEFAULT,
    gap: 8,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.inactive,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 14,
    color: Colors.dark,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.inactive,
  },
});
