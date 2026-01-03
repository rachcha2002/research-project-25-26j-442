import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../../constants/Colors';
import { TopNavBar } from '../SubComponents/TopNavBar';
import { FeedPostCard } from '../SubComponents/FeedPostCard';
import { CommentSection } from '../SubComponents/CommentSection';

import { updatePost, FILE_BASE_URL } from '../../../../services/SocialService';

type UploadFile = { uri: string; type: string; name: string };

interface PostDetailsScreenProps {
  post: any; // UI post object passed from Feed/Profile
  currentUserId: string;
  startInEditMode?: boolean;
  onBackPress: () => void;
  onPostUpdated?: () => void; // parent can refetch feed/profile
}

// Replace MOCK_COMMENTS definition
const MOCK_COMMENTS: any[] = [
  {
    id: '1',
    commenterId: 'dr_sarah_chen',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    name: 'Dr. Sarah Chen',
    role: 'Nutritionist',
    time: '4 hours ago',
    content:
      'Excellent choice! Avocados are packed with healthy fats essential for brain development. Try adding a bit of mashed sweet potato for extra nutrients! ✅',
    isVerified: true,
    replies: [],
  },
];

export const PostDetailsScreen: React.FC<PostDetailsScreenProps> = ({
  post,
  currentUserId,
  startInEditMode = false,
  onBackPress,
  onPostUpdated,
}) => {
  const [postState, setPostState] = useState(post);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [content, setContent] = useState(post.content || '');
  const [tagsText, setTagsText] = useState((post.tags || []).join(', '));
  const [allowRecommendations, setAllowRecommendations] = useState(
    post.allowRecommendations ?? true
  );
  const [imageUri, setImageUri] = useState<string | undefined>(post.image);
  const [newFile, setNewFile] = useState<UploadFile | undefined>(undefined);

  // when post prop changes (e.g. re-open), reset local state
  useEffect(() => {
    setPostState(post);
    setContent(post.content || '');
    setTagsText((post.tags || []).join(', '));
    setAllowRecommendations(post.allowRecommendations ?? true);
    setImageUri(post.image);
    setNewFile(undefined);
    setIsEditing(startInEditMode);
  }, [post, startInEditMode]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permission to access gallery was denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = uri.split('/').pop() || 'upload.jpg';
      const type = asset.mimeType || 'image/jpeg';
      setNewFile({ uri, type, name });
      setImageUri(uri);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const tagsArray = tagsText
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);

      const updated = await updatePost(
        currentUserId,
        postState.postId,
        content,
        tagsArray,
        allowRecommendations,
        newFile
      );

      const updatedUi = {
        ...postState,
        content: updated.Description || '',
        tags: updated.Tags || [],
        time: new Date(updated.PostedTime).toLocaleString(),
        image: updated.PostUrl ? FILE_BASE_URL + updated.PostUrl : undefined,
        allowRecommendations: !!updated.ApprovementReq,
        isApproved: updated.Approved,
      };

      setPostState(updatedUi);
      setIsEditing(false);
      setNewFile(undefined);

      // let parent refresh feed/profile
      onPostUpdated?.();
    } catch (e) {
      console.error('Failed to update post', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setContent(postState.content || '');
    setTagsText((postState.tags || []).join(', '));
    setAllowRecommendations(postState.allowRecommendations ?? true);
    setImageUri(postState.image);
    setNewFile(undefined);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    // In a real app, delete the post here
    console.log('Deleting post:', post.id);
    onBackPress(); // Go back after delete
  };

  const isOwner = postState.postOwnerId === currentUserId;

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
          {/* Edit / View action row */}
          {isOwner && (
            <View style={styles.actionRow}>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.headerCancelButton]}
                    onPress={handleCancelEdit}
                    disabled={saving}
                  >
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {isEditing ? (
            // -------- EDIT MODE --------
            <View style={styles.editContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                style={styles.textArea}
                placeholder="Describe your meal..."
                multiline
              />

              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                value={tagsText}
                onChangeText={setTagsText}
                style={styles.textInput}
                placeholder="e.g. high-protein, breakfast"
              />

              <Text style={styles.label}>Allow Recommendations</Text>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() =>
                  setAllowRecommendations((prev: boolean) => !prev)
                }
              >
                <View
                  style={[
                    styles.toggleIndicator,
                    allowRecommendations && styles.toggleOn,
                  ]}
                />
                <Text style={styles.toggleText}>
                  {allowRecommendations ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Photo</Text>
              <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
                {imageUri ? (
                  <>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.previewImage}
                    />
                    <Text style={styles.uploadText}>Tap to change photo</Text>
                  </>
                ) : (
                  <Text style={styles.uploadText}>Tap to add photo</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // -------- VIEW MODE --------
            <>
              {/* Do NOT show 3-dot edit/delete in this screen */}
              <FeedPostCard
                {...postState}
                isOwner={false}
                onEdit={undefined}
                onDelete={undefined}
              />
              <CommentSection
                {...({
                  postId: postState.postId,
                  comments: MOCK_COMMENTS,
                  currentUserId,
                  postOwnerId: postState.postOwnerId,
                  onAddComment: () => {},
                  onUpdateComment: () => {},
                  onDeleteComment: () => {},
                } as any)}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  saveButton: {
    // Colors.success doesn't exist; use a green hex
    backgroundColor: '#22C55E',
  },
  // rename header cancel to avoid duplicate key with modal's cancelButton
  headerCancelButton: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  editContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    // Colors.text doesn't exist; fallback to dark or hex
    color: Colors.dark,
    marginTop: 8,
  },
  textArea: {
    minHeight: 80,
    borderRadius: 8,
    borderWidth: 1,
    // Colors.border doesn't exist; use hex
    borderColor: '#DDDDDD',
    padding: 10,
    textAlignVertical: 'top',
  },
  textInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingHorizontal: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleIndicator: {
    width: 32,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  toggleOn: {
    // Colors.primary.LIGHT doesn't exist; use primary.light
    backgroundColor: Colors.primary.light,
  },
  toggleText: {
    fontSize: 14,
  },
  uploadArea: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 13,
    color: Colors.inactive,
    textAlign: 'center',
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
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
  // this cancelButton is for the modal; header cancel uses headerCancelButton
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
