import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// ...existing code...
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';
// ...existing code...

interface FloatingActionButtonProps {
  onPress: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onPress }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
    <Ionicons name="add" size={32} color={Colors.white} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Layout.spacing.xl,
    bottom: Layout.spacing.xl,
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: Layout.borderRadius.full,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: Colors.primary.DEFAULT,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
