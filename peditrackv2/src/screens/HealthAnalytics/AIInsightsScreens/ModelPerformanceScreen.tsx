import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

export const ModelPerformanceScreen: React.FC = () => {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['option1']);

  // Simple Line Chart Component
  const LineChart = () => {
    const data1 = [30, 45, 40, 55, 50, 65];
    const data2 = [20, 35, 45, 50, 55, 60];
    const data3 = [40, 50, 35, 60, 45, 70];

    return (
      <View style={styles.lineChartContainer}>
        <View style={styles.lineChartGrid}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <View style={styles.lineChartContent}>
          {/* Simplified line representation */}
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Precision</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Accuracy</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>F1-Score</Text>
            </View>
          </View>
        </View>
        <View style={styles.chartXAxis}>
          <Text style={styles.axisLabel}>Jan</Text>
          <Text style={styles.axisLabel}>Feb</Text>
          <Text style={styles.axisLabel}>Mar</Text>
        </View>
      </View>
    );
  };

  // Stacked Area Chart Component  
  const StackedAreaChart = () => {
    return (
      <View style={styles.stackedChartContainer}>
        <View style={styles.stackedArea1} />
        <View style={styles.stackedArea2} />
        <View style={styles.stackedArea3} />
        <View style={styles.stackedArea4} />
        
        <View style={styles.stackedLegend}>
          <View style={styles.stackedLegendItem}>
            <View style={[styles.legendSquare, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Critical</Text>
          </View>
          <View style={styles.stackedLegendItem}>
            <View style={[styles.legendSquare, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>High Risk</Text>
          </View>
          <View style={styles.stackedLegendItem}>
            <View style={[styles.legendSquare, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Moderate</Text>
          </View>
          <View style={styles.stackedLegendItem}>
            <View style={[styles.legendSquare, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Low</Text>
          </View>
        </View>
      </View>
    );
  };

  const toggleOption = (option: string) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter(o => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Model Performance Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>87</Text>
            <Text style={styles.metricLabel}>DG</Text>
            <Text style={styles.metricSubLabel}>ML</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>91%</Text>
            <Text style={styles.metricLabel}>Specificity</Text>
            <Text style={styles.metricSubLabel}>Ad-Specific</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>92</Text>
            <Text style={styles.metricLabel}>F2</Text>
            <Text style={styles.metricSubLabel}>Avg-F2-macro</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>88</Text>
            <Text style={styles.metricLabel}>AUC-ROC</Text>
            <Text style={styles.metricSubLabel}>Curve</Text>
          </View>
        </View>

        {/* Risk Assessment Dashboard Button */}
        <TouchableOpacity style={styles.dashboardButton}>
          <Text style={styles.dashboardButtonText}>Risk Assessment Dashboard</Text>
        </TouchableOpacity>

        {/* Model Accuracy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Accuracy</Text>
          <Text style={styles.sectionSubtitle}>Shows Metrics</Text>

          <View style={styles.accuracyRow}>
            <View style={styles.accuracyBox}>
              <Text style={styles.accuracyLabel}>Low</Text>
              <Text style={styles.accuracyValue}>63%</Text>
              <View style={styles.successBadge}>
                <Text style={styles.successBadgeText}>NORMAL</Text>
              </View>
            </View>
            <View style={styles.accuracyBox}>
              <Text style={styles.accuracyLabel}>Med</Text>
              <Text style={styles.accuracyValue}>≤0.5 kg</Text>
              <View style={styles.successBadge}>
                <Text style={styles.successBadgeText}>NORMAL</Text>
              </View>
            </View>
            <View style={styles.accuracyBox}>
              <Text style={styles.accuracyLabel}>High</Text>
              <Text style={styles.accuracyValue}>87%</Text>
              <View style={styles.successBadge}>
                <Text style={styles.successBadgeText}>HIGH</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Precision-Accuracy Over Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Precision-Accuracy Over Time</Text>
          <LineChart />
        </View>

        {/* Model Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Performance</Text>
          
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.performanceValue}>+4.5%</Text>
              <Text style={styles.performanceLabel}>Avg Error</Text>
            </View>
            <View style={styles.performanceCard}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.performanceValue}>+7%</Text>
              <Text style={styles.performanceLabel}>Precision</Text>
            </View>
            <View style={styles.performanceCard}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.performanceValue}>+15%</Text>
              <Text style={styles.performanceLabel}>Recall</Text>
            </View>
            <View style={styles.performanceCard}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.performanceValue}>+8%</Text>
              <Text style={styles.performanceLabel}>F1-Score</Text>
            </View>
          </View>
        </View>

        {/* Risk Analysis by Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Analysis by Type</Text>
          <StackedAreaChart />
        </View>

        {/* Custom Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Options</Text>

          <View style={styles.optionsList}>
            <TouchableOpacity style={styles.optionItem} onPress={() => toggleOption('option1')}>
              <Ionicons 
                name={selectedOptions.includes('option1') ? 'checkbox' : 'square-outline'} 
                size={20} 
                color="#3B82F6" 
              />
              <Ionicons name="document-text" size={20} color="#6B7280" style={styles.optionIcon} />
              <Text style={styles.optionText}>Calculate Report</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.inactive} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={() => toggleOption('option2')}>
              <Ionicons 
                name={selectedOptions.includes('option2') ? 'checkbox' : 'square-outline'} 
                size={20} 
                color="#3B82F6" 
              />
              <Ionicons name="analytics" size={20} color="#6B7280" style={styles.optionIcon} />
              <Text style={styles.optionText}>Prediction Analysis</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.inactive} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={() => toggleOption('option3')}>
              <Ionicons 
                name={selectedOptions.includes('option3') ? 'checkbox' : 'square-outline'} 
                size={20} 
                color="#3B82F6" 
              />
              <Ionicons name="bar-chart" size={20} color="#6B7280" style={styles.optionIcon} />
              <Text style={styles.optionText}>Risk Assessment Current</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.inactive} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={() => toggleOption('option4')}>
              <Ionicons 
                name={selectedOptions.includes('option4') ? 'checkbox' : 'square-outline'} 
                size={20} 
                color="#3B82F6" 
              />
              <Ionicons name="warning" size={20} color="#6B7280" style={styles.optionIcon} />
              <Text style={styles.optionText}>Risk Interaction</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.inactive} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.pdfButton}>
            <Text style={styles.pdfButtonText}>Get Full PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.dark,
    marginTop: 4,
  },
  metricSubLabel: {
    fontSize: 9,
    color: Colors.inactive,
  },
  dashboardButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  dashboardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.inactive,
    marginBottom: 12,
  },
  accuracyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  accuracyBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  accuracyLabel: {
    fontSize: 12,
    color: Colors.inactive,
    marginBottom: 4,
  },
  accuracyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 8,
  },
  successBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  successBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  lineChartContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    height: 200,
  },
  lineChartGrid: {
    height: 120,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  lineChartContent: {
    marginTop: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
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
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: Colors.inactive,
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  axisLabel: {
    fontSize: 10,
    color: Colors.inactive,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  performanceCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginVertical: 4,
  },
  performanceLabel: {
    fontSize: 11,
    color: Colors.inactive,
  },
  stackedChartContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    height: 250,
  },
  stackedArea1: {
    height: 40,
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  stackedArea2: {
    height: 30,
    backgroundColor: '#EF4444',
  },
  stackedArea3: {
    height: 50,
    backgroundColor: '#F59E0B',
  },
  stackedArea4: {
    height: 40,
    backgroundColor: '#10B981',
    marginBottom: 16,
  },
  stackedLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  stackedLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionsList: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  optionIcon: {
    marginLeft: -4,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark,
  },
  pdfButton: {
    backgroundColor: Colors.dark,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  pdfButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
