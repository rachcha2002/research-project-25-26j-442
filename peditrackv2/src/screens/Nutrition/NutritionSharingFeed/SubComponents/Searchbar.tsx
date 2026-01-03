import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';

interface SearchbarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFriendsPress?: () => void;
  disableFriends?: boolean;
}

export const Searchbar: React.FC<SearchbarProps> = ({
  value,
  onChangeText,
  onFriendsPress,
  disableFriends,
}) => (
  <View style={styles.container}>
    <Ionicons name="search-outline" size={18} color={Colors.inactive} style={styles.icon} />
    <TextInput
      style={styles.input}
      placeholder="Search posts..."
      placeholderTextColor={Colors.inactive}
      value={value}
      onChangeText={onChangeText}
    />
    {onFriendsPress && (
      <TouchableOpacity
        style={[styles.friendButton, disableFriends && { opacity: 0.4 }]}
        onPress={onFriendsPress}
        disabled={disableFriends}
      >
        <Ionicons name="people-outline" size={20} color={Colors.primary.DEFAULT} />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  friendButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
});