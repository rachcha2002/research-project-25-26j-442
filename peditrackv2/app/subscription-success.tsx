import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../src/contexts/AuthContext';

export default function SubscriptionSuccessScreen() {
  const router = useRouter();
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const { verifyCheckoutSession, refreshUser } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        if (session_id && session_id !== '{CHECKOUT_SESSION_ID}') {
          await verifyCheckoutSession(session_id);
        }
        // Refresh user data to get updated isPro status
        await refreshUser();
        
        // Redirect to profile after short delay
        setTimeout(() => {
          router.replace('/profile/manage-subscription');
        }, 2000);
      } catch (err: any) {
        setError(err?.message || 'Failed to verify subscription');
        setTimeout(() => {
          router.replace('/profile');
        }, 3000);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAndRedirect();
  }, [session_id]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.iconBadge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isVerifying ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : error ? (
          <Ionicons name="alert-circle" size={48} color="#fff" />
        ) : (
          <Ionicons name="checkmark-circle" size={48} color="#fff" />
        )}
      </LinearGradient>

      <Text style={styles.title}>
        {isVerifying ? 'Verifying...' : error ? 'Oops!' : 'Welcome to PRO!'}
      </Text>
      
      <Text style={styles.subtitle}>
        {isVerifying
          ? 'Please wait while we confirm your subscription'
          : error
          ? error
          : 'Your subscription is now active. Enjoy all premium features!'}
      </Text>

      {!isVerifying && !error && (
        <Text style={styles.redirect}>Redirecting to your subscription...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray.DEFAULT,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  redirect: {
    fontSize: 14,
    color: Colors.inactive,
    marginTop: 24,
  },
});
