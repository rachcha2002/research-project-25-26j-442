import { useState } from 'react';
import PostCard from './PostCard';

interface Post {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  description: string;
  image?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

const mockPosts: Post[] = [
  {
    id: 1,
    user: {
      name: 'Sarah Johnson',
      avatar: 'SJ',
    },
    description: 'My 3-year-old just said the cutest thing today! We were at the park and she made a new friend. Watching her social skills develop is amazing. Any tips for playdates? 🥰',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop',
    status: 'pending',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    user: {
      name: 'Michael Chen',
      avatar: 'MC',
    },
    description: 'Looking for advice on potty training for my 2.5-year-old. We started last week and it\'s been challenging but rewarding. What worked best for your little ones?',
    status: 'pending',
    timestamp: '3 hours ago',
  },
  {
    id: 3,
    user: {
      name: 'Emily Rodriguez',
      avatar: 'ER',
    },
    description: 'Celebrated my baby\'s 4th birthday today! Time flies so fast. She wanted a princess-themed party and loved every moment. Grateful for these precious memories. 🎂👑',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop',
    status: 'pending',
    timestamp: '5 hours ago',
  },
  {
    id: 4,
    user: {
      name: 'David Thompson',
      avatar: 'DT',
    },
    description: 'My 5-year-old starts kindergarten next week! Feeling emotional but excited. Any advice from moms who\'ve been through this transition?',
    status: 'approved',
    timestamp: '1 day ago',
  },
  {
    id: 5,
    user: {
      name: 'Lisa Martinez',
      avatar: 'LM',
    },
    description: 'Found the perfect healthy snack recipe that my picky 3-year-old actually loves! Made with bananas and oats. Happy to share the recipe if anyone\'s interested! 🍌',
    image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=600&h=400&fit=crop',
    status: 'approved',
    timestamp: '1 day ago',
  },
  {
    id: 6,
    user: {
      name: 'Jennifer Adams',
      avatar: 'JA',
    },
    description: 'Teaching my 4-year-old to ride a bike without training wheels. She\'s so brave! Lots of falls but she keeps getting back up. So proud of her determination! 🚲',
    status: 'approved',
    timestamp: '2 days ago',
  },
  {
    id: 7,
    user: {
      name: 'Amanda Foster',
      avatar: 'AF',
    },
    description: 'Bedtime stories with my 2-year-old are my favorite part of the day. We just finished reading The Very Hungry Caterpillar for the 100th time! 📚',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop',
    status: 'pending',
    timestamp: '3 hours ago',
  },
  {
    id: 8,
    user: {
      name: 'Rachel Kim',
      avatar: 'RK',
    },
    description: 'My 5-year-old asked me where babies come from today. Wasn\'t prepared for that conversation! How do other moms handle these questions at this age?',
    status: 'approved',
    timestamp: '1 day ago',
  },
  {
    id: 9,
    user: {
      name: 'Jessica Brown',
      avatar: 'JB',
    },
    description: 'Inappropriate content that violates community guidelines.',
    status: 'rejected',
    timestamp: '2 days ago',
  },
  {
    id: 10,
    user: {
      name: 'Karen Wilson',
      avatar: 'KW',
    },
    description: 'Spam post promoting products not relevant to parenting.',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&h=400&fit=crop',
    status: 'rejected',
    timestamp: '3 days ago',
  },
];

export default function PostRecommendations() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const handleApprove = (postId: number) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, status: 'approved' } : post
      )
    );
  };

  const handleReject = (postId: number) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, status: 'rejected' } : post
      )
    );
  };

  const handleRevert = (postId: number) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, status: 'pending' } : post
      )
    );
  };

  const pendingPosts = posts.filter(post => post.status === 'pending');
  const approvedPosts = posts.filter(post => post.status === 'approved');
  const rejectedPosts = posts.filter(post => post.status === 'rejected');

  const displayPosts = activeTab === 'approved' ? approvedPosts : activeTab === 'rejected' ? rejectedPosts : pendingPosts;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl mb-2 dark:text-white">Post Recommendations</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and approve posts from mothers with babies aged 2-5 years</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 transition-colors relative ${
              activeTab === 'pending'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            To Be Recommended
            {pendingPosts.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                {pendingPosts.length}
              </span>
            )}
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-6 py-3 transition-colors relative ${
              activeTab === 'approved'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Recommended
            {approvedPosts.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                {approvedPosts.length}
              </span>
            )}
            {activeTab === 'approved' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-6 py-3 transition-colors relative ${
              activeTab === 'rejected'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Not Recommended
            {rejectedPosts.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                {rejectedPosts.length}
              </span>
            )}
            {activeTab === 'rejected' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {displayPosts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'approved' 
                ? 'No recommended posts yet' 
                : activeTab === 'rejected'
                ? 'No rejected posts'
                : 'No posts to review'}
            </p>
          </div>
        ) : (
          displayPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onApprove={handleApprove}
              onReject={handleReject}
              onRevert={handleRevert}
            />
          ))
        )}
      </div>
    </div>
  );
}