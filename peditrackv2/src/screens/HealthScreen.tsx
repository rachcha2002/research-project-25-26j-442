import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import Svg, { Rect, Defs, Pattern, Image as SvgImage, Use } from 'react-native-svg';

export const HealthScreen: React.FC = () => {
  const router = useRouter();

  const handleHealthPress = () => {
    router.push('/health-analytics/health-details');
  };

  const handleGrowthPress = () => {
    router.push('/health-analytics/growth-details');
  };

  const handleMedsPress = () => {
    router.push('/health-analytics/meds');
  };

  const handleAIInsightsPress = () => {
    router.push('/health-analytics/ai-insights');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroImageContainer}>
            <Ionicons name="heart" size={40} color={Colors.white} style={styles.heroIcon} />
          </View>
          <Text style={styles.heroSubtitle}>
            Every tiny step is a big milestone in a baby's journey toward health and growth
          </Text>
          <Text style={styles.heroTitle}>Baby Health & Growth</Text>
        </View>

        {/* Latest Growth Card */}
        <View style={styles.growthCard}>
          <View style={styles.growthHeader}>
            <Ionicons name="trending-up" size={20} color={Colors.primary.light} />
            <Text style={styles.growthHeaderText}>Latest Growth</Text>
          </View>
          
          <View style={styles.metricsContainer}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Height: 95.5 cm</Text>
              <View style={styles.percentileBadge}>
                <Text style={styles.percentileText}>48th %</Text>
              </View>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Weight: 14.2 kg</Text>
              <View style={styles.percentileBadge}>
                <Text style={styles.percentileText}>52nd %</Text>
              </View>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statusText}>On Track</Text>
          </View>

          <TouchableOpacity style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Cards Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.navCard}
              onPress={handleHealthPress}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconContainer, { backgroundColor: '#E0E7FF' }]}>
                <Svg width="50" height="50" viewBox="0 0 83 84">
                  <Rect width="82.1271" height="83.5146" rx="10" fill="#6366F1"/>
                </Svg>
              </View>
              <Text style={styles.navCardTitle}>Health</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={handleGrowthPress}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconContainer, { backgroundColor: '#E0E7FF' }]}>
                <Svg width="50" height="50" viewBox="0 0 97 86">
                  <Rect width="97" height="86" rx="19" fill="#6366F1"/>
                </Svg>
              </View>
              <Text style={styles.navCardTitle}>Growth</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.navCard}
              onPress={handleMedsPress}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconContainer, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="time" size={32} color="#6366F1" />
                <Ionicons name="medkit" size={20} color="#6366F1" style={styles.medkitIcon} />
              </View>
              <Text style={styles.navCardTitle}>Meds</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={handleAIInsightsPress}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconContainer, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="hardware-chip" size={32} color="#6366F1" />
                <Ionicons name="sparkles" size={20} color="#6366F1" style={styles.sparklesIcon} />
              </View>
              <Text style={styles.navCardTitle}>AI Insights</Text>
            </TouchableOpacity>
          </View>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImageContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    opacity: 0.8,
  },
  heroSubtitle: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.9,
    maxWidth: '70%',
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  growthCard: {
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
  growthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  growthHeaderText: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '500',
  },
  percentileBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentileText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  viewDetailsButton: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '600',
  },
  gridContainer: {
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  navCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  navIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  folderIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  chartIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  medkitIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  sparklesIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  navCardTitle: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
