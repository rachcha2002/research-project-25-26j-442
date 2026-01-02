//// filepath: c:\personals\Y4\RP\research-project-25-26j-442\peditrackv2\src\screens\Nutrition\NutritionSharingFeed\SubComponents\UserSearchModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Colors } from '../../../../constants/Colors';

type DummyUser = {
  id: string;
  name: string;
  avatar: string;
};

const DUMMY_USERS: DummyUser[] = [
  { id: 'USR0001', name: 'Alice Green', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
  { id: 'USR0002', name: 'Brian Lee', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
  { id: 'USR0003', name: 'Carla Gomez', avatar: 'https://randomuser.me/api/portraits/women/3.jpg' },
  { id: 'USR0007', name: 'You', avatar: 'https://randomuser.me/api/portraits/lego/1.jpg' },
];

interface UserSearchModalProps {
  visible: boolean;
  searchText: string;
  currentUserId: string;
  followingIds: string[];
  onClose: () => void;
  onToggleFollow: (userId: string) => void;
  onOpenProfile: (userId: string) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  visible,
  searchText,
  currentUserId,
  followingIds,
  onClose,
  onToggleFollow,
  onOpenProfile,
}) => {
  const query = searchText.trim().toLowerCase();

  const filtered = DUMMY_USERS.filter(u => {
    if (!query) return false;
    return (
      u.id.toLowerCase().includes(query) ||
      u.name.toLowerCase().includes(query)
    );
  });

  const renderItem = ({ item }: { item: DummyUser }) => {
    const isFollowing = followingIds.includes(item.id);
    const isSelf = item.id === currentUserId;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => onOpenProfile(item.id)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.idText}>{item.id}</Text>
        </View>

        {!isSelf && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton,
            ]}
            // if already following, just disable (no second call)
            onPress={() => {
              if (!isFollowing) onToggleFollow(item.id);
            }}
            disabled={isFollowing}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>People</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No users found.</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={renderItem}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
  },
  closeText: {
    fontSize: 14,
    color: Colors.inactive,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  idText: {
    fontSize: 12,
    color: Colors.inactive,
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.primary.DEFAULT,
  },
  followingButton: {
    backgroundColor: '#E5E7EB',
  },
  followButtonText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  followingButtonText: {
    color: Colors.dark,
  },
  empty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.inactive,
  },
});