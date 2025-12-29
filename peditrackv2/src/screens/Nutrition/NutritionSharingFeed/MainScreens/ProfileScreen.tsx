import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { ProfileHeader } from '../SubComponents/ProfileHeader';
import { ProfileStats } from '../SubComponents/ProfileStats';
import { ProfileTabs } from '../SubComponents/ProfileTabs';
import { FollowListScreen } from './FollowListScreen';
import { PostDetailsScreen } from './PostDetailsScreen';
import { FeedPostCard } from '../SubComponents/FeedPostCard';
import {
  FILE_BASE_URL,
  getUserProfileOverview,
  UserProfileOverview,
  getSavedPostsByUser,
  PostWithMeta,
} from '../../../../services/SocialService';

interface ProfileScreenProps {
  onBackPress: () => void;
  userId: string;        // profile user id (whose profile we show)
  currentUserId?: string; // logged-in user id (viewer); defaults to userId if not provided
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBackPress, userId, currentUserId }) => {
  const viewerId = currentUserId ?? userId;

  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [showFollowList, setShowFollowList] = useState(false);
  const [followListTab, setFollowListTab] = useState<'followers' | 'following'>('followers');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfileOverview | null>(null);
  const [savedPosts, setSavedPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const [profileData, savedData] = await Promise.all([
        getUserProfileOverview(userId),
        getSavedPostsByUser(userId),
      ]);
      setProfile(profileData);
      setSavedPosts(savedData);
    } catch (e) {
      console.error('Failed to load profile overview or saved posts', e);
      setError('Failed to load profile');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    load(false);
  }, [userId]);

  const user = profile
    ? {
        name: profile.userId,
        role: 'User',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        stats: {
          posts: profile.postCount,
          followers: String(profile.followersCount),
          following: profile.followingCount,
        },
      }
    : null;

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  if (error || !profile || !user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: Colors.dark }}>{error || 'Profile not found'}</Text>
      </View>
    );
  }

  if (showFollowList) {
    return (
      <FollowListScreen
        initialTab={followListTab}
        onBackPress={() => setShowFollowList(false)}
        userName={user.name}
        profileUserId={profile.userId}
        currentUserId={viewerId}
      />
    );
  }

  if (selectedPost) {
    return (
      <PostDetailsScreen
        post={selectedPost}
        onBackPress={() => setSelectedPost(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ProfileHeader
        onBackPress={onBackPress}
        onSettingsPress={() => {}}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[Colors.primary.DEFAULT]}
            tintColor={Colors.primary.DEFAULT}
          />
        }
      >
        <ProfileStats
          user={user}
          onFollowersPress={() => {
            setFollowListTab('followers');
            setShowFollowList(true);
          }}
          onFollowingPress={() => {
            setFollowListTab('following');
            setShowFollowList(true);
          }}
        />

        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
            {profile.posts.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.inactive }}>
                No posts yet.
              </Text>
            ) : (
              profile.posts.map(post => (
                <FeedPostCard
                  key={post.PostID}
                  postId={post.PostID}
                  postOwnerId={post.UserID}
                  currentUserId={viewerId}
                  name={post.UserID}
                  role="User"
                  time={new Date(post.PostedTime).toLocaleString()}
                  content={post.Description || ''}
                  tags={post.Tags || []}
                  image={post.PostUrl ? FILE_BASE_URL + post.PostUrl : undefined}
                  avatar={user.avatar}
                  stats={{ likes: 0, dislikes: 0, comments: 0, shares: 0 }}
                  comments={[]}
                  isApproved={post.Approved}
                  approvedBy={undefined}
                  showAddFriend={false}
                  onAddFriend={undefined}
                  isOwner={post.UserID === viewerId}
                  onEdit={undefined}
                  onDelete={undefined}
                  isLiked={false}
                  isDisliked={false}
                  isSaved={false}
                  onToggleLike={() => {}}
                  onToggleDislike={() => {}}
                  onToggleSave={() => {}}
                  onAddComment={() => {}}
                  onUpdateComment={() => {}}
                  onDeleteComment={() => {}}
                />
              ))
            )}
          </View>
        )}

        {/* SAVED TAB */}
        {activeTab === 'saved' && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
            {savedPosts.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.inactive }}>
                No saved posts yet.
              </Text>
            ) : (
              savedPosts.map(item => {
                const { post, engagement, comments } = item;
                return (
                  <FeedPostCard
                    key={post.PostID}
                    postId={post.PostID}
                    postOwnerId={post.UserID}
                    currentUserId={viewerId}
                    name={post.UserID}
                    role="User"
                    time={new Date(post.PostedTime).toLocaleString()}
                    content={post.Description || ''}
                    tags={post.Tags || []}
                    image={post.PostUrl ? FILE_BASE_URL + post.PostUrl : undefined}
                    avatar={user.avatar}
                    stats={{
                      likes: engagement.LikedBy.length,
                      dislikes: engagement.DislikedBy.length,
                      comments: comments.length,
                      shares: 0,
                    }}
                    comments={comments}
                    isApproved={post.Approved}
                    approvedBy={undefined}
                    showAddFriend={false}
                    onAddFriend={undefined}
                    isOwner={post.UserID === viewerId}
                    onEdit={undefined}
                    onDelete={undefined}
                    isLiked={engagement.LikedBy.includes(viewerId)}
                    isDisliked={engagement.DislikedBy.includes(viewerId)}
                    isSaved={true}
                    onToggleLike={() => {}}
                    onToggleDislike={() => {}}
                    onToggleSave={() => {}}
                    onAddComment={() => {}}
                    onUpdateComment={() => {}}
                    onDeleteComment={() => {}}
                  />
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
