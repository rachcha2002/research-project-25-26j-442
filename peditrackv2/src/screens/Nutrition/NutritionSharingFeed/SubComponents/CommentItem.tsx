import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';

interface CommentItemProps {
  avatar: string;
  name: string;
  role?: string;
  time: string;
  content: string;
  isVerified?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isReply?: boolean;              // <-- NEW
}

export const CommentItem: React.FC<CommentItemProps> = ({
  avatar,
  name,
  role,
  time,
  content,
  isVerified,
  canEdit,
  canDelete,
  onReply,
  onEdit,
  onDelete,
  isReply,                        // <-- NEW
}) => {
  const isNutritionist = role === 'Nutritionist';

  return (
    <View style={[
      styles.container,
      isNutritionist && styles.nutritionistContainer,
      isReply && styles.replyContainer       // <-- NEW
    ]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          {isVerified && (
            <Ionicons 
              name="checkmark-circle" 
              size={14} 
              color="#4CAF50" 
              style={styles.verifiedBadge} 
            />
          )}
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              {role && (
                <View style={[
                  styles.roleBadge,
                  isNutritionist ? styles.nutritionistBadge : styles.parentBadge
                ]}>
                  <Text style={[
                    styles.roleText,
                    isNutritionist ? styles.nutritionistText : styles.parentText
                  ]}>{role}</Text>
                </View>
              )}
            </View>
            <Text style={styles.content}>{content}</Text>
          </View>
        </View>
        <Text style={styles.time}>{time}</Text>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onReply}>
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>
        {canEdit && (
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity onPress={onDelete}>
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.white,
    marginBottom: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  nutritionistContainer: {
    backgroundColor: '#F0FDF4', // Light green background for nutritionists
    borderColor: '#DCFCE7',
  },
  replyContainer: {
    backgroundColor: '#F9FAFB',       // softer bg for replies
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    left: 22,
    backgroundColor: Colors.white,
    borderRadius: 7,
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    fontWeight: '600',
    fontSize: 13,
    color: Colors.dark,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nutritionistBadge: {
    backgroundColor: '#DCFCE7',
  },
  parentBadge: {
    backgroundColor: '#F3E8FF',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '600',
  },
  nutritionistText: {
    color: '#16A34A',
  },
  parentText: {
    color: '#9333EA',
  },
  content: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  time: {
    fontSize: 10,
    color: Colors.inactive,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionText: {
    fontSize: 11,
    color: Colors.inactive,
  },
});
