import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommentSection } from './CommentSection';
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';

type ApiComment = {
  CommentID: string;
  Comment: string;
  CommenterID: string;
  CommentTime: string;
  Reply: boolean;
  to?: string | null;
  replies?: ApiComment[];
};

type UiComment = {
  id: string;
  commenterId: string;
  avatar: string;
  name: string;
  role?: string;
  time: string;
  content: string;
  isVerified?: boolean;
  replies?: UiComment[];
};

interface FeedPostCardProps {
  postId: string;
  postOwnerId: string;
  currentUserId: string;
  name: string;
  role: string;
  time: string;
  content: string;
  tags: string[];
  image?: string;
  avatar?: string;
  stats: { likes: number; dislikes: number; comments: number; shares: number; };
  comments: ApiComment[];
  isApproved?: boolean;
  approvedBy?: string;
  showAddFriend?: boolean;
  onAddFriend?: () => void;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isLiked?: boolean;
  isDisliked?: boolean;
  onToggleLike?: () => void;
  onToggleDislike?: () => void;
  onAddComment: (postId: string, text: string, parentCommentId?: string) => void;
  onUpdateComment: (postId: string, commentId: string, text: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

// helper: count all comments + replies
const countComments = (items: ApiComment[]): number =>
  items.reduce(
    (sum, c) => sum + 1 + (c.replies ? countComments(c.replies) : 0),
    0
  );

export const FeedPostCard: React.FC<FeedPostCardProps> = ({
  postId,
  postOwnerId,
  currentUserId,
  name, role, time, content, tags, image, avatar, stats, comments, isApproved, approvedBy,
  showAddFriend, onAddFriend, isOwner, onEdit, onDelete,
  isLiked, isDisliked, onToggleLike, onToggleDislike,
  onAddComment, onUpdateComment, onDeleteComment,
  isSaved, onToggleSave,
}) => {
  const [showComments, setShowComments] = React.useState(false);
  const [isFriendAdded, setIsFriendAdded] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  const handleAddFriend = () => {
    setIsFriendAdded(true);
    onAddFriend?.();
  };

  const mapComment = React.useCallback((c: ApiComment): UiComment => ({
    id: c.CommentID,
    commenterId: c.CommenterID,
    avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
    name: c.CommenterID,
    role: undefined,
    time: new Date(c.CommentTime).toLocaleString(),
    content: c.Comment,
    isVerified: false,
    replies: c.replies?.map(mapComment),
  }), []);

  const uiComments = React.useMemo(
    () => comments.map(mapComment),
    [comments, mapComment]
  );

  const totalComments = React.useMemo(
    () => countComments(comments),
    [comments]
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image 
          source={{ uri: avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }} 
          style={styles.avatar} 
        />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{role}</Text>
            </View>
          </View>
          <Text style={styles.time}>{time}</Text>
        </View>
        
        {showAddFriend && !isFriendAdded && (
          <TouchableOpacity 
            style={styles.addFriendButton}
            onPress={handleAddFriend}
          >
            <Ionicons name="person-add" size={16} color={Colors.primary.DEFAULT} />
          </TouchableOpacity>
        )}

        {isOwner && (
          <View style={{ position: 'relative' }}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={Colors.gray.dark} />
            </TouchableOpacity>
            
            {showMenu && (
              <View style={styles.menuDropdown}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onEdit?.();
                  }}
                >
                  <Ionicons name="pencil-outline" size={18} color={Colors.dark} />
                  <Text style={styles.menuText}>Edit</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onDelete?.();
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={[styles.menuText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {isApproved && (
        <View style={styles.approvedBadge}>
          <View style={styles.approvedIconContainer}>
            <Ionicons name="checkmark" size={12} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.approvedTitle}>Approved by Nutritionist</Text>
            <Text style={styles.approvedBy}>{approvedBy}</Text>
          </View>
        </View>
      )}
      
      <Text style={styles.content}>{content}</Text>
      
      <View style={styles.tags}>
        {tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {image && (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[
            styles.statButton,
            styles.likeButton,
            isLiked && { backgroundColor: '#4CAF50' },
          ]}
          onPress={onToggleLike}
        >
          <Ionicons
            name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={18}
            color={isLiked ? '#FFFFFF' : '#4CAF50'}
          />
          <Text
            style={[
              styles.statText,
              { color: isLiked ? '#FFFFFF' : '#4CAF50' },
            ]}
          >
            {stats.likes}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.statButton,
            styles.dislikeButton,
            isDisliked && { backgroundColor: '#EF4444' },
          ]}
          onPress={onToggleDislike}
        >
          <Ionicons
            name={isDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
            size={18}
            color={isDisliked ? '#FFFFFF' : '#EF4444'}
          />
          <Text
            style={[
              styles.statText,
              { color: isDisliked ? '#FFFFFF' : '#EF4444' },
            ]}
          >
            {stats.dislikes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statButton, styles.commentButton]}
          onPress={() => setShowComments(!showComments)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#3B82F6" />
          <Text style={[styles.statText, { color: '#3B82F6' }]}>
            {totalComments}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statButton, styles.starButton, isSaved && { backgroundColor: '#F59E0B20' }]}
          onPress={onToggleSave}
        >
          <Ionicons
            name={isSaved ? 'star' : 'star-outline'}
            size={18}
            color="#F59E0B"
          />
        </TouchableOpacity>
      </View>

      {showComments && (
        <CommentSection
          comments={uiComments}
          postId={postId}
          currentUserId={currentUserId}
          postOwnerId={postOwnerId}
          onAddComment={onAddComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginVertical: Layout.spacing.md,
    shadowColor: Colors.gray.dark,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  name: {
    fontWeight: '700',
    color: Colors.dark,
    fontSize: 15,
  },
  roleBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '600',
  },
  time: {
    color: Colors.inactive,
    fontSize: 12,
  },
  content: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Layout.spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Layout.spacing.md,
  },
  tag: {
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  tagText: {
    fontSize: 11,
    color: '#9333EA',
    fontWeight: '500',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Layout.spacing.xs,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  likeButton: {
    backgroundColor: '#DCFCE7',
  },
  dislikeButton: {
    backgroundColor: '#FEE2E2',
  },
  commentButton: {
    backgroundColor: '#DBEAFE',
  },
  starButton: {
    backgroundColor: '#FEF3C7',
    marginLeft: 'auto',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 12,
    padding: 10,
    marginBottom: Layout.spacing.md,
    gap: 10,
  },
  approvedIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  approvedBy: {
    fontSize: 11,
    color: '#A16207',
  },
  addFriendButton: {
    padding: 8,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    marginLeft: 'auto',
  },
  menuButton: {
    padding: 4,
    marginLeft: 8,
  },
  menuDropdown: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});
