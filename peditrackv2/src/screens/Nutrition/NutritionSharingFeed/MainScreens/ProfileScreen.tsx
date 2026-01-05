import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, RefreshControl, TouchableOpacity } from 'react-native';
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
  Comment,
  updatePostEngagement,
  removePostEngagement,
  addComment,
  updateComment,
  deleteComment,
  deletePost,
  savePost,
  removeSavedPost,
  followUser,
} from '../../../../services/SocialService';

// helper: add a comment (or reply) into the tree
const addCommentToTree = (
  items: Comment[],
  newComment: Comment,
  parentId?: string
): Comment[] => {
  if (!parentId || !newComment.Reply) {
    // top‑level comment or backend didn’t mark as Reply
    return [...items, newComment];
  }

  return items.map(c => {
    if (c.CommentID === parentId) {
      return {
        ...c,
        replies: [...(c.replies || []), newComment],
      };
    }

    return {
      ...c,
      replies: c.replies ? addCommentToTree(c.replies, newComment, parentId) : c.replies,
    };
  });
};

// helper: update a comment (or reply) in the tree
const updateCommentTree = (items: Comment[], updated: Comment): Comment[] =>
  items.map(c =>
    c.CommentID === updated.CommentID
      ? updated
      : {
          ...c,
          replies: c.replies ? updateCommentTree(c.replies, updated) : c.replies,
        }
  );

// helper: remove a comment (or reply) from the tree
const removeCommentFromTree = (items: Comment[], id: string): Comment[] =>
  items
    .filter(c => c.CommentID !== id)
    .map(c => ({
      ...c,
      replies: c.replies ? removeCommentFromTree(c.replies, id) : c.replies,
    }));

interface ProfileScreenProps {
  onBackPress: () => void;
  userId: string;        // profile user id (whose profile we show)
  currentUserId?: string; // logged-in user id (viewer); defaults to userId if not provided
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBackPress, userId, currentUserId }) => {
  const viewerId = currentUserId ?? userId;
  const isOwnProfile = viewerId === userId;

  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [showFollowList, setShowFollowList] = useState(false);
  const [followListTab, setFollowListTab] = useState<'followers' | 'following'>('followers');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [startInEditMode, setStartInEditMode] = useState(false);
  const [profile, setProfile] = useState<UserProfileOverview | null>(null);
  const [savedPosts, setSavedPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = React.useState(false); // simple local flag
  const [followListSelectedUserId, setFollowListSelectedUserId] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (isOwnProfile) {
        // own profile: load profile + viewer's saved posts
        const [profileData, savedData] = await Promise.all([
          getUserProfileOverview(userId),
          getSavedPostsByUser(viewerId),
        ]);
        setProfile(profileData);

        // sort saved posts: newest first (by post PostedTime)
        const sortedSavedData = [...savedData].sort(
          (a, b) =>
            new Date(b.post.PostedTime).getTime() -
            new Date(a.post.PostedTime).getTime()
        );
        setSavedPosts(sortedSavedData);
      } else {
        // viewing someone else: only load their posts, no saved tab
        const profileData = await getUserProfileOverview(userId);
        setProfile(profileData);
        setSavedPosts([]); // ensure empty
        // also force tab to posts in case it was changed before
        setActiveTab('posts');
      }
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
  }, [userId, viewerId]);

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

  // ---- INTERACTION HANDLERS (like/dislike, comments, save, delete) ----

  const handleToggleLike = async (postId: string) => {
    const target =
      profile?.posts.find(p => p.post.PostID === postId) ||
      savedPosts.find(p => p.post.PostID === postId);
    if (!target) return;

    const alreadyLiked = target.engagement.LikedBy.includes(viewerId);

    // optimistic: update profile.posts
    setProfile(prev =>
      prev
        ? {
            ...prev,
            posts: prev.posts.map(item => {
              if (item.post.PostID !== postId) return item;
              const engagement = {
                LikedBy: [...item.engagement.LikedBy],
                DislikedBy: [...item.engagement.DislikedBy],
              };
              if (alreadyLiked) {
                engagement.LikedBy = engagement.LikedBy.filter(id => id !== viewerId);
              } else {
                if (!engagement.LikedBy.includes(viewerId)) {
                  engagement.LikedBy.push(viewerId);
                }
                engagement.DislikedBy = engagement.DislikedBy.filter(id => id !== viewerId);
              }
              return { ...item, engagement };
            }),
          }
        : prev
    );

    // optimistic: update savedPosts
    setSavedPosts(prev =>
      prev.map(item => {
        if (item.post.PostID !== postId) return item;
        const engagement = {
          LikedBy: [...item.engagement.LikedBy],
          DislikedBy: [...item.engagement.DislikedBy],
        };
        if (alreadyLiked) {
          engagement.LikedBy = engagement.LikedBy.filter(id => id !== viewerId);
        } else {
          if (!engagement.LikedBy.includes(viewerId)) {
            engagement.LikedBy.push(viewerId);
          }
          engagement.DislikedBy = engagement.DislikedBy.filter(id => id !== viewerId);
        }
        return { ...item, engagement };
      })
    );

    try {
      if (alreadyLiked) {
        await removePostEngagement(viewerId, postId, 'like');
      } else {
        await updatePostEngagement(viewerId, postId, 'like');
      }
      // keep data in sync with backend
      await load(true);
    } catch (e) {
      console.error('Failed to toggle like', e);
      await load(true);
    }
  };

  const handleToggleDislike = async (postId: string) => {
    const target =
      profile?.posts.find(p => p.post.PostID === postId) ||
      savedPosts.find(p => p.post.PostID === postId);
    if (!target) return;

    const alreadyDisliked = target.engagement.DislikedBy.includes(viewerId);

    setProfile(prev =>
      prev
        ? {
            ...prev,
            posts: prev.posts.map(item => {
              if (item.post.PostID !== postId) return item;
              const engagement = {
                LikedBy: [...item.engagement.LikedBy],
                DislikedBy: [...item.engagement.DislikedBy],
              };
              if (alreadyDisliked) {
                engagement.DislikedBy = engagement.DislikedBy.filter(id => id !== viewerId);
              } else {
                if (!engagement.DislikedBy.includes(viewerId)) {
                  engagement.DislikedBy.push(viewerId);
                }
                engagement.LikedBy = engagement.LikedBy.filter(id => id !== viewerId);
              }
              return { ...item, engagement };
            }),
          }
        : prev
    );

    setSavedPosts(prev =>
      prev.map(item => {
        if (item.post.PostID !== postId) return item;
        const engagement = {
          LikedBy: [...item.engagement.LikedBy],
          DislikedBy: [...item.engagement.DislikedBy],
        };
        if (alreadyDisliked) {
          engagement.DislikedBy = engagement.DislikedBy.filter(id => id !== viewerId);
        } else {
          if (!engagement.DislikedBy.includes(viewerId)) {
            engagement.DislikedBy.push(viewerId);
          }
          engagement.LikedBy = engagement.LikedBy.filter(id => id !== viewerId);
        }
        return { ...item, engagement };
      })
    );

    try {
      if (alreadyDisliked) {
        await removePostEngagement(viewerId, postId, 'dislike');
      } else {
        await updatePostEngagement(viewerId, postId, 'dislike');
      }
      await load(true);
    } catch (e) {
      console.error('Failed to toggle dislike', e);
      await load(true);
    }
  };

  const handleAddComment = async (
    postId: string,
    text: string,
    parentCommentId?: string
  ) => {
    try {
      const newComment = await addComment(
        viewerId,
        postId,
        text,
        !!parentCommentId,
        parentCommentId
      );

      setProfile(prev =>
        prev
          ? {
              ...prev,
              posts: prev.posts.map(item =>
                item.post.PostID === postId
                  ? {
                      ...item,
                      comments: addCommentToTree(
                        item.comments,
                        newComment,
                        parentCommentId
                      ),
                    }
                  : item
              ),
            }
          : prev
      );

      setSavedPosts(prev =>
        prev.map(item =>
          item.post.PostID === postId
            ? {
                ...item,
                comments: addCommentToTree(
                  item.comments,
                  newComment,
                  parentCommentId
                ),
              }
            : item
        )
      );

      await load(true);
    } catch (e) {
      console.error('Failed to add comment', e);
    }
  };

  const handleUpdateComment = async (
    postId: string,
    commentId: string,
    text: string
  ) => {
    try {
      const updated = await updateComment(viewerId, commentId, text);

      setProfile(prev =>
        prev
          ? {
              ...prev,
              posts: prev.posts.map(item =>
                item.post.PostID === postId
                  ? {
                      ...item,
                      comments: updateCommentTree(item.comments, updated),
                    }
                  : item
              ),
            }
          : prev
      );

      setSavedPosts(prev =>
        prev.map(item =>
          item.post.PostID === postId
            ? {
                ...item,
                comments: updateCommentTree(item.comments, updated),
              }
            : item
        )
      );

      await load(true);
    } catch (e) {
      console.error('Failed to update comment', e);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteComment(viewerId, commentId);

      setProfile(prev =>
        prev
          ? {
              ...prev,
              posts: prev.posts.map(item =>
                item.post.PostID === postId
                  ? {
                      ...item,
                      comments: removeCommentFromTree(item.comments, commentId),
                    }
                  : item
              ),
            }
          : prev
      );

      setSavedPosts(prev =>
        prev.map(item =>
          item.post.PostID === postId
            ? {
                ...item,
                comments: removeCommentFromTree(item.comments, commentId),
              }
            : item
        )
      );

      await load(true);
    } catch (e) {
      console.error('Failed to delete comment', e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    // optimistic: remove from both lists
    setProfile(prev =>
      prev ? { ...prev, posts: prev.posts.filter(p => p.post.PostID !== postId) } : prev
    );
    setSavedPosts(prev => prev.filter(p => p.post.PostID !== postId));

    try {
      await deletePost(postId, viewerId);
      await load(true);
    } catch (e) {
      console.error('Failed to delete post', e);
      await load(true);
    }
  };

  const handleToggleSave = async (postId: string) => {
    const target =
      profile?.posts.find(p => p.post.PostID === postId) ||
      savedPosts.find(p => p.post.PostID === postId);
    if (!target) return;

    const alreadySaved = !!target.isSaved;

    // optimistic: flip flag in profile.posts
    setProfile(prev =>
      prev
        ? {
            ...prev,
            posts: prev.posts.map(item =>
              item.post.PostID === postId
                ? { ...item, isSaved: !alreadySaved }
                : item
            ),
          }
        : prev
    );

    // optimistic: update savedPosts list
    if (alreadySaved) {
      // unsave: remove from savedPosts
      setSavedPosts(prev => prev.filter(item => item.post.PostID !== postId));
    } else {
      // save: optionally just refetch after server call; here we'll rely on load(true)
    }

    try {
      if (alreadySaved) {
        await removeSavedPost(viewerId, postId);
      } else {
        await savePost(viewerId, postId);
      }
      await load(true);
    } catch (e) {
      console.error('Failed to toggle save', e);
      await load(true);
    }
  };

  const handleFollow = async () => {
    if (isOwnProfile || !viewerId) return;
    if (isFollowing) return; // no unfollow yet
    try {
      await followUser(viewerId, userId);
      setIsFollowing(true);
    } catch (e) {
      console.error('Failed to follow user from profile', e);
    }
  };

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

  // When a user is selected from the followers/following list, show their profile
  if (followListSelectedUserId) {
    return (
      <ProfileScreen
        userId={followListSelectedUserId}
        currentUserId={viewerId}
        onBackPress={() => setFollowListSelectedUserId(null)}
      />
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
        onOpenProfile={(id: string) => setFollowListSelectedUserId(id)}
      />
    );
  }

  if (selectedPost) {
    return (
      <PostDetailsScreen
        post={selectedPost}
        currentUserId={viewerId}
        startInEditMode={startInEditMode}
        onBackPress={() => setSelectedPost(null)}
        onPostUpdated={() => load(true)}
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

        {/* Follow button for other users */}
        {!isOwnProfile && (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={handleFollow}
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
          </View>
        )}

        {/* Only show tabs (Posts + Saved) on own profile */}
        {isOwnProfile && (
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {/* POSTS TAB (or the only view for other profiles) */}
        {activeTab === 'posts' && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
            {profile.posts.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.inactive }}>
                No posts yet.
              </Text>
            ) : (
              profile.posts.map(item => {
                const { post, engagement, comments, isSaved } = item;
                const isOwner = post.UserID === viewerId;

                const openDetailsForEdit = () => {
                  const uiPost = {
                    postId: post.PostID,
                    postOwnerId: post.UserID,
                    currentUserId: viewerId,
                    name: post.UserID,
                    role: 'User',
                    time: new Date(post.PostedTime).toLocaleString(),
                    content: post.Description || '',
                    tags: post.Tags || [],
                    image: post.PostUrl ? FILE_BASE_URL + post.PostUrl : undefined,
                    avatar: user.avatar,
                    stats: {
                      likes: engagement.LikedBy.length,
                      dislikes: engagement.DislikedBy.length,
                      comments: comments.length,
                      shares: 0,
                    },
                    comments,
                    isApproved: post.Approved,
                    allowRecommendations: !!post.ApprovementReq,
                    showAddFriend: false,
                    onAddFriend: undefined,
                    isOwner: true,
                    isLiked: engagement.LikedBy.includes(viewerId),
                    isDisliked: engagement.DislikedBy.includes(viewerId),
                    isSaved: !!isSaved,
                    onToggleLike: () => {},
                    onToggleDislike: () => {},
                    onToggleSave: () => {},
                    onAddComment: () => {},
                    onUpdateComment: () => {},
                    onDeleteComment: () => {},
                  };
                  setSelectedPost(uiPost);
                  setStartInEditMode(true);
                };

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
                    isOwner={isOwner}
                    onEdit={isOwner ? openDetailsForEdit : undefined}
                    onDelete={isOwner ? () => handleDeletePost(post.PostID) : undefined}
                    isLiked={engagement.LikedBy.includes(viewerId)}
                    isDisliked={engagement.DislikedBy.includes(viewerId)}
                    isSaved={!!isSaved}
                    onToggleLike={() => handleToggleLike(post.PostID)}
                    onToggleDislike={() => handleToggleDislike(post.PostID)}
                    onToggleSave={() => handleToggleSave(post.PostID)}
                    onAddComment={handleAddComment}
                    onUpdateComment={handleUpdateComment}
                    onDeleteComment={handleDeleteComment}
                  />
                );
              })
            )}
          </View>
        )}

        {/* SAVED TAB – only meaningful on own profile; will never be shown for others because tabs are hidden */}
        {activeTab === 'saved' && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
            {savedPosts.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.inactive }}>
                No saved posts yet.
              </Text>
            ) : (
              savedPosts.map(item => {
                const { post, engagement, comments, isSaved } = item;
                const isOwner = post.UserID === viewerId;
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
                    isOwner={isOwner}
                    // in saved tab: no delete post, only unsave
                    onEdit={undefined}
                    onDelete={undefined}
                    isLiked={engagement.LikedBy.includes(viewerId)}
                    isDisliked={engagement.DislikedBy.includes(viewerId)}
                    isSaved={isSaved ?? true}
                    onToggleLike={() => handleToggleLike(post.PostID)}
                    onToggleDislike={() => handleToggleDislike(post.PostID)}
                    onToggleSave={() => handleToggleSave(post.PostID)}
                    onAddComment={handleAddComment}
                    onUpdateComment={handleUpdateComment}
                    onDeleteComment={handleDeleteComment}
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
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.primary.DEFAULT,
  },
  followingButton: {
    backgroundColor: '#E5E7EB',
  },
  followButtonText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
  followingButtonText: {
    color: Colors.dark,
  },
});
