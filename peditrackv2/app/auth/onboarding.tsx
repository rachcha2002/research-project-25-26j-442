import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* TEST: Visible indicator */}
          <View style={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10 }}>
            <Text style={{ color: 'black', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
              ✅ APP IS WORKING!
            </Text>
            <Text style={{ color: 'black', fontSize: 16, textAlign: 'center', marginTop: 10 }}>
              If you see this, the app loaded successfully
            </Text>
          </View>

          {/* Logo/Icon Area */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>👶</Text>
            </View>
            <Text style={styles.appName}>PediTrack</Text>
            <Text style={styles.tagline}>Your Baby's Health Companion</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <FeatureItem 
              icon="📊" 
              text="Track growth and development" 
            />
            <FeatureItem 
              icon="🏥" 
              text="Monitor health records" 
            />
            <FeatureItem 
              icon="🤖" 
              text="AI-powered insights" 
            />
            <FeatureItem 
              icon="💊" 
              text="Medication reminders" 
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={async () => {
                await completeOnboarding();
                router.push('/auth/register');
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={async () => {
                await completeOnboarding();
                router.push('/auth/login');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>
                Already have an account? <Text style={styles.boldText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

interface FeatureItemProps {
  icon: string;
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: height * 0.1,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 60,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  featuresContainer: {
    marginVertical: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  secondaryButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  boldText: {
    fontWeight: 'bold',
  },
});
