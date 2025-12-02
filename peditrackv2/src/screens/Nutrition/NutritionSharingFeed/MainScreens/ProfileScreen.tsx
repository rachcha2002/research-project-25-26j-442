import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { ProfileHeader } from '../SubComponents/ProfileHeader';
import { ProfileStats } from '../SubComponents/ProfileStats';
import { ProfileTabs } from '../SubComponents/ProfileTabs';
import { ProfileGrid } from '../SubComponents/ProfileGrid';

import { FollowListScreen } from './FollowListScreen';

import { PostDetailsScreen } from './PostDetailsScreen';

interface ProfileScreenProps {
  onBackPress: () => void;
  user?: any; // Optional user prop to display other profiles
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBackPress, user: initialUser }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('saved');
  const [showFollowList, setShowFollowList] = useState(false);
  const [followListTab, setFollowListTab] = useState<'followers' | 'following'>('followers');
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const currentUser = {
    name: 'Emma Rodriguez',
    role: 'Parent',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    stats: {
      posts: 248,
      followers: '2.4K',
      following: 892,
    },
  };

  const user = initialUser || currentUser;

  const images = [
    'https://images.unsplash.com/photo-1519864600265-abb23847ef2c',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601',
  ];

  if (showFollowList) {
    return (
      <FollowListScreen 
        initialTab={followListTab}
        onBackPress={() => setShowFollowList(false)}
        userName={user.name}
      />
    );
  }

  if (selectedPost) {
    return (
      <PostDetailsScreen 
        post={selectedPost}
        onBackPress={() => setSelectedPost(null)}
      />
    );
  }

  const handlePostPress = (index: number) => {
    // In a real app, we would fetch the post details by ID or pass the full post object
    // For now, we'll create a mock post based on the selected image
    setSelectedPost({
      id: `post-${index}`,
      name: user.name,
      role: user.role,
      time: '5 hours ago',
      content: 'My 9-month-old LOVED this avocado banana combo today! First time trying avocado and finished the whole bowl 🥑🍌 Any other avocado recipe suggestions?',
      tags: ['#FirstFoods', '#9months', '#HealthyFats'],
      image: images[index],
      avatar: user.avatar,
      stats: { likes: 89, comments: 24, shares: 0 },
      isApproved: true,
      approvedBy: 'Dr. Sarah Chen'
    });
  };

  return (
    <View style={styles.container}>
      <ProfileHeader 
        onBackPress={onBackPress} 
        onSettingsPress={() => {}} 
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileStats 
          user={user} 
          onFollowersPress={() => {
            setFollowListTab('followers');
            setShowFollowList(true);
          }}
          onFollowingPress={() => {
            setFollowListTab('following');
            setShowFollowList(true);
          }}
        />
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <ProfileGrid images={images} onPostPress={handlePostPress} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});
