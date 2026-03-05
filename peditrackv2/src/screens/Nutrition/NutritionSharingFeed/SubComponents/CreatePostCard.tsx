import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';
import { useAuth } from '../../../../contexts/AuthContext';

type UploadFile = { uri: string; type: string; name: string };

interface CreatePostCardProps {
  visible: boolean;
  onClose: () => void;
  initialPost?: {
    content: string;
    tags: string[];
    image?: string;
  };
  onSubmit?: (post: {
    content: string;
    tags: string[];
    allowRecommendations: boolean;
    file?: UploadFile;
  }) => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({ visible, onClose, initialPost, onSubmit }) => {
  const { user } = useAuth();
  const displayName = user?.name?.trim() || 'User';
  const displayAvatar = user?.profilePicture || '';
  const profileInitial = displayName.charAt(0).toUpperCase() || '?';
  const [content, setContent] = useState(initialPost?.content || '');
  const [allowRecommendations, setAllowRecommendations] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialPost?.tags || []);
  const [file, setFile] = useState<UploadFile | undefined>(undefined);

  // Reset state when visible changes or initialPost changes
  React.useEffect(() => {
    if (visible) {
      setContent(initialPost?.content || '');
      setSelectedTags(initialPost?.tags || []);
      setFile(undefined);
    }
  }, [visible, initialPost]);

  const tags = [
    '#AllergySafe',
    '#IronRich',
    '#Protein',
    '#6months',
    '#12months',
    '#VitaminD',
    '#Calcium',
    '#FirstFoods',
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

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
      setFile({ uri, type, name });
    }
  };

  const handleSubmit = () => {
    onSubmit?.({
      content,
      tags: selectedTags,
      allowRecommendations,
      file,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{initialPost ? 'Edit Post' : 'Create Post'}</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* User Info */}
          <View style={styles.userInfo}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{profileInitial}</Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userRole}>Sharing to Community Feed</Text>
            </View>
          </View>

          {/* Input */}
          <Text style={styles.sectionLabel}>What would you like to share?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share a meal idea, nutrition tip, or question..."
            placeholderTextColor={Colors.inactive}
            multiline
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />

          {/* Photo Upload */}
          <Text style={styles.sectionLabel}>Add Food Photo (Optional)</Text>
          <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
            {file ? (
              <>
                <Image source={{ uri: file.uri }} style={{ width: 120, height: 120, borderRadius: 8, marginBottom: 8 }} />
                <Text style={styles.uploadText}>Tap to change photo</Text>
              </>
            ) : (
              <>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="image-outline" size={32} color={Colors.primary.DEFAULT} />
                </View>
                <Text style={styles.uploadText}>Tap to upload photo</Text>
                <Text style={styles.uploadSubtext}>JPG, PNG up to 10MB</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Tags */}
          <Text style={styles.sectionLabel}>Add Tags</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  selectedTags.includes(tag) && styles.tagSelected,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recommendations Toggle */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Allow Recommendations</Text>
              <Text style={styles.toggleSubtext}>
                Let nutritionists recommend or provide feedback
              </Text>
            </View>
            <Switch
              value={allowRecommendations}
              onValueChange={setAllowRecommendations}
              trackColor={{ false: Colors.gray.light, true: Colors.primary.DEFAULT }}
              thumbColor={Colors.white}
            />
          </View>
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>{initialPost ? 'Update Post' : 'Share Post'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  backButton: {
    padding: 8,
    backgroundColor: Colors.gray.light,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Layout.spacing.md,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Layout.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary.DEFAULT}20`,
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  userRole: {
    fontSize: 12,
    color: Colors.inactive,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  textInput: {
    backgroundColor: '#F3F4F6', // Light gray background
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    height: 120,
    fontSize: 14,
    color: Colors.dark,
    marginBottom: Layout.spacing.lg,
  },
  uploadArea: {
    backgroundColor: '#F3F4F6', // Light gray background
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: Layout.spacing.lg,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.sm,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: Colors.inactive,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Layout.spacing.xl,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.white,
  },
  tagSelected: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: '#F5F3FF', // Light purple
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary.DEFAULT,
  },
  tagTextSelected: {
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.xxl,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 12,
    color: Colors.inactive,
  },
  footer: {
    padding: Layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  submitButton: {
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
