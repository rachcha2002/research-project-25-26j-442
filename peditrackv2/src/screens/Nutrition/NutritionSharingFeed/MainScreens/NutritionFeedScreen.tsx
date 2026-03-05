import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../../contexts/AuthContext';
import { TopNavBar } from '../SubComponents/TopNavBar';
import { Searchbar } from '../SubComponents/Searchbar';
import { FeedPostCard } from '../SubComponents/FeedPostCard';
import { CreatePostCard } from '../SubComponents/CreatePostCard';
import { ProfileScreen } from './ProfileScreen';
import { PostDetailsScreen } from './PostDetailsScreen';
import { UserSearchModal } from '../SubComponents/UserSearchModal';   // <-- ADD
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';
import {
  getAllPosts,
  FILE_BASE_URL,
  PostWithMeta,
  updatePostEngagement,
  removePostEngagement,
  createPost,
  addComment,
  updateComment,
  deleteComment,
  getFollowing,
  followUser,
  savePost,
  removeSavedPost,
  deletePost,
  Comment as ApiComment,
  Follow,                              // <-- ADD
} from '../../../../services/SocialService';

// helper: add a comment (or reply) into the tree
const addCommentToTree = (
  items: ApiComment[],
  newComment: ApiComment,
  parentId?: string
): ApiComment[] => {
  // top‑level comment or backend didn’t mark as Reply
  if (!parentId || !newComment.Reply) {
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
const updateCommentTree = (items: ApiComment[], updated: ApiComment): ApiComment[] =>
  items.map(c =>
    c.CommentID === updated.CommentID
      ? updated
      : {
          ...c,
          replies: c.replies ? updateCommentTree(c.replies, updated) : c.replies,
        }
  );

// helper: remove a comment (or reply) from the tree
const removeCommentFromTree = (items: ApiComment[], id: string): ApiComment[] =>
  items
    .filter(c => c.CommentID !== id)
    .map(c => ({
      ...c,
      replies: c.replies ? removeCommentFromTree(c.replies, id) : c.replies,
    }));

export function NutritionFeedScreen() {
  const { user } = useAuth();
  const currentUserId = user?._id ?? '';
  const currentUserName = user?.name?.trim() || 'User';
  const currentUserAvatar = user?.profilePicture || '';
  const [isCreatePostVisible, setCreatePostVisible] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentView, setCurrentView] = React.useState<'feed' | 'profile'>('feed');
  const [profileUserId, setProfileUserId] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'friends' | 'forYou'>('friends');
  const [posts, setPosts] = React.useState<PostWithMeta[]>([]);
  const [followingIds, setFollowingIds] = React.useState<string[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedPost, setSelectedPost] = React.useState<any | null>(null);
  const [startInEditMode, setStartInEditMode] = React.useState(false);
  const [isUserModalVisible, setIsUserModalVisible] = React.useState(false); // <-- ADD
  const router = useRouter();

  const fetchData = React.useCallback(async () => {
    if (!currentUserId) {
      setPosts([]);
      setFollowingIds([]);
      return;
    }

    try {
      setRefreshing(true);
      const [postsData, followingData] = await Promise.all([
        getAllPosts(currentUserId),
        getFollowing(currentUserId),
      ]);
      setPosts(postsData);

      // followingData is { total, page, limit, following: Follow[] }
      const followingList = (followingData.following || []) as Follow[];
      setFollowingIds(
        followingList.map((f: Follow) => f.followingId)  // <-- FIX HERE
      );
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId]);

  React.useEffect(() => {
    if (currentUserId && !profileUserId) {
      setProfileUserId(currentUserId);
    }
  }, [currentUserId, profileUserId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const visiblePosts = React.useMemo(() => {
    // 1) Filter by tab (friends vs forYou)
    const base =
      activeTab === 'friends'
        ? posts.filter(p => followingIds.includes(p.post.UserID))
        : posts; // "For You" = all posts

    // 2) Apply search filter
    const query = searchQuery.toLowerCase();
    if (!query) return base;

    return base.filter(({ post }) => {
      const description = (post.Description || '').toLowerCase();
      const userName = (post.userMeta?.name || post.UserID || '').toLowerCase();
      const tags = (post.Tags || []).map(t => t.toLowerCase());

      return (
        description.includes(query) ||
        userName.includes(query) ||
        tags.some(tag => tag.includes(query))
      );
    });
  }, [posts, followingIds, activeTab, searchQuery]);

  const handleToggleLike = async (postId: string) => {
    const target = posts.find(p => p.post.PostID === postId);
    if (!target) return;

    const alreadyLiked = target.engagement.LikedBy.includes(currentUserId);

    setPosts(prev =>
      prev.map(p => {
        if (p.post.PostID !== postId) return p;
        const engagement = { ...p.engagement };
        engagement.LikedBy = [...engagement.LikedBy];
        engagement.DislikedBy = [...engagement.DislikedBy];

        if (alreadyLiked) {
          engagement.LikedBy = engagement.LikedBy.filter(id => id !== currentUserId);
        } else {
          if (!engagement.LikedBy.includes(currentUserId)) {
            engagement.LikedBy.push(currentUserId);
          }
          engagement.DislikedBy = engagement.DislikedBy.filter(id => id !== currentUserId);
        }

        return { ...p, engagement };
      })
    );

    try {
      if (alreadyLiked) {
        await removePostEngagement(currentUserId, postId, 'like');
      } else {
        await updatePostEngagement(currentUserId, postId, 'like');
      }
    } catch (e) {
      console.error('Failed to toggle like', e);
    }
  };

  const handleToggleDislike = async (postId: string) => {
    const target = posts.find(p => p.post.PostID === postId);
    if (!target) return;

    const alreadyDisliked = target.engagement.DislikedBy.includes(currentUserId);

    setPosts(prev =>
      prev.map(p => {
        if (p.post.PostID !== postId) return p;
        const engagement = { ...p.engagement };
        engagement.LikedBy = [...engagement.LikedBy];
        engagement.DislikedBy = [...engagement.DislikedBy];

        if (alreadyDisliked) {
          engagement.DislikedBy = engagement.DislikedBy.filter(id => id !== currentUserId);
        } else {
          if (!engagement.DislikedBy.includes(currentUserId)) {
            engagement.DislikedBy.push(currentUserId);
          }
          engagement.LikedBy = engagement.LikedBy.filter(id => id !== currentUserId);
        }

        return { ...p, engagement };
      })
    );

    try {
      if (alreadyDisliked) {
        await removePostEngagement(currentUserId, postId, 'dislike');
      } else {
        await updatePostEngagement(currentUserId, postId, 'dislike');
      }
    } catch (e) {
      console.error('Failed to toggle dislike', e);
    }
  };

  const handleCreatePost = async (data: {
    content: string;
    tags: string[];
    allowRecommendations: boolean;
    file?: { uri: string; type: string; name: string };
  }) => {
    try {
      const newPost = await createPost(
        currentUserId,
        data.content,
        data.tags,
        data.file,
        data.allowRecommendations
      );

      setPosts(prev => [
        {
          post: newPost,
          engagement: { LikedBy: [], DislikedBy: [] },
          comments: [],
          isSaved: false, // <-- FIX: satisfy PostWithMeta
        },
        ...prev,
      ]);
    } catch (e) {
      console.error('Failed to create post', e);
    }
  };

  // ADD COMMENT – keep hierarchy in sync immediately
  const handleAddComment = async (
    postId: string,
    text: string,
    parentCommentId?: string
  ) => {
    try {
      const newComment = await addComment(
        currentUserId,
        postId,
        text,
        !!parentCommentId,
        parentCommentId
      );

      setPosts(prev =>
        prev.map(p =>
          p.post.PostID === postId
            ? {
                ...p,
                comments: addCommentToTree(p.comments, newComment, parentCommentId),
              }
            : p
        )
      );
    } catch (e) {
      console.error('Failed to add comment', e);
    }
  };

  // UPDATE COMMENT (works for main comments and replies)
  const handleUpdateComment = async (
    postId: string,
    commentId: string,
    text: string
  ) => {
    try {
      const updated = await updateComment(currentUserId, commentId, text);
      setPosts(prev =>
        prev.map(p =>
          p.post.PostID === postId
            ? { ...p, comments: updateCommentTree(p.comments, updated) }
            : p
        )
      );
    } catch (e) {
      console.error('Failed to update comment', e);
    }
  };

  // DELETE COMMENT (works for main comments and replies)
  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteComment(currentUserId, commentId);
      setPosts(prev =>
        prev.map(p =>
          p.post.PostID === postId
            ? { ...p, comments: removeCommentFromTree(p.comments, commentId) }
            : p
        )
      );
    } catch (e) {
      console.error('Failed to delete comment', e);
    }
  };

  // DELETE POST (post owner only)
  const handleDeletePost = async (postId: string) => {
    // optimistic remove from UI
    setPosts(prev => prev.filter(p => p.post.PostID !== postId));

    try {
      await deletePost(postId, currentUserId);
    } catch (e) {
      console.error('Failed to delete post', e);
      // restore by refetching if backend delete failed
      fetchData();
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      await followUser(currentUserId, userId);
      setFollowingIds(prev =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    } catch (e) {
      console.error('Failed to follow user', e);
    }
  };

  const handleOpenUserModal = () => {
    if (!searchQuery.trim()) return;
    setIsUserModalVisible(true);
  };

  const handleOpenUserProfile = (userId: string) => {
    setIsUserModalVisible(false);
    setProfileUserId(userId);
    setCurrentView('profile');
  };

  const handleToggleSave = async (postId: string) => {
    setPosts(prev =>
      prev.map(item =>
        item.post.PostID === postId
          ? { ...item, isSaved: !item.isSaved }
          : item
      ),
    );

    try {
      const target = posts.find(p => p.post.PostID === postId);
      const currentlySaved = target?.isSaved;

      if (currentlySaved) {
        await removeSavedPost(currentUserId, postId);
      } else {
        await savePost(currentUserId, postId);
      }
    } catch (e) {
      console.error('Failed to toggle save', e);
      // revert on failure
      setPosts(prev =>
        prev.map(item =>
          item.post.PostID === postId
            ? { ...item, isSaved: !item.isSaved }
            : item
        ),
      );
    }
  };

  // <-- ADD: show PostDetailsScreen when editing a post
  if (selectedPost) {
    return (
      <PostDetailsScreen
        post={selectedPost}
        currentUserId={currentUserId}
        startInEditMode={startInEditMode}
        onBackPress={() => setSelectedPost(null)}
        onPostUpdated={() => fetchData()}
      />
    );
  }

  if (currentView === 'profile') {
    return (
      <ProfileScreen
        userId={profileUserId}
        currentUserId={currentUserId}
        onBackPress={() => setCurrentView('feed')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <TopNavBar
        onBackPress={() => router.back()}
        onAddPress={() => setCreatePostVisible(true)}
        onProfilePress={() => {
          // always show current user's own profile
          setProfileUserId(currentUserId);
          setCurrentView('profile');
        }}
        profileImage={currentUserAvatar}
        title="Nutrition share feed"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Searchbar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFriendsPress={handleOpenUserModal}
          disableFriends={!searchQuery.trim()}
        />
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, activeTab === 'friends' && styles.activeToggleButton]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.toggleText, activeTab === 'friends' && styles.activeToggleText]}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, activeTab === 'forYou' && styles.activeToggleButton]}
            onPress={() => setActiveTab('forYou')}
          >
            <Text style={[styles.toggleText, activeTab === 'forYou' && styles.activeToggleText]}>For You</Text>
          </TouchableOpacity>
        </View>

        {visiblePosts.map(({ post, engagement, comments, isSaved }) => {
          const isOwner = post.UserID === currentUserId;
          const displayName =
            isOwner ? currentUserName : post.userMeta?.name || 'User';
          const displayAvatar =
            isOwner ? currentUserAvatar : post.userMeta?.profilePicture || '';

          const openDetailsForEdit = () => {
            const uiPost = {
              postId: post.PostID,
              postOwnerId: post.UserID,
              currentUserId,
              name: displayName,
              role: 'User',
              time: new Date(post.PostedTime).toLocaleString(),
              content: post.Description || '',
              tags: post.Tags || [],
              image: post.PostUrl ? FILE_BASE_URL + post.PostUrl : undefined,
              avatar: displayAvatar,
              stats: {
                likes: engagement.LikedBy?.length || 0,
                dislikes: engagement.DislikedBy?.length || 0,
                comments: comments.length,
                shares: 0,
              },
              comments,
              isApproved: post.Approved,
              allowRecommendations: !!post.ApprovementReq,
              showAddFriend: false,
              onAddFriend: undefined,
              isOwner: true,
              isLiked: engagement.LikedBy?.includes(currentUserId),
              isDisliked: engagement.DislikedBy?.includes(currentUserId),
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
              currentUserId={currentUserId}
              name={displayName}
              role="User"
              time={new Date(post.PostedTime).toLocaleString()}
              content={post.Description || ''}
              tags={post.Tags || []}
              image={post.PostUrl ? FILE_BASE_URL + post.PostUrl : undefined}
              avatar={displayAvatar}
              stats={{
                likes: engagement.LikedBy?.length || 0,
                dislikes: engagement.DislikedBy?.length || 0,
                comments: comments.length,
                shares: 0,
              }}
              comments={comments}
              isApproved={post.Approved}
              approvedBy={undefined}
              showAddFriend={
                activeTab === 'forYou' &&
                post.UserID !== currentUserId &&
                !followingIds.includes(post.UserID)
              }
              onAddFriend={() => handleAddFriend(post.UserID)}
              isOwner={isOwner}
              onEdit={isOwner ? openDetailsForEdit : undefined}          // <-- EDIT FROM FEED
              onDelete={() => handleDeletePost(post.PostID)}
              isLiked={engagement.LikedBy?.includes(currentUserId)}
              isDisliked={engagement.DislikedBy?.includes(currentUserId)}
              isSaved={isSaved}
              onToggleLike={() => handleToggleLike(post.PostID)}
              onToggleDislike={() => handleToggleDislike(post.PostID)}
              onToggleSave={() => handleToggleSave(post.PostID)}
              onAddComment={handleAddComment}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
            />
          );
        })}
      </ScrollView>
      <CreatePostCard 
        visible={isCreatePostVisible} 
        onClose={() => setCreatePostVisible(false)} 
        onSubmit={handleCreatePost}
      />
      {/* Add modal at bottom of render */}
      <UserSearchModal
        visible={isUserModalVisible}
        searchText={searchQuery}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        followingIds={followingIds}
        onClose={() => setIsUserModalVisible(false)}
        onToggleFollow={handleAddFriend}
        onOpenProfile={handleOpenUserProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 8,
  },
  title: {
    color: Colors.primary.DEFAULT,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: Layout.spacing.lg,
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: 100,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 25,
    padding: 4,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeToggleButton: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.inactive,
  },
  activeToggleText: {
    color: Colors.white,
  },
});
