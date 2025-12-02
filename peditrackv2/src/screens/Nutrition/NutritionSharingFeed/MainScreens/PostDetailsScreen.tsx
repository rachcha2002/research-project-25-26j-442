import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Modal, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { TopNavBar } from '../SubComponents/TopNavBar';
import { FeedPostCard } from '../SubComponents/FeedPostCard';
import { CommentSection } from '../SubComponents/CommentSection';
import { CreatePostCard } from '../SubComponents/CreatePostCard';

interface PostDetailsScreenProps {
  post: any;
  onBackPress: () => void;
}

const MOCK_COMMENTS = [
  // ... existing comments
  {
    id: '1',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    name: 'Dr. Sarah Chen',
    role: 'Nutritionist',
    time: '4 hours ago',
    content: 'Excellent choice! Avocados are packed with healthy fats essential for brain development. Try adding a bit of mashed sweet potato for extra nutrients! ✅',
    isVerified: true,
  },
  // ...
];

export const PostDetailsScreen: React.FC<PostDetailsScreenProps> = ({ post, onBackPress }) => {
  const [isEditVisible, setIsEditVisible] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    // In a real app, delete the post here
    console.log('Deleting post:', post.id);
    onBackPress(); // Go back after delete
  };

  const handleEdit = () => {
    setIsEditVisible(true);
  };

  const handleUpdatePost = (updatedPost: any) => {
    console.log('Updating post:', updatedPost);
    // In a real app, update the post here
    setIsEditVisible(false);
  };

  return (
    <View style={styles.container}>
      <TopNavBar 
        title="Post Details"
        onBackPress={onBackPress}
        onAddPress={() => {}} 
        profileImage="" 
        showLogo={false}
        showRightSection={false}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FeedPostCard 
            {...post} 
            isOwner={true} // Assuming user is owner for this task
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <CommentSection comments={MOCK_COMMENTS} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CreatePostCard 
        visible={isEditVisible} 
        onClose={() => setIsEditVisible(false)}
        initialPost={post}
        onSubmit={handleUpdatePost}
      />

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>Delete Post?</Text>
            <Text style={styles.deleteMessage}>
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 14,
    color: Colors.inactive,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
