import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { LinearGradient } from 'expo-linear-gradient';

export const AIInsightsScreen: React.FC = () => {
  // Simple Bar Chart Component
  const SimpleBarChart = () => {
    const data = [4, 6, 5, 7, 6, 8, 7];
    const maxValue = Math.max(...data);

    return (
      <View style={styles.chartContainer}>
        {data.map((value, index) => (
          <View key={index} style={styles.barWrapper}>
            <View 
              style={[
                styles.bar, 
                { 
                  height: `${(value / maxValue) * 100}%`,
                  backgroundColor: '#3B82F6'
                }
              ]} 
            />
          </View>
        ))}
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
          {/* Health Score Card */}
          <LinearGradient
            colors={['#60A5FA', '#3B82F6']}
            style={styles.scoreCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.scoreValue}>85</Text>
            <Text style={styles.scoreTotal}>/100</Text>
            <Text style={styles.scoreLabel}>Health Score</Text>
            
            <View style={styles.scoreDetails}>
              <View style={styles.scoreDetailRow}>
                <View style={styles.riskDot} />
                <Text style={styles.scoreDetailText}>Risk Level: Low</Text>
              </View>
              <Text style={styles.scoreDetailText}>Confidence: 88%</Text>
            </View>

            <TouchableOpacity style={styles.scoreLink}>
              <Text style={styles.scoreLinkText}>→ See last month</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* What Affects Your Score */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>What Affects{'\n'}Your Score?</Text>
              <TouchableOpacity>
                <Text style={styles.reportLink}>View{'\n'}Calculation Report →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.factorsList}>
              <FactorItem label="overall health" value={70} />
              <FactorItem label="nutrition intake" value={23} />
              <FactorItem label="sleep hygiene" value={10} />
              <FactorItem label="health condition" value={15} />
              <FactorItem label="vaccination compliance" value={13} />
              <FactorItem label="An accuracy" value={2} />
            </View>
          </View>

          {/* Key Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Insights</Text>
            
            <View style={styles.insightCard}>
              <Text style={styles.insightSubtitle}>Growth Prediction</Text>
              
              {/* Simple Bar Chart */}
              <SimpleBarChart />

              <View style={styles.insightDetails}>
                <View style={styles.insightRow}>
                  <Text style={styles.insightText}>Healthy height is good and</Text>
                  <View style={styles.excellentBadge}>
                    <Text style={styles.excellentBadgeText}>EXCELLENT</Text>
                  </View>
                </View>
                
                <View style={styles.insightRow}>
                  <Text style={styles.insightText}>Expected to Measure ~25.0 R cm</Text>
                  <View style={styles.learnMoreBadge}>
                    <Text style={styles.learnMoreBadgeText}>LEARN MORE</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* AI Dedicated Patterns */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Dedicated Patterns</Text>

            {/* SWOT Analysis Card */}
            <View style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <Text style={styles.patternIcon}>📊</Text>
                <Text style={styles.patternTitle}>SWOT analysis for pattern table</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.calculateLink}>Calculate avg →</Text>
              </TouchableOpacity>
            </View>

            {/* Pattern Insight 1 */}
            <View style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <Text style={styles.patternIcon}>😴</Text>
                <Text style={styles.patternTitle}>Sleep and nutrition affect growth velocity</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.calculateLink}>Calculate avg →</Text>
              </TouchableOpacity>
            </View>

            {/* Pattern Insight 2 */}
            <View style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <Text style={styles.patternIcon}>💉</Text>
                <Text style={styles.patternTitle}>Vaccination can help prevent disease</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.calculateLink}>Calculate avg →</Text>
              </TouchableOpacity>
            </View>

            {/* Suggestion Pattern */}
            <View style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <Text style={styles.patternIcon}>📢</Text>
                <Text style={styles.patternTitle}>Suggestion based on previous pattern</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.calculateLink}>Report Link →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Saved Recall Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Recall metrics</Text>
            
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
                <Text style={styles.metricValue}>88%</Text>
                <Text style={styles.metricLabel}>precision</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
                <Text style={styles.metricValue}>95%</Text>
                <Text style={styles.metricLabel}>Recall</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
                <Text style={styles.metricValue}>87%</Text>
                <Text style={styles.metricLabel}>F1-Score</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Growth Predictions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>View This Analysis report</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.dark} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Share with Doctor</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.dark} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

// Factor Item Component
const FactorItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.factorItem}>
    <Text style={styles.factorLabel}>{label}</Text>
    <Text style={styles.factorValue}>{value}</Text>
  </View>
);

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
  scoreCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
  },
  scoreTotal: {
    fontSize: 20,
    color: Colors.white,
    opacity: 0.9,
    marginTop: -8,
  },
  scoreLabel: {
    fontSize: 16,
    color: Colors.white,
    marginTop: 8,
    marginBottom: 16,
  },
  scoreDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  scoreDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  scoreDetailText: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
  },
  scoreLink: {
    marginTop: 8,
  },
  scoreLinkText: {
    fontSize: 13,
    color: Colors.white,
    textDecorationLine: 'underline',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
  },
  reportLink: {
    fontSize: 12,
    color: '#3B82F6',
    textAlign: 'right',
  },
  factorsList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  factorLabel: {
    fontSize: 14,
    color: Colors.dark,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  insightCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  insightSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 8,
    marginBottom: 16,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  insightDetails: {
    gap: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insightText: {
    fontSize: 13,
    color: Colors.dark,
    flex: 1,
  },
  excellentBadge: {
    backgroundColor: '#FED7AA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  excellentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9A3412',
  },
  learnMoreBadge: {
    backgroundColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  learnMoreBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  patternCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  patternIcon: {
    fontSize: 24,
  },
  patternTitle: {
    fontSize: 13,
    color: Colors.dark,
    flex: 1,
  },
  calculateLink: {
    fontSize: 11,
    color: '#3B82F6',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark,
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.inactive,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark,
  },
});
