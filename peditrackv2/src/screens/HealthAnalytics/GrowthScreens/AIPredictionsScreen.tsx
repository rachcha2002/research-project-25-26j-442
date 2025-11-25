import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

type TimePeriod = 'current' | '3months' | '6months' | '12months';

export const AIPredictionsScreen: React.FC = () => {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('3months');

  const chartData = {
    labels: ['3y', '3.5y', '4y', '4.5y'],
    datasets: [
      {
        data: [95, 98, 102, 105],
        color: () => '#3B82F6',
        strokeWidth: 3,
      },
      {
        data: [95, 97, 100, 103],
        color: () => '#93C5FD',
        strokeWidth: 2,
        withDots: false,
      },
    ],
  };

  const influenceFactors = [
    { name: 'Growth Velocity', value: 28 },
    { name: 'Nutrition Patterns', value: 25 },
    { name: 'Sleep Quality', value: 18 },
    { name: 'Genetic Factors', value: 15 },
    { name: 'Health Status', value: 15 },
    { name: 'Activity/Sleep', value: 10 },
    { name: 'Other', value: 7 },
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
          {/* AI Prediction Mode Badge */}
          <View style={styles.aiModeBadge}>
            <Ionicons name="sparkles" size={18} color="#3B82F6" />
            <View style={styles.aiModeTextContainer}>
              <Text style={styles.aiModeTitle}>AI Prediction Mode</Text>
              <Text style={styles.aiModeSubtitle}>Based on 48 months of growth data</Text>
            </View>
          </View>

          {/* Time Period Selector */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'current' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('current')}
            >
              <Text style={[styles.periodText, selectedPeriod === 'current' && styles.periodTextActive]}>
                Current
              </Text>
              <Text style={[styles.periodValue, selectedPeriod === 'current' && styles.periodValueActive]}>
                95 cm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === '3months' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('3months')}
            >
              <Text style={[styles.periodText, selectedPeriod === '3months' && styles.periodTextActive]}>
                3 Months
              </Text>
              <Text style={[styles.periodValue, selectedPeriod === '3months' && styles.periodValueActive]}>
                98 cm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === '6months' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('6months')}
            >
              <Text style={[styles.periodText, selectedPeriod === '6months' && styles.periodTextActive]}>
                6 Months
              </Text>
              <Text style={[styles.periodValue, selectedPeriod === '6months' && styles.periodValueActive]}>
                102 cm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === '12months' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('12months')}
            >
              <Text style={[styles.periodText, selectedPeriod === '12months' && styles.periodTextActive]}>
                12 Months
              </Text>
              <Text style={[styles.periodValue, selectedPeriod === '12months' && styles.periodValueActive]}>
                105 cm
              </Text>
            </TouchableOpacity>
          </View>

          {/* Growth Chart */}
          <View style={styles.chartCard}>
            <LineChart
              data={chartData}
              width={width - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: () => '#9CA3AF',
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#ffffff',
                },
              }}
              bezier
              style={styles.chart}
              withVerticalLines={false}
              withHorizontalLines={true}
              withInnerLines={true}
              withOuterLines={false}
            />
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Predicted</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#93C5FD' }]} />
                <Text style={styles.legendText}>Confidence</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryActionButton}>
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.primaryActionText}>Set Measurement Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryActionButton}>
              <Ionicons name="share-social-outline" size={20} color="#3B82F6" />
              <Text style={styles.secondaryActionText}>Share with Pediatrician</Text>
            </TouchableOpacity>
          </View>

          {/* Current Metrics */}
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Weight: 15.1 kg</Text>
              <Text style={styles.metricChange}>+0.9 kg</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricRow}>
              <Text style={styles.metricSubtext}>Expected: 47th-55th</Text>
              <Text style={styles.metricSubtext}>percentile</Text>
            </View>
          </View>

          {/* Forecast Cards */}
          <View style={styles.forecastSection}>
            <View style={styles.forecastCard}>
              <View style={styles.forecastHeader}>
                <Ionicons name="calendar-outline" size={18} color="#F59E0B" />
                <Text style={styles.forecastTitle}>6-Month Forecast</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>Medium (78%)</Text>
                </View>
              </View>
              <View style={styles.forecastMetrics}>
                <View style={styles.forecastMetric}>
                  <Text style={styles.forecastLabel}>Height: 102 cm</Text>
                  <Text style={styles.forecastValue}>+7 cm</Text>
                </View>
                <View style={styles.forecastMetric}>
                  <Text style={styles.forecastLabel}>Weight: 15.9 kg</Text>
                  <Text style={styles.forecastValue}>+0.8 kg</Text>
                </View>
              </View>
              <Text style={styles.forecastNote}>Expected: 48th-54th percentile</Text>
            </View>

            <View style={styles.forecastCard}>
              <View style={styles.forecastHeader}>
                <Ionicons name="calendar-outline" size={18} color="#F59E0B" />
                <Text style={styles.forecastTitle}>12-Month Forecast</Text>
                <View style={[styles.confidenceBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.confidenceText, { color: '#92400E' }]}>Medium-Low (59%)</Text>
                </View>
              </View>
              <View style={styles.forecastMetrics}>
                <View style={styles.forecastMetric}>
                  <Text style={styles.forecastLabel}>Height: 105 cm</Text>
                  <Text style={styles.forecastValue}>+10 cm</Text>
                </View>
                <View style={styles.forecastMetric}>
                  <Text style={styles.forecastLabel}>Weight: 17.2 kg</Text>
                  <Text style={styles.forecastValue}>+2.1 kg</Text>
                </View>
              </View>
              <Text style={styles.forecastNote}>Expected: 46th-52nd percentile</Text>
            </View>
          </View>

          {/* Influence Factors */}
          <View style={styles.influenceSection}>
            <View style={styles.influenceHeader}>
              <Ionicons name="help-circle-outline" size={20} color={Colors.dark} />
              <Text style={styles.influenceTitle}>What Influences This Prediction?</Text>
            </View>
            {influenceFactors.map((factor, index) => (
              <View key={index} style={styles.influenceItem}>
                <Text style={styles.influenceName}>{factor.name}</Text>
                <View style={styles.influenceBarContainer}>
                  <View style={[styles.influenceBar, { width: `${factor.value}%` }]} />
                </View>
                <Text style={styles.influenceValue}>{factor.value}</Text>
              </View>
            ))}
          </View>

          {/* Alert Card */}
          <View style={styles.alertCard}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Prediction shows potential growth velocity decrease in next 6 months</Text>
              <Text style={styles.alertSubtitle}>Consider reviewing nutrition plan →</Text>
            </View>
          </View>

          {/* Recommendation */}
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="calendar-outline" size={18} color={Colors.dark} />
              <Text style={styles.recommendationTitle}>Recommended Next Measurement</Text>
            </View>
            <Text style={styles.recommendationDate}>December 10, 2025</Text>
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
  aiModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  aiModeTextContainer: {
    flex: 1,
  },
  aiModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 2,
  },
  aiModeSubtitle: {
    fontSize: 12,
    color: '#3B82F6',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  periodText: {
    fontSize: 11,
    color: Colors.inactive,
    marginBottom: 4,
  },
  periodTextActive: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  periodValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
  },
  periodValueActive: {
    color: '#1E40AF',
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
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
    fontSize: 12,
    color: Colors.inactive,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  metricsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  metricChange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  metricDivider: {
    height: 1,
    backgroundColor: Colors.background,
    marginVertical: 12,
  },
  metricSubtext: {
    fontSize: 13,
    color: Colors.inactive,
  },
  forecastSection: {
    gap: 12,
    marginBottom: 16,
  },
  forecastCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  forecastTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  confidenceBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  forecastMetrics: {
    gap: 8,
    marginBottom: 8,
  },
  forecastMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: 14,
    color: Colors.dark,
  },
  forecastValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  forecastNote: {
    fontSize: 12,
    color: Colors.inactive,
    fontStyle: 'italic',
  },
  influenceSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  influenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  influenceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  influenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  influenceName: {
    fontSize: 13,
    color: Colors.dark,
    width: 120,
  },
  influenceBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  influenceBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  influenceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    width: 30,
    textAlign: 'right',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#92400E',
  },
  recommendationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  recommendationTitle: {
    fontSize: 14,
    color: Colors.inactive,
  },
  recommendationDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
});
