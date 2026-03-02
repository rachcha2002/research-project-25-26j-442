import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { SecondaryTopBar } from '../../components/SecondaryTopBar/SecondaryTopBar';

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const { user, cancelSubscription, isLoading } = useAuth();
  const [isCancelling, setIsCancelling] = useState(false);

  // If user is not PRO, redirect them back or to the upgrade screen
  if (!user?.isPro) {
    return (
      <View style={styles.container}>
        <SecondaryTopBar title="Manage Subscription" showBackButton onBackPress={() => router.back()} />
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Active Subscription</Text>
          <Text style={styles.emptyDesc}>You are currently on the Free Basic plan.</Text>
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

  const handleCancelClick = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your PRO subscription? You will immediately lose access to all premium AI Insights, Growth Forecasts, and Risk Assessments.',
      [
        { text: 'Keep PRO', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              await cancelSubscription();
              Alert.alert('Success', 'Your subscription has been cancelled successfully.');
              setTimeout(() => {
                router.back();
              }, 500);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const planName = user.subscriptionPlan === 'pro_yearly' ? 'Yearly PRO' : 'Monthly PRO';
  const expiryDate = user.subscriptionExpiry 
    ? new Date(user.subscriptionExpiry).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <View style={styles.container}>
      <SecondaryTopBar title="Manage Subscription" showBackButton onBackPress={() => router.back()} />
      <View style={styles.content}>
        
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.activeBadge}>
              <View style={styles.dot} />
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
            <Ionicons name="star" size={24} color="#F59E0B" />
          </View>
          
          <Text style={styles.planTitle}>{planName}</Text>
          <Text style={styles.planSub}>PediTrack AI Insights</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Next Billing Date</Text>
            <Text style={styles.detailValue}>{expiryDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>•••• 4242</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>What's Included</Text>
        <View style={styles.featuresList}>
          {['AI Growth Predictions', 'Health Risk Assessments', 'Predictive Sleep Analytics', 'Priority Support'].map((feat, i) => (
            <View key={i} style={styles.featItem}>
              <Ionicons name="checkmark" size={20} color="#10B981" />
              <Text style={styles.featText}>{feat}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={handleCancelClick}
          disabled={isLoading || isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, padding: 20 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginTop: 16 },
  emptyDesc: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  actionBtn: { backgroundColor: Colors.primary.DEFAULT, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 12 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  statusCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  activeText: { color: '#047857', fontSize: 11, fontWeight: '800' },
  
  planTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  planSub: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginTop: 32, marginBottom: 16 },
  featuresList: { gap: 12 },
  featItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featText: { fontSize: 15, color: '#374151' },

  cancelBtn: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', marginBottom: 20 },
  cancelBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
});
