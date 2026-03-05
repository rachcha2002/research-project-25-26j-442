import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleLogoPress = () => {
    if (onLogoPress) {
      onLogoPress();
    } else {
      router.push('/(tabs)/' as any);
    }
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push('/profile' as any);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left Section - Back Button */}
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

        {/* Center Section - Logo and Brand OR Title */}
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

        {/* Right Section - Notification and Profile OR Action Icon */}
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
              <TouchableOpacity
                onPress={onNotificationPress}
                style={styles.iconButton}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
              >
                <Ionicons name="notifications-outline" size={24} color={Colors.dark} />
              </TouchableOpacity>

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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoEmoji: {
    fontSize: 22,
  },
  brandContainer: {
    alignItems: 'flex-start',
  },
  appName: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tagline: {
    color: Colors.inactive,
    fontSize: 9,
    fontWeight: '400',
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
  },
});
