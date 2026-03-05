import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function SubscriptionCancelScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect back to subscription screen after a short delay
    const timer = setTimeout(() => {
      router.replace('/profile/subscription');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <Ionicons name="close-circle" size={48} color={Colors.gray.DEFAULT} />
      </View>

      <Text style={styles.title}>Checkout Cancelled</Text>
      
      <Text style={styles.subtitle}>
        No payment was made. You can try again whenever you're ready.
      </Text>

      <Text style={styles.redirect}>Redirecting back...</Text>
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
    backgroundColor: Colors.gray.light,
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
