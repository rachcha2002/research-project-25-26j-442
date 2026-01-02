import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';

interface ProfileHeaderProps {
  onBackPress: () => void;
  onSettingsPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  onBackPress,
  onSettingsPress,
}) => {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        
        <View style={styles.centerSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>👣</Text>
          </View>
          <View style={styles.brandContainer}>
            <Text style={styles.appName}>PediTrack</Text>
            <Text style={styles.tagline}>Baby Health Care Tracking App</Text>
          </View>
        </View>

        {/* Empty view to balance the layout since settings button was removed */}
        <View style={styles.placeholderButton} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.white,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: 20,
  },
  placeholderButton: {
    width: 40,
    height: 40,
  },
  centerSection: {
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
    alignItems: 'flex-start',
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
});
