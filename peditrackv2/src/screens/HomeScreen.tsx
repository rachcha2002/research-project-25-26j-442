import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';

export const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400' }}
                style={styles.childImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>Thisal</Text>
              <View style={styles.ageRow}>
                <View>
                  <Text style={styles.label}>Age</Text>
                  <Text style={styles.value}>1 Year 2 months</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.label}>Weight :</Text>
              <Text style={styles.value}>3 kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.label}>Height :</Text>
              <Text style={styles.value}>40 cm</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Vaccination: 
              <Text style={styles.highlightText}> 16/12/2024</Text>
            </Text>
            <Text style={styles.sectionSubtext}>(DPT 4, OPV 4)</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedings</Text>
            <Text style={styles.sectionText}>Next Feeding Time: 
              <Text style={styles.highlightText}> 10.00 AM</Text>
            </Text>
            <Text style={styles.sectionSubtext}>Smashed Fruit</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health</Text>
            <Text style={styles.sectionText}>Status: 
              <Text style={styles.orangeText}> Ongoing fever</Text>
            </Text>
            <Text style={styles.sectionText}>Next Medication Time: 
              <Text style={styles.highlightText}> 10.00 AM</Text>
            </Text>
            <Text style={styles.sectionSubtext}>Paracetamol</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.actionsRow}>
            {/* Emergency Response */}
             <TouchableOpacity 
             style={[styles.actionCard, styles.card, styles.actionCardLeft]}
             onPress={() => router.push ('/emergency-response')}  // or any action you want
             activeOpacity={0.8}
             >
           <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>🚑</Text>
           </View>
           <Text style={styles.actionText}>Emergency</Text>
             </TouchableOpacity>
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
