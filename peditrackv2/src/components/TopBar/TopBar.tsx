import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useBaby } from '@/contexts/BabyContext';
import { getTodayReminders } from '@/services/notificationService';
import { NotificationsPanel } from '@/components/SecondaryTopBar/NotificationsPanel';

interface TopBarProps {
  username?: string;
  childName?: string;
  profileImage?: string;
  onProfilePress?: () => void;
  /** Override notification press — defaults to opening in-app panel */
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
  const { selectedBaby } = useBaby();
  const [panelVisible, setPanelVisible] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);

  const refreshBadge = useCallback(async () => {
    if (!selectedBaby) return;
    const { badgeCount: count } = await getTodayReminders(selectedBaby._id);
    setBadgeCount(count);
  }, [selectedBaby]);

  useEffect(() => { refreshBadge(); }, [refreshBadge]);

  const handleBellPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      setPanelVisible(true);
    }
  };

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
              <View style={styles.logoContainer}>
                <Text style={styles.logoEmoji}>👣</Text>
              </View>
              <View style={styles.brandContainer}>
                <Text style={styles.appName}>PediTrack</Text>
                <Text style={styles.tagline}>Baby Health Care Tracking App</Text>
              </View>
            </View>

            {/* Right Section - Notification and Profile */}
            <View style={styles.rightSection}>
              {/* Notification Bell with badge */}
              <TouchableOpacity
                onPress={handleBellPress}
                style={styles.notificationButton}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
              >
                <Ionicons name="notifications-outline" size={28} color={Colors.white} />
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </Text>
                  </View>
                )}
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

      {/* Notifications panel */}
      <NotificationsPanel
        visible={panelVisible}
        onClose={() => { setPanelVisible(false); refreshBadge(); }}
      />
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
  logoEmoji: {
    fontSize: 32,
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
  // Red badge dot
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.primary.DEFAULT,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
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
