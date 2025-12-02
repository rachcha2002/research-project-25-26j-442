import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';

interface ProfileStatsProps {
  user: {
    name: string;
    role: string;
    avatar: string;
    stats: {
      posts: number;
      followers: string;
      following: number;
    };
  };
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ 
  user,
  onFollowersPress,
  onFollowingPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.statItem} onPress={onFollowersPress}>
            <Text style={styles.statValue}>{user.stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.statItem} onPress={onFollowingPress}>
            <Text style={styles.statValue}>{user.stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 24,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.inactive,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
  },
  roleBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
