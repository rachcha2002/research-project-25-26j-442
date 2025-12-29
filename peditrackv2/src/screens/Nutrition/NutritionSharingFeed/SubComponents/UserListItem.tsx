import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Colors } from '../../../../constants/Colors';

interface UserItem {
  id: string;
  name: string;
  handle?: string;
  avatar?: string;
  role?: string;
  bio?: string;
  isFollowing?: boolean;
  canFollow?: boolean; // <--- new
}

interface UserListItemProps {
  user: UserItem;
  onFollowPress?: (id: string) => void;
  onPress?: (user: UserItem) => void;
}

export const UserListItem: React.FC<UserListItemProps> = ({ user, onFollowPress, onPress }) => {
  const canShowFollowButton = user.canFollow !== false && !!onFollowPress;

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(user)}>
      <View style={styles.left}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Text style={styles.placeholderText}>
              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{user.name}</Text>
          {user.handle ? <Text style={styles.handle}>{user.handle}</Text> : null}
        </View>
      </View>

      {canShowFollowButton && (
        <TouchableOpacity
          style={[
            styles.followButton,
            user.isFollowing && styles.followingButton,
          ]}
          onPress={() => onFollowPress?.(user.id)}
        >
          <Text
            style={[
              styles.followText,
              user.isFollowing && styles.followingText,
            ]}
          >
            {user.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
  },
  info: {
    flexShrink: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  handle: {
    fontSize: 12,
    color: Colors.inactive,
  },
  followButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary.DEFAULT,
  },
  followingButton: {
    backgroundColor: '#F3E5F5',
  },
  followText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  followingText: {
    color: '#A855F7',
  },
});
