import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { TopNavBar } from '../SubComponents/TopNavBar';
import { Searchbar } from '../SubComponents/Searchbar';
import { UserListItem } from '../SubComponents/UserListItem';
import {
  getFollowers,
  getFollowing,
  followUser as followUserApi,
  unfollowUser as unfollowUserApi,
} from '../../../../services/SocialService';

interface FollowListScreenProps {
  initialTab: 'followers' | 'following';
  onBackPress: () => void;
  userName: string;       // display name of the profile owner
  profileUserId: string;  // whose followers/following we are viewing
  currentUserId: string;  // logged-in user id (for follow/unfollow)
  onOpenProfile?: (userId: string) => void; // open another user's profile
}

const PAGE_LIMIT = 20;

export const FollowListScreen: React.FC<FollowListScreenProps> = ({
  initialTab,
  onBackPress,
  userName,
  profileUserId,
  currentUserId,
  onOpenProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  const [followersPage, setFollowersPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);
  const [followersTotal, setFollowersTotal] = useState(0);
  const [followingTotal, setFollowingTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // set of userIds the *current user* is following
  const [currentUserFollowingIds, setCurrentUserFollowingIds] = useState<Set<string>>(new Set());

  const loadCurrentUserFollowing = async () => {
    try {
      // big limit so we usually get all; adjust if needed
      const res = await getFollowing(currentUserId, 1, 1000);
      const ids = new Set<string>(res.following.map((rel: any) => rel.followingId));
      setCurrentUserFollowingIds(ids);

      // sync already-loaded lists with new follow-state
      setFollowers(prev =>
        prev.map(u => ({
          ...u,
          isFollowing: ids.has(u.id),
        })),
      );
      setFollowing(prev =>
        prev.map(u => ({
          ...u,
          isFollowing: ids.has(u.id),
        })),
      );
    } catch (e) {
      console.error('Failed to load current user following list', e);
    }
  };

  const mapFollowerToUserItem = (rel: { followerId: string }) => {
    const isSelf = rel.followerId === currentUserId;
    return {
      id: rel.followerId,
      name: rel.followerId,
      handle: `@${rel.followerId}`,
      avatar: undefined, // avoid empty uri warning
      role: 'Parent',
      bio: '',
      canFollow: !isSelf, // <-- viewer row: no follow button
      // show "Following" if current user already follows this follower
      isFollowing: !isSelf && currentUserFollowingIds.has(rel.followerId),
    };
  };

  const mapFollowingToUserItem = (rel: { followingId: string }) => {
    const isSelf = rel.followingId === currentUserId;
    return {
      id: rel.followingId,
      name: rel.followingId,
      handle: `@${rel.followingId}`,
      avatar: undefined,
      role: 'Parent',
      bio: '',
      canFollow: !isSelf, // <-- viewer row: no follow button
      // from current user's perspective
      isFollowing: !isSelf && currentUserFollowingIds.has(rel.followingId),
    };
  };

  const loadFollowers = async (page: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const res = await getFollowers(profileUserId, page, PAGE_LIMIT);
      const mapped = res.followers.map(mapFollowerToUserItem);
      setFollowers(prev => (append ? [...prev, ...mapped] : mapped));
      setFollowersPage(res.page);
      setFollowersTotal(res.total);
    } catch (e) {
      console.error('Failed to load followers', e);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async (page: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const res = await getFollowing(profileUserId, page, PAGE_LIMIT);
      const mapped = res.following.map(mapFollowingToUserItem);
      setFollowing(prev => (append ? [...prev, ...mapped] : mapped));
      setFollowingPage(res.page);
      setFollowingTotal(res.total);
    } catch (e) {
      console.error('Failed to load following', e);
    } finally {
      setLoading(false);
    }
  };

  // load who the *current user* follows (once, when currentUserId changes)
  useEffect(() => {
    loadCurrentUserFollowing();
  }, [currentUserId]);

  // Initial load and when switching tabs (fetch once per tab, then cached)
  useEffect(() => {
    if (activeTab === 'followers' && followers.length === 0) {
      loadFollowers(1, false);
    } else if (activeTab === 'following' && following.length === 0) {
      loadFollowing(1, false);
    }
  }, [activeTab, profileUserId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'followers') {
        await loadFollowers(1, false);
      } else {
        await loadFollowing(1, false);
      }
      // also refresh current user's following relationships
      await loadCurrentUserFollowing();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (loading) return;

    if (activeTab === 'followers') {
      if (followers.length < followersTotal) {
        loadFollowers(followersPage + 1, true);
      }
    } else {
      if (following.length < followingTotal) {
        loadFollowing(followingPage + 1, true);
      }
    }
  };

  const handleFollowPress = async (id: string) => {
    const list = activeTab === 'followers' ? followers : following;
    const index = list.findIndex((u: any) => u.id === id);
    if (index === -1) return;

    const user = list[index];
    const isCurrentlyFollowing = !!user.isFollowing;

    const updateListItem = (updatedUser: any) => {
      if (activeTab === 'followers') {
        setFollowers(prev => prev.map(u => (u.id === id ? updatedUser : u)));
      } else {
        setFollowing(prev => prev.map(u => (u.id === id ? updatedUser : u)));
      }
    };

    // optimistic toggle in UI
    const optimisticUser = { ...user, isFollowing: !isCurrentlyFollowing };
    updateListItem(optimisticUser);

    // optimistic update of set of ids current user follows
    setCurrentUserFollowingIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    try {
      if (isCurrentlyFollowing) {
        await unfollowUserApi(currentUserId, id);

        // if we're on our own profile's "Following" tab, remove from list
        if (activeTab === 'following' && profileUserId === currentUserId) {
          setFollowing(prev => prev.filter(u => u.id !== id));
          setFollowingTotal(prev => (prev > 0 ? prev - 1 : 0));
        }
      } else {
        await followUserApi(currentUserId, id);
      }
    } catch (e) {
      console.error('Follow/unfollow failed', e);

      // revert UI on error
      updateListItem(user);
      setCurrentUserFollowingIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          // we tried to unfollow but failed, so ensure id is still there
          next.add(id);
        } else {
          // we tried to follow but failed, so ensure id is removed
          next.delete(id);
        }
        return next;
      });
    }
  };

  const sourceUsers = activeTab === 'followers' ? followers : following;

  const filteredUsers = sourceUsers.filter((user: any) => {
    const lower = searchQuery.toLowerCase();
    const name = (user.name || '').toLowerCase();
    const handle = (user.handle || '').toLowerCase();
    const matchesSearch = name.includes(lower) || handle.includes(lower);
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      <TopNavBar
        title={userName}
        onBackPress={onBackPress}
        onAddPress={() => {}}
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
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <UserListItem
              user={item}
              onFollowPress={handleFollowPress}
              onPress={(u: any) => onOpenProfile && onOpenProfile(u.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReachedThreshold={0.5}
          onEndReached={handleLoadMore}
          ListEmptyComponent={
            !loading && !refreshing ? (
              <Text style={{ textAlign: 'center', color: Colors.inactive, marginTop: 16 }}>
                No users found.
              </Text>
            ) : null
          }
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
    borderBottomColor: '#A855F7',
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
