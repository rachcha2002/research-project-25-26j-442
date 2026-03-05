import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { useAuth } from '../../../../contexts/AuthContext';

interface TopNavBarProps {
  onBackPress: () => void;
  onAddPress: () => void;
  onProfilePress?: () => void;
  profileImage?: string;
  title?: string;
  showLogo?: boolean;
  showRightSection?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onBackPress,
  onAddPress,
  onProfilePress,
  profileImage,
  title,
  showLogo = true,
  showRightSection = true,
}) => {
  const { user } = useAuth();
  const resolvedProfileImage = profileImage || user?.profilePicture || '';
  const hasProfileImage = Boolean(resolvedProfileImage);
  const profileInitial = (user?.name?.trim()?.charAt(0) || '?').toUpperCase();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left Section: Back Button + Logo */}
        <View style={styles.leftSection}>
          <TouchableOpacity 
            onPress={onBackPress} 
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary.DEFAULT} />
          </TouchableOpacity>
        </View>

        {/* Center Section: Brand (Logo + Text) */}
        {showLogo && (
          <View style={styles.centerSection}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoEmoji}>👣</Text>
              </View>
              <View style={styles.brandContainer}>
                <Text style={styles.appName}>PediTrack</Text>
                <Text style={styles.tagline}>Baby Health Care Tracking App</Text>
              </View>
            </View>
          </View>
        )}

        
        {/* Right Section: Add + Profile */}
        {showRightSection && (
          <View style={styles.rightSection}>
            <TouchableOpacity 
              onPress={onAddPress} 
              style={styles.addButton}
              accessibilityLabel="Create post"
              accessibilityRole="button"
            >
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={onProfilePress}
            >
              {hasProfileImage ? (
                <Image
                  source={{ uri: resolvedProfileImage }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profileInitialContainer}>
                  <Text style={styles.profileInitialText}>{profileInitial}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoEmoji: {
    fontSize: 18,
  },
  brandContainer: {
    justifyContent: 'center',
  },
  appName: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tagline: {
    color: Colors.inactive,
    fontSize: 8,
    fontWeight: '400',
  },
  centerSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none', // Allow clicks to pass through to buttons underneath if overlap occurs
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1, // Ensure buttons are clickable
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.DEFAULT,
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
  profileInitialContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary.DEFAULT}20`,
  },
  profileInitialText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
});
