import { useState, useEffect } from 'react';
import { getPostsRequiringApproval, approvePost, PostData, getFileUrl } from '../utils/recommendation';
import { useAuth } from '../context/AuthContext';

export interface DisplayPost {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  description: string;
  image?: string;
  status: 'pending' | 'approved';
  timestamp: string;
  originalData: PostData['post'];
}

export const usePostRecommendations = () => {
  const { doctor } = useAuth();
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    if (!doctor?.doctor_id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getPostsRequiringApproval(doctor.doctor_id);
      
      const formattedPosts: DisplayPost[] = data.map((item) => ({
        id: item.post.PostID,
        user: {
          name: item.post.UserID,
          avatar: item.post.UserID.substring(0, 2).toUpperCase(),
        },
        description: item.post.Description || '',
        image: getFileUrl(item.post.PostUrl),
        status: item.post.Approved ? 'approved' : 'pending',
        timestamp: new Date(item.post.PostedTime).toLocaleString(),
        originalData: item.post,
      }));
      
      setPosts(formattedPosts);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [doctor]);

  const handleApprove = async (postId: string) => {
    if (!doctor?.doctor_id) return;

    try {
      await approvePost(doctor.doctor_id, postId, true);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, status: 'approved' as const } : post
        )
      );
    } catch (err: any) {
      console.error('Error approving post:', err);
      throw new Error(err.response?.data?.message || 'Failed to approve post');
    }
  };

  const handleRevert = async (postId: string) => {
    if (!doctor?.doctor_id) return;

    try {
      await approvePost(doctor.doctor_id, postId, false);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, status: 'pending' as const } : post
        )
      );
    } catch (err: any) {
      console.error('Error reverting post:', err);
      throw new Error(err.response?.data?.message || 'Failed to revert post');
    }
  };

  return {
    posts,
    loading,
    error,
    handleApprove,
    handleRevert,
    refetch: fetchPosts,
  };
};