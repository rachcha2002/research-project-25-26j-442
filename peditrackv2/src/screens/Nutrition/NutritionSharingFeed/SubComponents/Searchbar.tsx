import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';
// ...existing code...

interface SearchbarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const Searchbar: React.FC<SearchbarProps> = ({ value, onChangeText }) => (
  <View style={styles.card}>
    <Ionicons name="search-outline" size={20} color={Colors.gray.dark} style={styles.searchIcon} />
    <TextInput
      style={styles.input}
      placeholder="Search..."
      placeholderTextColor={Colors.inactive}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginVertical: Layout.spacing.md,
    shadowColor: Colors.gray.dark,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark,
    paddingRight: Layout.spacing.md,
  },
  searchIcon: {
    marginRight: Layout.spacing.sm,
  },
});