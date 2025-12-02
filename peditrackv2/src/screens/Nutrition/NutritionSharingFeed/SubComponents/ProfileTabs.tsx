import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';

interface ProfileTabsProps {
  activeTab: 'posts' | 'saved';
  onTabChange: (tab: 'posts' | 'saved') => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'posts' && styles.activeTab]} 
        onPress={() => onTabChange('posts')}
      >
        <Ionicons 
          name="grid-outline" 
          size={20} 
          color={activeTab === 'posts' ? Colors.primary.DEFAULT : Colors.inactive} 
        />
        <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'saved' && styles.activeTab]} 
        onPress={() => onTabChange('saved')}
      >
        <Ionicons 
          name="bookmark-outline" 
          size={20} 
          color={activeTab === 'saved' ? Colors.primary.DEFAULT : Colors.inactive} 
        />
        <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>Saved</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: Colors.white,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.inactive,
  },
  activeTabText: {
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
  },
});
