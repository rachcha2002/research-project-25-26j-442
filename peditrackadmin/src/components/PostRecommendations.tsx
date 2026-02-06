import { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Post {
  PostID: string;
  UserID: string;
  PostUrl: string | null;
  Description: string;
  Tags: string[];
  PostedTime: string;
  ApprovementReq: boolean;
  Approved: boolean;
}

interface PostData {
  post: Post;
  engagement: {
    PostID: string;
    LikedBy: string[];
    DislikedBy: string[];
  };
  comments: any[];
}

interface DisplayPost {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  description: string;
  image?: string;
  status: 'pending' | 'approved';
  timestamp: string;
  originalData: Post;
}

const POST_URL = import.meta.env.VITE_POST_URL;
const FILE_BASE_URL = `${POST_URL.replace('/posts', '')}/file/uploads/`;

export default function PostRecommendations() {
  const { doctor } = useAuth();
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    fetchPosts();
  }, [doctor]);

  const fetchPosts = async () => {
    if (!doctor?.doctor_id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${POST_URL}/getpostsrequiringapproval/${doctor.doctor_id}`);
      
      const formattedPosts: DisplayPost[] = response.data.map((item: PostData) => ({
        id: item.post.PostID,
        user: {
          name: item.post.UserID,
          avatar: item.post.UserID.substring(0, 2).toUpperCase(),
        },
        description: item.post.Description || '',
        image: item.post.PostUrl ? `${FILE_BASE_URL}${item.post.PostUrl}` : undefined,
        status: item.post.Approved ? 'approved' : 'pending',
        timestamp: new Date(item.post.PostedTime).toLocaleString(),
        originalData: item.post,
      }));
      
      console.log('Fetched posts:', formattedPosts);
      console.log('Sample image URL:', formattedPosts[0]?.image);
      setPosts(formattedPosts);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    if (!doctor?.doctor_id) return;

    try {
      await axios.put(`${POST_URL}/approvepost`, {
        DoctorID: doctor.doctor_id,
        PostID: postId,
        Approved: true,
      });

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, status: 'approved' as const } : post
        )
      );
    } catch (err: any) {
      console.error('Error approving post:', err);
      alert(err.response?.data?.message || 'Failed to approve post');
    }
  };

  const handleRevert = async (postId: string) => {
    if (!doctor?.doctor_id) return;

    try {
      await axios.put(`${POST_URL}/approvepost`, {
        DoctorID: doctor.doctor_id,
        PostID: postId,
        Approved: false,
      });

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, status: 'pending' as const } : post
        )
      );
    } catch (err: any) {
      console.error('Error reverting post:', err);
      alert(err.response?.data?.message || 'Failed to revert post');
    }
  };

  const pendingPosts = posts.filter(post => post.status === 'pending');
  const approvedPosts = posts.filter(post => post.status === 'approved');

  const displayPosts = activeTab === 'approved' ? approvedPosts : pendingPosts;

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

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
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {displayPosts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'approved' 
                ? 'No recommended posts yet' 
                : 'No posts to review'}
            </p>
          </div>
        ) : (
          displayPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onApprove={handleApprove}
              onRevert={handleRevert}
            />
          ))
        )}
      </div>
    </div>
  );
}