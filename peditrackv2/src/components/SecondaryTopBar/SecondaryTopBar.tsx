import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useBaby } from '@/contexts/BabyContext';
import { getTodayReminders } from '@/services/notificationService';
import { NotificationsPanel } from './NotificationsPanel';

interface SecondaryTopBarProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  /** Override profile press — defaults to navigating to the profile tab */
  onProfilePress?: () => void;
  /** Override logo press — defaults to navigating to the home tab */
  onLogoPress?: () => void;
  title?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

export const SecondaryTopBar: React.FC<SecondaryTopBarProps> = ({
  showBackButton = true,
  onBackPress,
  onNotificationPress,
  onProfilePress,
  onLogoPress,
  title,
  rightIcon,
  onRightPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { selectedBaby } = useBaby();
  const [panelVisible, setPanelVisible] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);

  // Refresh badge count whenever the selected baby changes
  const refreshBadge = useCallback(async () => {
    if (!selectedBaby) return;
    try {
      const { badgeCount: count } = await getTodayReminders(selectedBaby._id);
      setBadgeCount(count);
    } catch (e) {
      console.log('Error fetching secondary top bar badge count', e);
    }
  }, [selectedBaby]);

  useFocusEffect(
    useCallback(() => {
      refreshBadge();
    }, [refreshBadge])
  );

  const handleBackPress = () => {
    if (onBackPress) { onBackPress(); } else { router.back(); }
  };

  const handleLogoPress = () => {
    if (onLogoPress) { onLogoPress(); } else { router.push('/(tabs)/' as any); }
  };

  const handleProfilePress = () => {
    if (onProfilePress) { onProfilePress(); } else { router.push('/profile' as any); }
  };

  const handleBellPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      setPanelVisible(true);
    }
  };

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.container}>
          {/* Left — Back Button */}
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={Colors.primary.DEFAULT} />
            </TouchableOpacity>
          )}

          {/* Centre — Logo / Title (tappable → home) */}
          <TouchableOpacity
            style={styles.centerSection}
            onPress={handleLogoPress}
            activeOpacity={0.7}
            accessibilityLabel="Go to home"
            accessibilityRole="button"
          >
            {title ? (
              <Text style={styles.titleText}>{title}</Text>
            ) : (
              <>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoEmoji}>👣</Text>
                </View>
                <View style={styles.brandContainer}>
                  <Text style={styles.appName}>PediTrack</Text>
                  <Text style={styles.tagline}>Baby Health Care Tracking App</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Right — Bell + Avatar (or custom icon) */}
          <View style={styles.rightSection}>
            {rightIcon ? (
              <TouchableOpacity
                onPress={onRightPress}
                style={styles.iconButton}
                accessibilityRole="button"
              >
                <Ionicons name={rightIcon} size={24} color={Colors.primary.DEFAULT} />
              </TouchableOpacity>
            ) : (
              <>
                {/* Bell with badge */}
                <TouchableOpacity
                  onPress={handleBellPress}
                  style={styles.iconButton}
                  accessibilityLabel="Notifications"
                  accessibilityRole="button"
                >
                  <Ionicons name="notifications-outline" size={24} color={Colors.dark} />
                  {badgeCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Avatar → profile */}
                <TouchableOpacity
                  onPress={handleProfilePress}
                  style={styles.profileButton}
                  accessibilityLabel="Profile"
                  accessibilityRole="button"
                >
                  {user?.profilePicture ? (
                    <Image
                      source={{ uri: user.profilePicture }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Ionicons name="person" size={20} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Notifications panel modal */}
      <NotificationsPanel
        visible={panelVisible}
        onClose={() => { setPanelVisible(false); refreshBadge(); }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  logoContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  logoEmoji: { fontSize: 22 },
  brandContainer: { alignItems: 'flex-start' },
  appName: { color: Colors.dark, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  tagline: { color: Colors.inactive, fontSize: 9, fontWeight: '400', marginTop: 1 },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  // Red badge on bell
  badge: {
    position: 'absolute',
    top: 4, right: 4,
    minWidth: 16, height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: Colors.white,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  profileButton: {
    width: 40, height: 40, borderRadius: 20,
    overflow: 'hidden', borderWidth: 2, borderColor: '#E5E7EB',
  },
  profileImage: { width: '100%', height: '100%' },
  profilePlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: Colors.primary.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  titleText: { fontSize: 18, fontWeight: 'bold', color: Colors.dark },
});
