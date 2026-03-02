import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { SecondaryTopBar } from '../../components/SecondaryTopBar/SecondaryTopBar';

const FEATURES = [
  { text: 'Basic Baby Profile Management', basic: true, pro: true },
  { text: 'Manual Growth Tracking (Charts)', basic: true, pro: true },
  { text: 'Standard Health Records', basic: true, pro: true },
  { text: 'AI Growth Predictions (12-month)', basic: false, pro: true },
  { text: 'AI Health Risk Assessments', basic: false, pro: true },
  { text: 'Smart Nutrition Insights', basic: false, pro: true },
  { text: 'Predictive Sleep Analytics', basic: false, pro: true },
  { text: 'Priority Customer Support', basic: false, pro: true },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user, upgradeToPro, isLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'pro_monthly' | 'pro_yearly'>('pro_monthly');

  const handleSubscribe = async () => {
    try {
      await upgradeToPro(selectedPlan);
      // Wait a moment for context to update
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (e) {
      console.error(e);
    }
  };

  if (user?.isPro) {
    return (
      <View style={styles.container}>
        <SecondaryTopBar title="Subscription" showBackButton onBackPress={() => router.back()} />
        <View style={styles.centerState}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.proTitle}>You are a PRO User!</Text>
          <Text style={styles.proDesc}>You currently have access to all premium AI features.</Text>
          <TouchableOpacity 
            style={[styles.subscribeBtn, { backgroundColor: Colors.primary.DEFAULT }]} 
            onPress={() => router.replace('/profile/manage-subscription' as any)}
          >
            <Text style={styles.subscribeBtnText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SecondaryTopBar title="Upgrade to PRO" showBackButton onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <LinearGradient
            colors={['#FCD34D', '#F59E0B']}
            style={styles.iconBadge}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="star" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Unlock PediTrack PRO</Text>
          <Text style={styles.subtitle}>Get AI-powered insights, predictive health scoring, and personalized analytics for your baby.</Text>
        </View>

        {/* Feature Comparison */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Compare Plans</Text>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol, styles.tableColFeature]}></Text>
            <Text style={[styles.tableCol, styles.tableColBasic]}>Basic</Text>
            <Text style={[styles.tableCol, styles.tableColPro]}>PRO</Text>
          </View>

          {FEATURES.map((feat, i) => (
            <View key={i} style={[styles.featureRow, i % 2 === 0 ? styles.featureRowAlt : null]}>
              <Text style={[styles.tableCol, styles.tableColFeature, styles.featureText]}>{feat.text}</Text>
              <View style={[styles.tableCol, styles.tableColBasic, styles.centerIcon]}>
                {feat.basic ? (
                  <Ionicons name="checkmark" size={20} color="#9CA3AF" />
                ) : (
                  <Text style={styles.dashText}>—</Text>
                )}
              </View>
              <View style={[styles.tableCol, styles.tableColPro, styles.centerIcon]}>
                {feat.pro ? (
                  <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
                ) : (
                  <Text style={styles.dashText}>—</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Plan Selection */}
        <Text style={styles.sectionTitle}>Choose a Plan</Text>
        <View style={styles.plansContainer}>
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'pro_monthly' && styles.planCardActive]}
            onPress={() => setSelectedPlan('pro_monthly')}
            activeOpacity={0.8}
          >
            <View style={styles.planHeader}>
              <Ionicons 
                name={selectedPlan === 'pro_monthly' ? "radio-button-on" : "radio-button-off"} 
                size={24} 
                color={selectedPlan === 'pro_monthly' ? '#F59E0B' : '#D1D5DB'} 
              />
              <Text style={styles.planName}>Monthly</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>$</Text>
              <Text style={styles.priceAmount}>9.99</Text>
              <Text style={styles.pricePeriod}>/mo</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'pro_yearly' && styles.planCardActive]}
            onPress={() => setSelectedPlan('pro_yearly')}
            activeOpacity={0.8}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 25%</Text>
            </View>
            <View style={styles.planHeader}>
              <Ionicons 
                name={selectedPlan === 'pro_yearly' ? "radio-button-on" : "radio-button-off"} 
                size={24} 
                color={selectedPlan === 'pro_yearly' ? '#F59E0B' : '#D1D5DB'} 
              />
              <Text style={styles.planName}>Yearly</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>$</Text>
              <Text style={styles.priceAmount}>7.49</Text>
              <Text style={styles.pricePeriod}>/mo</Text>
            </View>
            <Text style={styles.billedYearly}>Billed $89.99 yearly</Text>
          </TouchableOpacity>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity 
          style={styles.subscribeBtnOuter}
          onPress={handleSubscribe}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.subscribeBtnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms of Service & Privacy Policy. Subscriptions automatically renew unless canceled.
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40, gap: 20 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  
  header: { alignItems: 'center', marginTop: 10, paddingHorizontal: 10 },
  iconBadge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  featuresCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  featuresTitle: { fontSize: 16, fontWeight: '700', padding: 16, paddingBottom: 8, color: '#1F2937' },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  tableCol: { justifyContent: 'center' },
  tableColFeature: { flex: 3.5, paddingLeft: 16, paddingRight: 8 },
  tableColBasic: { flex: 1, alignItems: 'center', color: '#9CA3AF', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  tableColPro: { flex: 1, alignItems: 'center', color: '#F59E0B', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  
  featureRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  featureRowAlt: { backgroundColor: '#F9FAFB' },
  featureText: { fontSize: 13, color: '#374151', paddingLeft: 16 },
  centerIcon: { alignItems: 'center', justifyContent: 'center' },
  dashText: { color: '#D1D5DB', fontSize: 16 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 8 },
  plansContainer: { gap: 12 },
  planCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    borderWidth: 2, 
    borderColor: '#E5E7EB',
    position: 'relative'
  },
  planCardActive: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  planName: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginLeft: 36 },
  priceSymbol: { fontSize: 16, fontWeight: '700', color: '#374151', marginRight: 2 },
  priceAmount: { fontSize: 28, fontWeight: '800', color: '#1F2937' },
  pricePeriod: { fontSize: 14, color: '#6B7280', marginLeft: 2 },
  billedYearly: { fontSize: 13, color: '#6B7280', marginLeft: 36, marginTop: 4 },
  
  saveBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  saveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  subscribeBtnOuter: { marginTop: 10 },
  subscribeBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, paddingHorizontal: 24 },
  subscribeBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14,
  },
  subscribeBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  termsText: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 16, marginTop: 8, paddingHorizontal: 20 },

  proTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginTop: 12 },
  proDesc: { fontSize: 15, color: '#6B7280', textAlign: 'center', paddingHorizontal: 30, marginBottom: 24 },
});
