import React from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface TopBarProps {
  username?: string;
  childName?: string;
  profileImage?: string;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  onChildNamePress?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  username,
  childName,
  profileImage,
  onProfilePress,
  onNotificationPress,
  onChildNamePress,
}) => {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.primary.DEFAULT, Colors.primary.light]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.container}>
            {/* Left Section - Logo and App Name */}
            <View style={styles.leftSection}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/peditrack_logo/peditrack-white-nobg.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              {/* App Name and Tagline */}
              <View style={styles.brandContainer}>
                <Text style={styles.appName}>PediTrack</Text>
                <Text style={styles.tagline}>Baby Health Care Tracking App</Text>
              </View>
            </View>

            {/* Right Section - Notification and Profile */}
            <View style={styles.rightSection}>
              {/* Notification Bell */}
              <TouchableOpacity
                onPress={onNotificationPress}
                style={styles.notificationButton}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
              >
                <Ionicons name="notifications-outline" size={28} color={Colors.white} />
              </TouchableOpacity>

              {/* Profile Picture */}
              <TouchableOpacity
                onPress={onProfilePress}
                style={styles.profileButton}
                accessibilityLabel="Profile"
                accessibilityRole="button"
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Ionicons name="person" size={28} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Section - Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Hello {username || 'User'}!</Text>
            <TouchableOpacity
              style={styles.childNameRow}
              onPress={onChildNamePress}
              activeOpacity={0.7}
            >
              <Text style={styles.childName}>{childName || 'No baby selected'}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.white} style={styles.checkmark} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingBottom: 20,
  },
  safeArea: {
    paddingHorizontal: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  brandContainer: {
    flex: 1,
  },
  appName: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tagline: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.9,
    marginTop: 2,
  },
  greetingSection: {
    marginTop: 16,
    marginBottom: 4,
  },
  greeting: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  childName: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '500',
  },
  checkmark: {
    marginLeft: 6,
    opacity: 0.9,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
