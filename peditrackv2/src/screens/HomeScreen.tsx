import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { router, useFocusEffect } from 'expo-router';
import { useBaby } from '@/contexts/BabyContext';
import { 
  getLatestMeasurement, 
  getUpcomingVaccines, 
  getActiveConditions,
  Measurement,
  Vaccination,
  HealthCondition
} from '@/services/healthAnalyticsService';

export const HomeScreen: React.FC = () => {
  const { selectedBaby } = useBaby();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [nextVaccine, setNextVaccine] = useState<Vaccination | null>(null);
  const [activeConditions, setActiveConditions] = useState<HealthCondition[]>([]);

  const fetchData = async () => {
    if (!selectedBaby) return;

    try {
      // Don't set loading on refresh to avoid flickering entire screen
      if (!refreshing) setLoading(true);

      const [latestMeas, upcomingVax, conditions] = await Promise.all([
        getLatestMeasurement(selectedBaby._id),
        getUpcomingVaccines(selectedBaby._id),
        getActiveConditions(selectedBaby._id)
      ]);

      setMeasurement(latestMeas);
      // Sort vaccines by date and take the first one
      const next = upcomingVax && upcomingVax.length > 0 
        ? upcomingVax.sort((a, b) => new Date(a.scheduledDate || '').getTime() - new Date(b.scheduledDate || '').getTime())[0]
        : null;
      setNextVaccine(next);
      setActiveConditions(conditions || []);

    } catch (error) {
      console.error('Error fetching home screen data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [selectedBaby])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const calculateAge = (dateOfBirth: string): string => {
    const birth = new Date(dateOfBirth);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 +
                       (now.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}`;
    }
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years}y ${months}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!selectedBaby) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.message}>Please select or create a baby profile.</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/profile/add-baby')}
          >
            <Text style={styles.buttonText}>Add Baby Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get allergies from profile
  const allergies = selectedBaby.allergies && selectedBaby.allergies.length > 0 
    ? selectedBaby.allergies.join(', ')
    : null;

  // Determine health status
  const isHealthy = activeConditions.length === 0;
  const healthStatusColor = isHealthy ? Colors.primary.DEFAULT : '#F97316'; // Orange if issues

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Card */}
        <View style={[styles.heroCardContainer, styles.heroCard]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroText}>
              Plan every step your childs' care
            </Text>
          </View>
        </View>

        {/* Child Info Card */}
        <View style={[styles.childCard, styles.card]}>
          <View style={styles.childHeader}>
            <View style={styles.childImageContainer}>
              {selectedBaby.photo ? (
                <Image
                  source={{ uri: selectedBaby.photo }}
                  style={styles.childImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.childImage, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>{selectedBaby.name.charAt(0)}</Text>
                </View>
              )}
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{selectedBaby.name}</Text>
              <View style={styles.ageRow}>
                <View>
                  <Text style={styles.label}>Age</Text>
                  <Text style={styles.value}>{calculateAge(selectedBaby.dateOfBirth)}</Text>
                </View>
              </View>
            </View>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator size="small" color={Colors.primary.DEFAULT} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.label}>Weight :</Text>
                  <Text style={styles.value}>
                    {measurement?.weight ? `${measurement.weight.value} ${measurement.weight.unit}` : '--'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.label}>Height :</Text>
                  <Text style={styles.value}>
                    {measurement?.height ? `${measurement.height.value} ${measurement.height.unit}` : '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Next Vaccination: 
                  <Text style={styles.highlightText}> {nextVaccine ? formatDate(nextVaccine.scheduledDate) : 'None scheduled'}</Text>
                </Text>
                {nextVaccine && (
                  <Text style={styles.sectionSubtext}>{nextVaccine.vaccineName} ({nextVaccine.doseNumber}/{nextVaccine.totalDoses})</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Health</Text>
                <Text style={styles.sectionText}>Status: 
                  <Text style={{ color: healthStatusColor, fontWeight: 'bold' }}>
                    {isHealthy ? ' Healthy' : ` ${activeConditions.length} Active Condition${activeConditions.length > 1 ? 's' : ''}`}
                  </Text>
                </Text>
                {allergies && (
                  <Text style={styles.sectionSubtext}>Allergic to: {allergies}</Text>
                )}
                {!isHealthy && (
                  <Text style={styles.sectionSubtext}>
                    {activeConditions.map(c => c.conditionName).join(', ')}
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.actionsRow}>
            {/* Emergency Response */}
             <TouchableOpacity 
             style={[styles.actionCard, styles.card, styles.actionCardLeft]}
             onPress={() => router.push ('/emergency-response')}
             activeOpacity={0.8}
             >
           <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>🚑</Text>
           </View>
           <Text style={styles.actionText}>Emergency</Text>
             </TouchableOpacity>
             
             {/* Feeding Times (kept as requested) */}
             <View style={[styles.actionCard, styles.card, styles.actionCardRight]}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>🍽️</Text>
              </View>
              <Text style={styles.actionText}>Feeding Times</Text>
            </View>
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
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  heroCardContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 192,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heroText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  childCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  childImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
  },
  childImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: Colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: Colors.white,
    fontWeight: 'bold',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    color: Colors.primary.DEFAULT,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
  },
  label: {
    color: Colors.inactive,
    fontSize: 14,
  },
  value: {
    color: Colors.dark,
    fontWeight: '600',
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.dark,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionText: {
    color: Colors.inactive,
  },
  sectionSubtext: {
    color: Colors.inactive,
    fontSize: 14,
    marginTop: 4,
  },
  highlightText: {
    color: Colors.primary.DEFAULT,
  },
  orangeText: {
    color: '#F97316',
  },
  quickActionsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    flex: 1,
  },
  actionCardLeft: {
    marginRight: 8,
  },
  actionCardRight: {
    marginLeft: 8,
  },
  actionIcon: {
    width: 64,
    height: 64,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 32,
  },
  actionText: {
    color: Colors.dark,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
});
