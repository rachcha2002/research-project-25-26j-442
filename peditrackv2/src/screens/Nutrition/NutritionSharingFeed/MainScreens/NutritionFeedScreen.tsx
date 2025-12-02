import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { TopNavBar } from '../SubComponents/TopNavBar';
import { Searchbar } from '../SubComponents/Searchbar';
import { FeedPostCard } from '../SubComponents/FeedPostCard';
import { CreatePostCard } from '../SubComponents/CreatePostCard';
import { ProfileScreen } from './ProfileScreen';
import { Colors } from '../../../../constants/Colors';
import { Layout } from '../../../../constants/Layout';

const POSTS = [
  {
    id: '1',
    name: "Dr. Sarah Chen",
    role: "Nutritionist",
    time: "2 hours ago",
    content: "Great iron-rich meal idea for 6-8 month olds! Spinach and lentil purée with a touch of lemon for vitamin C absorption. Remember: iron + vitamin C = better absorption! 🥬",
    tags: ['#IronRich', '#6months+', '#LentilRecipe'],
    image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    stats: { likes: 124, comments: 2, shares: 18 }
  },
  {
    id: '2',
    name: "Emma Rodriguez",
    role: "Parent",
    time: "5 hours ago",
    content: "My 9-month-old LOVED this avocado banana combo today! First time trying avocado and finished the whole bowl 🥑🍌 Any other avocado recipe suggestions?",
    tags: ['#FirstFoods', '#9months', '#HealthyFats'],
    avatar: "https://randomuser.me/api/portraits/women/26.jpg",
    stats: { likes: 0, comments: 0, shares: 0 },
    isApproved: true,
    approvedBy: "Dr. Sarah Chen"
  },
  {
    id: '3',
    name: "Michael Chang",
    role: "Parent",
    time: "1 day ago",
    content: "Made these sweet potato pancakes for breakfast. They were a hit! 🥞 Just mashed sweet potato, egg, and a little cinnamon.",
    tags: ['#Breakfast', '#SweetPotato', '#ToddlerMeals'],
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    stats: { likes: 45, comments: 12, shares: 5 },
    isApproved: true,
    approvedBy: "Nutritionist Maya"
  },
  {
    id: '4',
    name: "Lisa Thompson",
    role: "Parent",
    time: "2 days ago",
    content: "Is it okay to give strawberries to a 7-month-old? I've heard mixed things about allergies. 🍓",
    tags: ['#Allergies', '#Questions', '#7months'],
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    stats: { likes: 8, comments: 15, shares: 1 }
  },
  {
    id: '5',
    name: "Nutritionist Maya",
    role: "Nutritionist",
    time: "3 days ago",
    content: "Hydration tip: If your little one refuses water, try adding a slice of cucumber or strawberry for a hint of flavor! 💧🥒",
    tags: ['#Hydration', '#Tips', '#HealthyHabits'],
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    stats: { likes: 89, comments: 6, shares: 24 }
  }
];

export function NutritionFeedScreen() {
  const [isCreatePostVisible, setCreatePostVisible] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentView, setCurrentView] = React.useState<'feed' | 'profile'>('feed');
  const [activeTab, setActiveTab] = React.useState<'friends' | 'forYou'>('friends');
  const router = useRouter();

  const filteredPosts = POSTS.filter(post => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = (
      post.content.toLowerCase().includes(query) ||
      post.name.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    );
    
    // In a real app, we would filter by friends vs for you here
    // For now, we'll just show all posts but maybe randomize or filter slightly if needed
    // or just rely on the "Add Friend" button difference
    return matchesQuery;
  });

  if (currentView === 'profile') {
    return <ProfileScreen onBackPress={() => setCurrentView('feed')} />;
  }

  return (
    <View style={styles.container}>
      <TopNavBar
        onBackPress={() => router.back()}
        onAddPress={() => setCreatePostVisible(true)}
        onProfilePress={() => setCurrentView('profile')}
        profileImage="https://randomuser.me/api/portraits/women/44.jpg"
        title="Nutrition share feed"
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Searchbar value={searchQuery} onChangeText={setSearchQuery} />
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, activeTab === 'friends' && styles.activeToggleButton]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.toggleText, activeTab === 'friends' && styles.activeToggleText]}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, activeTab === 'forYou' && styles.activeToggleButton]}
            onPress={() => setActiveTab('forYou')}
          >
            <Text style={[styles.toggleText, activeTab === 'forYou' && styles.activeToggleText]}>For You</Text>
          </TouchableOpacity>
        </View>

        {filteredPosts.map(post => (
          <FeedPostCard
            key={post.id}
            {...post}
            showAddFriend={activeTab === 'forYou'}
            onAddFriend={() => console.log('Add friend:', post.name)}
          />
        ))}
      </ScrollView>
      <CreatePostCard 
        visible={isCreatePostVisible} 
        onClose={() => setCreatePostVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 8,
  },
  title: {
    color: Colors.primary.DEFAULT,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: Layout.spacing.lg,
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: 100,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 25,
    padding: 4,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeToggleButton: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.inactive,
  },
  activeToggleText: {
    color: Colors.white,
  },
});
