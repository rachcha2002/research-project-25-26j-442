import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';

export const AIInsightsScreen: React.FC = () => {
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
            <Ionicons name="sparkles" size={32} color={Colors.primary.light} />
          </View>
          <Text style={styles.headerTitle}>AI Insights</Text>
          <Text style={styles.headerSubtitle}>
            Personalized insights and recommendations for your child's health
          </Text>
        </View>

        {/* Health Summary Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightIconContainer}>
              <Ionicons name="analytics" size={24} color="#10B981" />
            </View>
            <Text style={styles.insightTitle}>Health Summary</Text>
          </View>
          <Text style={styles.insightDescription}>
            Your child's overall health is excellent. Growth metrics are within normal ranges, 
            and all vaccinations are up to date.
          </Text>
          <View style={styles.insightBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.insightBadgeText}>Excellent</Text>
          </View>
        </View>

        {/* Growth Prediction Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="trending-up" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.insightTitle}>Growth Prediction</Text>
          </View>
          <Text style={styles.insightDescription}>
            Based on current growth patterns, your child is expected to reach 
            approximately 98 cm in height within the next 3 months.
          </Text>
          <View style={styles.predictionMetrics}>
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>Expected Height</Text>
              <Text style={styles.predictionValue}>98 cm</Text>
            </View>
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>Expected Weight</Text>
              <Text style={styles.predictionValue}>15.5 kg</Text>
            </View>
          </View>
        </View>

        {/* Recommendations Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="bulb" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.insightTitle}>Recommendations</Text>
          </View>
          
          <View style={styles.recommendationItem}>
            <View style={styles.recommendationIcon}>
              <Ionicons name="nutrition" size={20} color={Colors.primary.light} />
            </View>
            <View style={styles.recommendationInfo}>
              <Text style={styles.recommendationTitle}>Nutrition</Text>
              <Text style={styles.recommendationText}>
                Consider adding more iron-rich foods to support healthy development
              </Text>
            </View>
          </View>

          <View style={styles.recommendationDivider} />

          <View style={styles.recommendationItem}>
            <View style={styles.recommendationIcon}>
              <Ionicons name="fitness" size={20} color={Colors.primary.light} />
            </View>
            <View style={styles.recommendationInfo}>
              <Text style={styles.recommendationTitle}>Physical Activity</Text>
              <Text style={styles.recommendationText}>
                Encourage tummy time and crawling activities for motor development
              </Text>
            </View>
          </View>

          <View style={styles.recommendationDivider} />

          <View style={styles.recommendationItem}>
            <View style={styles.recommendationIcon}>
              <Ionicons name="moon" size={20} color={Colors.primary.light} />
            </View>
            <View style={styles.recommendationInfo}>
              <Text style={styles.recommendationTitle}>Sleep Schedule</Text>
              <Text style={styles.recommendationText}>
                Maintain consistent bedtime routine for better sleep quality
              </Text>
            </View>
          </View>
        </View>

        {/* Milestone Predictions */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconContainer, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="trophy" size={24} color="#EC4899" />
            </View>
            <Text style={styles.insightTitle}>Upcoming Milestones</Text>
          </View>
          <Text style={styles.insightDescription}>
            Based on current development, here are expected milestones:
          </Text>
          
          <View style={styles.milestoneList}>
            <View style={styles.milestoneItem}>
              <View style={styles.milestoneDot} />
              <Text style={styles.milestoneText}>Walking independently (2-4 weeks)</Text>
            </View>
            <View style={styles.milestoneItem}>
              <View style={styles.milestoneDot} />
              <Text style={styles.milestoneText}>Speaking 2-word phrases (1-2 months)</Text>
            </View>
            <View style={styles.milestoneItem}>
              <View style={styles.milestoneDot} />
              <Text style={styles.milestoneText}>Self-feeding with utensils (2-3 months)</Text>
            </View>
          </View>
        </View>

        {/* Ask AI Button */}
        <TouchableOpacity style={styles.askAIButton}>
          <Ionicons name="chatbubble-ellipses" size={24} color={Colors.white} />
          <Text style={styles.askAIButtonText}>Ask AI a Question</Text>
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
  insightCard: {
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
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightTitle: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '600',
  },
  insightDescription: {
    color: Colors.inactive,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  insightBadgeText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  predictionMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  predictionItem: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
  },
  predictionLabel: {
    color: Colors.inactive,
    fontSize: 12,
    marginBottom: 4,
  },
  predictionValue: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  recommendationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationTitle: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationText: {
    color: Colors.inactive,
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationDivider: {
    height: 1,
    backgroundColor: Colors.background,
  },
  milestoneList: {
    gap: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.light,
    marginRight: 12,
  },
  milestoneText: {
    color: Colors.dark,
    fontSize: 14,
    flex: 1,
  },
  askAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.light,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  askAIButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});
