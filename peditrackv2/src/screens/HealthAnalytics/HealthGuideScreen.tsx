import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SecondaryTopBar } from '@/components/SecondaryTopBar/SecondaryTopBar';
import { useRouter } from 'expo-router';

const guides = [
  {
    icon: 'bar-chart-outline',
    title: 'Growth Details',
    description: 'Track your baby\'s height, weight, head circumference, and BMI. Add new measurements to see their growth trajectory over time using WHO percentiles.'
  },
  {
    icon: 'medical-outline',
    title: 'Medications',
    description: 'Keep a record of all current and past medications. Set reminders so you never miss a dose, and mark them as completed when the course is done.'
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Vaccinations',
    description: 'Stay on top of immunization schedules. Log administered vaccines, add upcoming ones, and set reminders for due dates.'
  },
  {
    icon: 'thermometer-outline',
    title: 'Health Conditions',
    description: 'Log any illnesses, allergies or chronic conditions. Keep notes on symptoms and doctor visits in one organized place.'
  },
  {
    icon: 'moon-outline',
    title: 'Sleep & Nutrition',
    description: 'Use the interactive calendar to log daily sleep hours, sleep quality, and detailed feeding patterns including solid intakes and supplements.'
  },
  {
    icon: 'flash-outline',
    title: 'AI Insights',
    description: 'Get personalized insights and risk assessments based on the growth, health, and medical data you provide. Our AI analyzes trends to give you proactive tips.'
  }
];

export const HealthGuideScreen: React.FC = () => {
  const router = useRouter();

  return (
    <>
      <SecondaryTopBar title="Health Section Guide" showBackButton={true} onBackPress={() => router.back()} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Ionicons name="information-circle-outline" size={48} color={Colors.primary.DEFAULT} style={styles.headerIcon} />
            <Text style={styles.title}>How to use Health Features</Text>
            <Text style={styles.subtitle}>
              The Health Analytics section is designed to be your all-in-one hub for tracking your baby's physical development and medical history.
            </Text>
          </View>

          <View style={styles.guideContainer}>
            {guides.map((guide, index) => (
              <View key={index} style={styles.guideCard}>
                <View style={styles.iconContainer}>
                  <Ionicons name={guide.icon as any} size={24} color={Colors.white} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{guide.title}</Text>
                  <Text style={styles.cardDescription}>{guide.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/health' as any)}>
            <Text style={styles.actionButtonText}>Go to Health Dashboard</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
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
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.inactive,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  guideContainer: {
    gap: 16,
  },
  guideCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.inactive,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: Colors.primary.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
    gap: 8,
    shadowColor: Colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
