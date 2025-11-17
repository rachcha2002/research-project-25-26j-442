import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, FeatureCard } from '@/components';

export default function HealthScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Header 
          title="Baby Health" 
          userName="Thisol" 
          verified={true}
          onNotificationPress={() => console.log('Notifications')}
          onProfilePress={() => console.log('Profile')}
        />

        {/* Hero Card */}
        <View style={styles.heroContainer}>
          <View style={styles.heroCard}>
            <View style={styles.heroImage}>
              {/* Placeholder for image */}
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>Baby Health Image</Text>
              </View>
              <View style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>
                  Baby Health & Growth
                </Text>
                <Text style={styles.heroSubtitle}>
                  Every tiny step is a big milestone in a baby's journey toward health and growth
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            Health, Growth & Medications
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          <View style={styles.cardRow}>
            <FeatureCard title="Health Records" icon="📋" />
            <FeatureCard title="Growth Milestones" icon="📏" />
          </View>
          <View style={styles.centerCard}>
            <FeatureCard title="Medication Routines" icon="💊" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heroImage: {
    height: 192,
    backgroundColor: '#D1D5DB',
    position: 'relative',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#6B7280',
    fontSize: 18,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitleContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    color: '#8B7FE8',
    fontSize: 20,
    fontWeight: '600',
  },
  cardsContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    paddingBottom: 24,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  centerCard: {
    alignItems: 'center',
  },
});
