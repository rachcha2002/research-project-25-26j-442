import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
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
  const { user, createCheckoutSession, verifyCheckoutSession, applyDemoCoupon, isLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    try {
      setIsApplyingCoupon(true);
      const res = await applyDemoCoupon(couponCode);
      if (res.success) {
        Alert.alert('Demo PRO Activated!', res.message, [
          { text: 'Awesome!', onPress: () => router.back() }
        ]);
      }
    } catch (err: any) {
      Alert.alert('Invalid Code', err?.message || 'Failed to apply coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSubscribe = useCallback(async () => {
    try {
      setIsProcessing(true);

      // Get the Stripe Checkout URL from backend
      const checkoutUrl = await createCheckoutSession();

      // Open Stripe Checkout in the system browser
      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, 'peditrack://');

      // 3. Handle success redirect
      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const sessionId = parsed.queryParams?.session_id as string | undefined;

        if (sessionId) {
          // 4. Verify session & update user state
          await verifyCheckoutSession(sessionId);
          Alert.alert(
            '🎉 Welcome to PRO!',
            'Your subscription is now active. Enjoy all premium features!',
            [{ text: 'Let\'s go!', onPress: () => router.back() }]
          );
        } else {
          // Redirected back without a session ID — might be cancel
          Alert.alert('Checkout Cancelled', 'No payment was made. You can try again whenever you\'re ready.');
        }
      } else {
        // Browser closed or dismissed
        if (result.type !== 'cancel') {
          Alert.alert('Checkout Cancelled', 'No payment was made. You can try again whenever you\'re ready.');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [createCheckoutSession, verifyCheckoutSession, router]);

  // If already PRO, show the active state
  if (user?.isPro) {
    return (
      <View style={styles.container}>
        <SecondaryTopBar title="Subscription" showBackButton onBackPress={() => router.back()} />
        <View style={styles.centerState}>
          <LinearGradient colors={['#FCD34D', '#F59E0B']} style={styles.iconBadgeLg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="star" size={36} color="#fff" />
          </LinearGradient>
          <Text style={styles.proTitle}>You're a PRO Member!</Text>
          <Text style={styles.proDesc}>You have access to all AI-powered premium features.</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.primary.DEFAULT }]}
            onPress={() => router.replace('/profile/manage-subscription' as any)}
          >
            <Ionicons name="settings-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const busy = isProcessing || isLoading;

  return (
    <View style={styles.container}>
      <SecondaryTopBar title="Upgrade to PRO" showBackButton onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#FCD34D', '#F59E0B']}
            style={styles.iconBadge}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="star" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Unlock PediTrack PRO</Text>
          <Text style={styles.subtitle}>
            AI-powered insights, predictive health scoring, and personalised analytics — all for your baby.
          </Text>
        </View>

        {/* Price Card */}
        <LinearGradient colors={['#7C3AED', '#4F46E5']} style={styles.priceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.priceCardInner}>
            <Text style={styles.priceLabel}>Monthly PRO</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>Rs.</Text>
              <Text style={styles.priceAmount}>2,000</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
            <Text style={styles.priceSub}>Cancel anytime · Secure payment via Stripe</Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>🔒 SSL Secured</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>💳 All Cards Accepted</Text></View>
          </View>
        </LinearGradient>

        {/* Feature comparison */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Compare Plans</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol, styles.tableColFeature]} />
            <Text style={[styles.tableCol, styles.tableColBasic, { color: '#9CA3AF', fontSize: 12, fontWeight: '600', textAlign: 'center' }]}>Free</Text>
            <Text style={[styles.tableCol, styles.tableColPro, { color: '#F59E0B', fontSize: 12, fontWeight: '800', textAlign: 'center' }]}>PRO</Text>
          </View>
          {FEATURES.map((feat, i) => (
            <View key={i} style={[styles.featureRow, i % 2 === 0 ? styles.featureRowAlt : null]}>
              <Text style={[styles.tableCol, styles.tableColFeature, styles.featureText]}>{feat.text}</Text>
              <View style={[styles.tableCol, styles.tableColBasic, styles.centerIcon]}>
                {feat.basic ? <Ionicons name="checkmark" size={18} color="#9CA3AF" /> : <Text style={styles.dash}>—</Text>}
              </View>
              <View style={[styles.tableCol, styles.tableColPro, styles.centerIcon]}>
                {feat.pro ? <Ionicons name="checkmark-circle" size={18} color="#F59E0B" /> : <Text style={styles.dash}>—</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Coupon Code Section */}
        <View style={styles.couponContainer}>
          <Text style={styles.couponLabel}>Have a promo code?</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter code"
              value={couponCode}
              onChangeText={setCouponCode}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.couponBtn}
              onPress={handleApplyCoupon}
              disabled={!couponCode.trim() || isApplyingCoupon || busy}
            >
              {isApplyingCoupon ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.couponBtnText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.subscribeBtnOuter} onPress={handleSubscribe} disabled={busy} activeOpacity={0.85}>
          <LinearGradient
            colors={busy ? ['#D1D5DB', '#9CA3AF'] : ['#F59E0B', '#D97706']}
            style={styles.subscribeBtnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color="#fff" />
                <Text style={styles.subscribeBtnText}>Subscribe Now · Rs. 2,000/mo</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By subscribing you agree to our Terms of Service &amp; Privacy Policy.{'\n'}
          You will be taken to Stripe's secure payment page to complete setup.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40, gap: 20 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },

  header: { alignItems: 'center', marginTop: 10, paddingHorizontal: 10 },
  iconBadge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconBadgeLg: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  priceCard: { borderRadius: 20, padding: 24, gap: 16 },
  priceCardInner: { gap: 4 },
  priceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceSymbol: { fontSize: 22, fontWeight: '700', color: '#fff' },
  priceAmount: { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 56 },
  pricePeriod: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginLeft: 4 },
  priceSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 10 },
  badge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  featuresCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  featuresTitle: { fontSize: 16, fontWeight: '700', padding: 16, paddingBottom: 8, color: '#1F2937' },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  tableCol: { justifyContent: 'center' },
  tableColFeature: { flex: 3.5, paddingLeft: 16, paddingRight: 8 },
  tableColBasic: { flex: 1, alignItems: 'center' },
  tableColPro: { flex: 1, alignItems: 'center' },
  featureRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  featureRowAlt: { backgroundColor: '#F9FAFB' },
  featureText: { fontSize: 13, color: '#374151', paddingLeft: 16 },
  centerIcon: { alignItems: 'center', justifyContent: 'center' },
  dash: { color: '#D1D5DB', fontSize: 16 },

  couponContainer: { marginTop: 4, paddingHorizontal: 4 },
  couponLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: '#1F2937' },
  couponBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  couponBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  subscribeBtnOuter: { marginTop: 8 },
  subscribeBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16 },
  subscribeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  termsText: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 17, paddingHorizontal: 20 },

  proTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  proDesc: { fontSize: 15, color: '#6B7280', textAlign: 'center', paddingHorizontal: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
