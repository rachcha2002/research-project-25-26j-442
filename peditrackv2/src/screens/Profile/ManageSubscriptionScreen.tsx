import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { SecondaryTopBar } from '../../components/SecondaryTopBar/SecondaryTopBar';
import { SubscriptionStatus } from '../../services/userService';

// Card brand icons
function CardBrandIcon({ brand }: { brand: string | null }) {
  const icon = brand === 'visa' ? '💳' : brand === 'mastercard' ? '🟠' : brand === 'amex' ? '🔵' : '💳';
  return <Text style={{ fontSize: 18 }}>{icon}</Text>;
}

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const { user, cancelSubscription, getSubscriptionStatus, toggleAutoRenew, payNowWithSavedCard, createCheckoutSession, verifyCheckoutSession, isLoading } = useAuth();

  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isTogglingRenew, setIsTogglingRenew] = useState(false);
  const [isPayingNow, setIsPayingNow] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoadingSub(true);
      const status = await getSubscriptionStatus();
      setSubscription(status);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setLoadingSub(false);
    }
  }, [getSubscriptionStatus]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // ── No active subscription ─────────────────────────────────────────────────
  if (!user?.isPro && !loadingSub) {
    return (
      <View style={styles.container}>
        <SecondaryTopBar title="Manage Subscription" showBackButton onBackPress={() => router.back()} />
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Active Subscription</Text>
          <Text style={styles.emptyDesc}>You are currently on the Free plan.</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.replace('/profile/subscription' as any)}
          >
            <Text style={styles.actionBtnText}>Upgrade to PRO</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleToggleAutoRenew = async (value: boolean) => {
    try {
      setIsTogglingRenew(true);
      await toggleAutoRenew(value);
      await fetchSubscription(); // refresh
      const msg = value
        ? 'Auto-renewal enabled. Your subscription will renew automatically each month.'
        : 'Auto-renewal disabled. Your access will end on the billing date shown.';
      Alert.alert('Updated', msg);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update auto-renewal.');
    } finally {
      setIsTogglingRenew(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setIsPayingNow(true);

      // First try pay-now with saved card
      const result = await payNowWithSavedCard();

      if (result.needsCheckout) {
        // No saved card, open fresh checkout
        setIsPayingNow(false);
        
        const checkoutUrl = await createCheckoutSession();
        const res = await WebBrowser.openAuthSessionAsync(checkoutUrl, 'peditrack://');

        if (res.type === 'success' && res.url) {
          const parsed = Linking.parse(res.url);
          const sessionId = parsed.queryParams?.session_id as string | undefined;
          if (sessionId) {
            await verifyCheckoutSession(sessionId);
            await fetchSubscription();
            Alert.alert('🎉 Subscribed!', 'Your PRO subscription is now active again!');
          }
        }
      } else {
        await fetchSubscription();
        Alert.alert('✅ Payment Successful', result.message || 'Your subscription has been reactivated!');
      }
    } catch (err: any) {
      Alert.alert('Payment Failed', err?.message || 'Could not process payment. Please try again.');
    } finally {
      setIsPayingNow(false);
    }
  };

  const handleCancelClick = () => {
    Alert.alert(
      'Cancel Subscription',
      subscription?.cancelAtPeriodEnd
        ? 'Your subscription is already set to cancel at period end.'
        : `Are you sure? You'll keep PRO access until ${formatDate(subscription?.currentPeriodEnd ?? null)}, then lose all premium features.`,
      subscription?.cancelAtPeriodEnd
        ? [{ text: 'OK' }]
        : [
          { text: 'Keep PRO', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsCancelling(true);
                await cancelSubscription();
                await fetchSubscription();
                Alert.alert(
                  'Subscription Cancelled',
                  `You'll have PRO access until ${formatDate(subscription?.currentPeriodEnd ?? null)}.`
                );
              } catch (err: any) {
                Alert.alert('Error', err?.message || 'Failed to cancel subscription.');
              } finally {
                setIsCancelling(false);
              }
            },
          },
        ]
    );
  };

  if (loadingSub) {
    return (
      <View style={styles.container}>
        <SecondaryTopBar title="Manage Subscription" showBackButton onBackPress={() => router.back()} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
          <Text style={{ color: '#6B7280', marginTop: 12 }}>Loading subscription…</Text>
        </View>
      </View>
    );
  }

  const isExpiringSoon = subscription?.cancelAtPeriodEnd;
  const autoRenew = subscription?.autoRenew ?? true;

  return (
    <View style={styles.container}>
      <SecondaryTopBar title="Manage Subscription" showBackButton onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Status Card */}
        <LinearGradient
          colors={isExpiringSoon ? ['#6B7280', '#4B5563'] : ['#7C3AED', '#4F46E5']}
          style={styles.statusCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, isExpiringSoon ? styles.statusBadgeWarn : styles.statusBadgeActive]}>
              <View style={[styles.dot, isExpiringSoon ? { backgroundColor: '#FCD34D' } : { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusText}>{isExpiringSoon ? 'CANCELS SOON' : 'ACTIVE'}</Text>
            </View>
            <Ionicons name="star" size={26} color="#FCD34D" />
          </View>

          <Text style={styles.planTitle}>Monthly PRO</Text>
          <Text style={styles.planSub}>PediTrack AI Insights · Rs. 2,000/month</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{isExpiringSoon ? 'Access Until' : 'Next Billing Date'}</Text>
            <Text style={styles.detailValue}>{formatDate(subscription?.currentPeriodEnd ?? null)}</Text>
          </View>

          {subscription?.paymentMethodLast4 ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <View style={styles.cardRow}>
                <CardBrandIcon brand={subscription?.paymentMethodBrand ?? null} />
                <Text style={styles.detailValue}>
                  {subscription.paymentMethodBrand
                    ? subscription.paymentMethodBrand.charAt(0).toUpperCase() + subscription.paymentMethodBrand.slice(1)
                    : 'Card'}{' '}
                  •••• {subscription.paymentMethodLast4}
                </Text>
              </View>
            </View>
          ) : null}

          {subscription?.lastPaymentDate ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Payment</Text>
              <Text style={styles.detailValue}>
                ${subscription.lastPaymentAmount?.toFixed(2)} on {formatDate(subscription.lastPaymentDate)}
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Included Features */}
        <View style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          {['AI Growth Predictions (12-month)', 'Health Risk Assessments', 'Smart Nutrition Insights', 'Predictive Sleep Analytics', 'Priority Customer Support'].map((feat, i) => (
            <View key={i} style={styles.featItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.featText}>{feat}</Text>
            </View>
          ))}
        </View>

        {/* Auto-renewal toggle */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Billing Settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-renewal</Text>
              <Text style={styles.settingDesc}>
                {autoRenew
                  ? 'Subscription renews automatically each month'
                  : 'Subscription will expire at end of billing period'}
              </Text>
            </View>
            {isTogglingRenew ? (
              <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
            ) : (
              <Switch
                value={autoRenew}
                onValueChange={handleToggleAutoRenew}
                trackColor={{ false: '#E5E7EB', true: '#DDD6FE' }}
                thumbColor={autoRenew ? Colors.primary.DEFAULT : '#9CA3AF'}
                disabled={isLoading}
              />
            )}
          </View>
        </View>

        {/* Pay Now (manual) — shown when auto-renew is off or status is expired */}
        {(!autoRenew || subscription?.status === 'past_due') && (
          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={handlePayNow}
            disabled={isPayingNow || isLoading}
          >
            {isPayingNow ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.payNowText}>
                  {subscription?.paymentMethodLast4
                    ? `Pay Now with •••• ${subscription.paymentMethodLast4}`
                    : 'Pay Now'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Cancel button */}
        <TouchableOpacity
          style={[styles.cancelBtn, subscription?.cancelAtPeriodEnd && styles.cancelBtnDisabled]}
          onPress={handleCancelClick}
          disabled={isCancelling || isLoading || subscription?.cancelAtPeriodEnd}
        >
          {isCancelling ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={[styles.cancelBtnText, subscription?.cancelAtPeriodEnd && { color: '#9CA3AF' }]}>
              {subscription?.cancelAtPeriodEnd ? '✓ Cancellation Scheduled' : 'Cancel Subscription'}
            </Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginTop: 16 },
  emptyDesc: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  actionBtn: { backgroundColor: Colors.primary.DEFAULT, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 12 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  statusCard: { borderRadius: 24, padding: 24, gap: 6 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 6 },
  statusBadgeActive: { backgroundColor: 'rgba(16,185,129,0.2)' },
  statusBadgeWarn: { backgroundColor: 'rgba(251,191,36,0.2)' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  planTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  planSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#fff' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  featuresCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F3F4F6', gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  featItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featText: { fontSize: 14, color: '#374151' },

  settingsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F3F4F6', gap: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  settingInfo: { flex: 1, gap: 2 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  settingDesc: { fontSize: 12, color: '#6B7280', lineHeight: 16 },

  payNowBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary.DEFAULT, paddingVertical: 16, borderRadius: 16,
  },
  payNowText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  cancelBtn: {
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  cancelBtnDisabled: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  cancelBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
});
