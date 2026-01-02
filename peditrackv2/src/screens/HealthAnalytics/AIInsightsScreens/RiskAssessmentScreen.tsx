import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

export const RiskAssessmentScreen: React.FC = () => {
  const router = useRouter();

  // Circular Progress Component
  const CircularProgress = ({ percentage, size = 60, color = '#10B981' }: { percentage: number; size?: number; color?: string }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="6"
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.progressTextContainer}>
          <Text style={[styles.progressPercentage, { color }]}>{percentage}%</Text>
        </View>
      </View>
    );
  };

  // Simple Line Chart for Risk Trend
  const RiskTrendChart = () => {
    return (
      <View style={styles.trendChartContainer}>
        <View style={styles.trendLine} />
        <View style={styles.trendXAxis}>
          <Text style={styles.axisLabel}>3-12</Text>
          <Text style={styles.axisLabel}>13-23</Text>
          <Text style={styles.axisLabel}>3/24</Text>
        </View>
        <Text style={styles.trendInfo}>Risk has increased 6%, 2.5 points</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Risk Assessment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Health Risk */}
        <View style={styles.overallRiskCard}>
          <Text style={styles.overallRiskTitle}>Overall Health Risk</Text>
          
          <View style={styles.riskIndicator}>
            <View style={styles.riskDot} />
            <Text style={styles.riskLevel}>Low</Text>
          </View>

          <Text style={styles.riskDate}>Last Calculated: Dec 24, 2025</Text>
          <Text style={styles.riskExplanation}>
            AI AI explanation with risk 50 AI 35.5% can
          </Text>

          <TouchableOpacity style={styles.recalculateButton}>
            <Text style={styles.recalculateText}>⟲ Request Recalculation</Text>
          </TouchableOpacity>
        </View>

        {/* Growth & Development Risk */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Growth & Development Risk</Text>
            <View style={styles.lowBadge}>
              <Text style={styles.lowBadgeText}>Low</Text>
            </View>
          </View>

          <View style={styles.riskRow}>
            <View style={styles.riskItem}>
              <CircularProgress percentage={91} color="#10B981" />
              <Text style={styles.riskItemLabel}>Growth Disorders</Text>
              <Text style={styles.riskItemValue}>Confidence: 91%</Text>
            </View>
            <View style={styles.riskItem}>
              <CircularProgress percentage={3} color="#EF4444" size={60} />
              <Text style={styles.riskItemLabel}>Developmental Delays</Text>
              <Text style={styles.riskItemValue}>Very Low Risk</Text>
            </View>
          </View>

          {/* Key Factors */}
          <View style={styles.factorsSection}>
            <Text style={styles.factorsTitle}>Key Factors:</Text>
            <View style={styles.factorItem}>
              <Text style={styles.factorBullet}>•</Text>
              <Text style={styles.factorText}>Height is age ~90-95th...</Text>
            </View>
            <View style={styles.factorItem}>
              <Text style={styles.factorBullet}>•</Text>
              <Text style={styles.factorText}>Development at age level</Text>
            </View>
          </View>
        </View>

        {/* Nutritional Risks */}
        <View style={styles.riskCategoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconContainer, { backgroundColor: '#FED7AA' }]}>
              <Ionicons name="nutrition" size={24} color="#F97316" />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>Nutritional Risks</Text>
              <View style={styles.moderateBadge}>
                <Text style={styles.moderateBadgeText}>Moderate</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chronic Condition Risks */}
        <View style={styles.riskCategoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="medkit" size={24} color="#EF4444" />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>Chronic Condition Risks</Text>
              <View style={styles.highBadge}>
                <Text style={styles.highBadgeText}>High</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Risk Changes Over Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Changes Over Time</Text>
          <RiskTrendChart />
        </View>

        {/* Risk Interactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Interactions</Text>
          
          <View style={styles.interactionsList}>
            <View style={styles.interactionItem}>
              <Text style={styles.interactionText}>Very High</Text>
              <View style={styles.interactionBar}>
                <View style={[styles.interactionFill, { width: '100%', backgroundColor: '#EF4444' }]} />
              </View>
              <Text style={styles.interactionValue}>+33%</Text>
            </View>

            <View style={styles.interactionItem}>
              <Text style={styles.interactionText}>Growth Risk</Text>
              <View style={styles.interactionBar}>
                <View style={[styles.interactionFill, { width: '80%', backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={styles.interactionValue}>+18%</Text>
            </View>

            <View style={styles.interactionItem}>
              <Text style={styles.interactionText}>Joint Sleep</Text>
              <View style={styles.interactionBar}>
                <View style={[styles.interactionFill, { width: '40%', backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.interactionValue}>Moderate</Text>
            </View>

            <View style={styles.interactionItem}>
              <Text style={styles.interactionText}>Overall</Text>
              <View style={styles.interactionBar}>
                <View style={[styles.interactionFill, { width: '60%', backgroundColor: '#3B82F6' }]} />
              </View>
              <Text style={styles.interactionValue}>High</Text>
            </View>
          </View>
        </View>

        {/* Recommended Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Actions</Text>

          <View style={styles.actionsList}>
            <View style={styles.actionItem}>
              <View style={styles.actionPriority}>
                <Ionicons name="flag" size={16} color="#10B981" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Maintain Diet</Text>
                <Text style={styles.actionDescription}>Nutrition 25 calories, provide</Text>
              </View>
            </View>

            <View style={styles.actionItem}>
              <View style={styles.actionPriority}>
                <Ionicons name="flag" size={16} color="#F59E0B" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Increase Iron Intake</Text>
                <Text style={styles.actionDescription}>Suggest a diet higher in ferkin & etc or supplement</Text>
              </View>
            </View>

            <View style={styles.actionItem}>
              <View style={styles.actionPriority}>
                <Ionicons name="flag" size={16} color="#EF4444" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Monitor Activities</Text>
                <Text style={styles.actionDescription}>Monitor low movement</Text>
              </View>
            </View>

            <View style={styles.actionItem}>
              <View style={styles.actionPriority}>
                <Ionicons name="flag" size={16} color="#10B981" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Low Priority</Text>
                <Text style={styles.actionDescription}>Sufficient current dailies</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.primaryButton}>
          <Ionicons name="notifications-outline" size={20} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Set Monitoring Reminders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Ionicons name="document-text-outline" size={20} color={Colors.dark} />
          <Text style={styles.secondaryButtonText}>Create Action Plan</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="share-social-outline" size={20} color={Colors.dark} />
            <Text style={styles.iconButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={20} color={Colors.dark} />
            <Text style={styles.iconButtonText}>Schedule Visit</Text>
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
  overallRiskCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  overallRiskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 16,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  riskDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  riskDate: {
    fontSize: 12,
    color: Colors.inactive,
    marginBottom: 12,
  },
  riskExplanation: {
    fontSize: 13,
    color: Colors.dark,
    lineHeight: 18,
    marginBottom: 16,
  },
  recalculateButton: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recalculateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  lowBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  riskRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  riskItem: {
    flex: 1,
    alignItems: 'center',
  },
  riskItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark,
    marginTop: 8,
    textAlign: 'center',
  },
  riskItemValue: {
    fontSize: 11,
    color: Colors.inactive,
    marginTop: 4,
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  factorsSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  factorsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  factorItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  factorBullet: {
    fontSize: 14,
    color: Colors.dark,
    marginRight: 8,
  },
  factorText: {
    fontSize: 12,
    color: Colors.dark,
    flex: 1,
  },
  riskCategoryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  moderateBadge: {
    backgroundColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  moderateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  highBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  highBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  trendChartContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    height: 140,
  },
  trendLine: {
    height: 60,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    marginBottom: 12,
  },
  trendXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  axisLabel: {
    fontSize: 10,
    color: Colors.inactive,
  },
  trendInfo: {
    fontSize: 11,
    color: '#F59E0B',
    textAlign: 'center',
  },
  interactionsList: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  interactionText: {
    fontSize: 11,
    color: Colors.dark,
    width: 70,
  },
  interactionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  interactionFill: {
    height: '100%',
    borderRadius: 4,
  },
  interactionValue: {
    fontSize: 11,
    color: Colors.inactive,
    width: 60,
    textAlign: 'right',
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  actionPriority: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 11,
    color: Colors.inactive,
    lineHeight: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.dark,
  },
});
