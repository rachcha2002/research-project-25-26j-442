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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';

interface CreatePostCardProps {
  visible: boolean;
  onClose: () => void;
  initialPost?: {
    content: string;
    tags: string[];
    image?: string;
  };
  onSubmit?: (post: any) => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({ visible, onClose, initialPost, onSubmit }) => {
  const [content, setContent] = useState(initialPost?.content || '');
  const [allowRecommendations, setAllowRecommendations] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialPost?.tags || []);

  // Reset state when visible changes or initialPost changes
  React.useEffect(() => {
    if (visible) {
      setContent(initialPost?.content || '');
      setSelectedTags(initialPost?.tags || []);
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

  const handleSubmit = () => {
    onSubmit?.({
      content,
      tags: selectedTags,
      // ... other fields
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
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.userName}>Jessica Miller</Text>
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
          <TouchableOpacity style={styles.uploadArea}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="image-outline" size={32} color={Colors.primary.DEFAULT} />
            </View>
            <Text style={styles.uploadText}>Tap to upload photo</Text>
            <Text style={styles.uploadSubtext}>JPG, PNG up to 10MB</Text>
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
