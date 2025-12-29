import React from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommentItem } from './CommentItem';
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';

interface Comment {
  id: string;
  avatar: string;
  name: string;
  commenterId: string;
  role?: string;
  time: string;
  content: string;
  isVerified?: boolean;
  replies?: Comment[];   // <-- nested replies
}

interface CommentSectionProps {
  comments: Comment[];
  postId: string;
  currentUserId: string;
  postOwnerId: string;
  onAddComment: (postId: string, text: string, parentCommentId?: string) => void;
  onUpdateComment: (postId: string, commentId: string, text: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  postId,
  currentUserId,
  postOwnerId,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}) => {
  const [text, setText] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<string | undefined>();
  const [editingCommentId, setEditingCommentId] = React.useState<string | undefined>();

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingCommentId) {
      onUpdateComment(postId, editingCommentId, trimmed);
    } else {
      onAddComment(postId, trimmed, replyTo);
    }

    setText('');
    setReplyTo(undefined);
    setEditingCommentId(undefined);
  };

  const activeLabel = (() => {
    if (editingCommentId) return 'Editing comment';
    if (replyTo) return 'Replying to a comment';
    return 'Add a comment...';
  })();

  const renderComment = (comment: Comment, level: number = 0): React.ReactNode => {
    const canModify =
      comment.commenterId === currentUserId || postOwnerId === currentUserId;
    const isReply = level > 0;

    return (
      <View key={comment.id} style={[styles.commentRow, isReply && styles.replyRow]}>
        {isReply && (
          <View style={styles.threadColumn}>
            <View style={styles.threadDot} />
            <View style={styles.threadLine} />
          </View>
        )}
        <View style={styles.commentContent}>
          <CommentItem
            avatar={comment.avatar}
            name={comment.name}
            role={comment.role}
            time={comment.time}
            content={comment.content}
            isVerified={comment.isVerified}
            canEdit={canModify}
            canDelete={canModify}
            isReply={isReply}
            onReply={() => {
              setReplyTo(comment.id);
              setEditingCommentId(undefined);
              setText('');
            }}
            onEdit={() => {
              if (!canModify) return;
              setEditingCommentId(comment.id);
              setReplyTo(undefined);
              setText(comment.content);
            }}
            onDelete={() => {
              if (!canModify) return;
              onDeleteComment(postId, comment.id);
            }}
          />
          {comment.replies?.map(child => renderComment(child, level + 1))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Comments</Text>
      
      <View style={styles.list}>
        {comments.map(c => renderComment(c))}
      </View>

      <View style={styles.inputContainer}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} 
          style={styles.currentUserAvatar} 
        />
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder={activeLabel}
            style={styles.input}
            placeholderTextColor={Colors.inactive}
            value={text}
            onChangeText={setText}
          />
        </View>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send" size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  header: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Layout.spacing.md,
  },
  list: {
    gap: 8,
    marginBottom: Layout.spacing.md,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyRow: {
    marginLeft: 8,                 // overall indent for replies
  },
  threadColumn: {
    width: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  threadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A855F7',
    marginBottom: 2,
  },
  threadLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  commentContent: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark,
    marginRight: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C084FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
