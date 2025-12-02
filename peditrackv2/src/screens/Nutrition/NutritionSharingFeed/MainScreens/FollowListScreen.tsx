import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { TopNavBar } from '../SubComponents/TopNavBar';
import { Searchbar } from '../SubComponents/Searchbar';
import { UserListItem } from '../SubComponents/UserListItem';

import { ProfileScreen } from './ProfileScreen';

interface FollowListScreenProps {
  initialTab: 'followers' | 'following';
  onBackPress: () => void;
  userName: string;
}

const MOCK_USERS = [
  {
    id: '1',
    name: 'Dr. Sarah',
    handle: '@sarahchen',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    role: 'Nutritionist' as const,
    bio: 'Pediatric Nutritionist | 10+ years exp',
    isFollowing: true,
    isVerified: true,
    stats: { posts: 156, followers: '5.2K', following: 420 },
  },
  {
    id: '2',
    name: 'Priya Kapoor',
    handle: '@priyak',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    role: 'Parent' as const,
    bio: 'Mom of twins | Food lover',
    isFollowing: false,
    stats: { posts: 45, followers: '120', following: 85 },
  },
  {
    id: '3',
    name: 'Nutritionist Maya',
    handle: '@nutritionmaya',
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    role: 'Nutritionist' as const,
    bio: 'Certified Child Nutritionist',
    isFollowing: true,
    isVerified: true,
    stats: { posts: 342, followers: '8.9K', following: 210 },
  },
  {
    id: '4',
    name: 'Michael Chen',
    handle: '@mikec',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    role: 'Parent' as const,
    bio: 'Dad of 3 | Healthy cooking enthusiast',
    isFollowing: false,
    stats: { posts: 12, followers: '45', following: 120 },
  },
  {
    id: '5',
    name: 'Jessica Miller',
    handle: '@jessmiller',
    avatar: 'https://randomuser.me/api/portraits/women/90.jpg',
    role: 'Parent' as const,
    bio: 'First time mom | Learning',
    isFollowing: true,
    stats: { posts: 89, followers: '340', following: 450 },
  },
  {
    id: '6',
    name: 'Dr. Lisa Park',
    handle: '@drlisapark',
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
    role: 'Nutritionist' as const,
    bio: 'Baby Nutrition Specialist',
    isFollowing: false,
    isVerified: true,
    stats: { posts: 210, followers: '3.1K', following: 180 },
  },
];

export const FollowListScreen: React.FC<FollowListScreenProps> = ({ 
  initialTab, 
  onBackPress,
  userName
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  if (selectedUser) {
    return (
      <ProfileScreen 
        user={selectedUser}
        onBackPress={() => setSelectedUser(null)}
      />
    );
  }

  const handleFollowPress = (id: string) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, isFollowing: !user.isFollowing } : user
    ));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.handle.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (activeTab === 'following') {
      return matchesSearch && user.isFollowing;
    }
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      <TopNavBar 
        title={userName}
        onBackPress={onBackPress}
        onAddPress={() => {}} 
        profileImage="" // Not needed as we hide right section
        showLogo={false}
        showRightSection={false}
      />
      
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Searchbar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
            onPress={() => setActiveTab('followers')}
          >
            <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
              Followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'following' && styles.activeTab]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
              Following
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <UserListItem 
              user={item} 
              onFollowPress={handleFollowPress} 
              onPress={setSelectedUser}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#A855F7', // Purple
  },
  tabText: {
    fontSize: 16,
    color: Colors.inactive,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#A855F7',
    fontWeight: '600',
  },
});
