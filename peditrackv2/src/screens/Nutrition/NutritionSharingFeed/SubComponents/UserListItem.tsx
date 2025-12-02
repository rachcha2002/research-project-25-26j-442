import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';

interface UserListItemProps {
  user: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    role: 'Nutritionist' | 'Parent';
    bio: string;
    isFollowing: boolean;
    isVerified?: boolean;
  };
  onFollowPress: (id: string) => void;
  onPress?: (user: any) => void;
}

export const UserListItem: React.FC<UserListItemProps> = ({ user, onFollowPress, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress?.(user)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{user.name}</Text>
          {user.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary.DEFAULT} style={styles.verifiedIcon} />
          )}
          <View style={[styles.roleBadge, user.role === 'Nutritionist' ? styles.roleNutritionist : styles.roleParent]}>
            <Text style={[styles.roleText, user.role === 'Nutritionist' ? styles.roleTextNutritionist : styles.roleTextParent]}>
              {user.role}
            </Text>
          </View>
        </View>
        
        <Text style={styles.handle}>{user.handle}</Text>
        <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text>
      </View>

      <TouchableOpacity
        style={[styles.followButton, user.isFollowing && styles.followingButton]}
        onPress={() => onFollowPress(user.id)}
      >
        <Ionicons 
          name={user.isFollowing ? "person" : "person-add"} 
          size={16} 
          color={user.isFollowing ? Colors.primary.DEFAULT : Colors.white} 
          style={styles.buttonIcon}
        />
        <Text style={[styles.buttonText, user.isFollowing && styles.followingButtonText]}>
          {user.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: Colors.white,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginRight: 4,
  },
  verifiedIcon: {
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleNutritionist: {
    backgroundColor: '#F3E5F5', // Light purple
  },
  roleParent: {
    backgroundColor: '#E3F2FD', // Light blue
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  roleTextNutritionist: {
    color: '#9C27B0',
  },
  roleTextParent: {
    color: '#2196F3',
  },
  handle: {
    fontSize: 14,
    color: Colors.inactive,
    marginBottom: 2,
  },
  bio: {
    fontSize: 13,
    color: Colors.gray.dark,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A855F7', // Purple
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  followingButton: {
    backgroundColor: '#F3E5F5',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#A855F7',
  },
  buttonIcon: {
    marginRight: 4,
  },
});
