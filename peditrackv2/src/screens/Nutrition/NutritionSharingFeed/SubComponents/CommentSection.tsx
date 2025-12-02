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
  role?: string;
  time: string;
  content: string;
  isVerified?: boolean;
}

interface CommentSectionProps {
  comments: Comment[];
}

export const CommentSection: React.FC<CommentSectionProps> = ({ comments }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Comments ({comments.length})</Text>
      
      <View style={styles.list}>
        {comments.map(comment => (
          <CommentItem key={comment.id} {...comment} />
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} 
          style={styles.currentUserAvatar} 
        />
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Add a comment..."
            style={styles.input}
            placeholderTextColor={Colors.inactive}
          />
          <TouchableOpacity>
            <Ionicons name="happy-outline" size={20} color={Colors.primary.light} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.sendButton}>
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
    backgroundColor: '#C084FC', // Light purple color from design
    alignItems: 'center',
    justifyContent: 'center',
  },
});
