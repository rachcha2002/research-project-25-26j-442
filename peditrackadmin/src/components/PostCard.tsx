import { Check, RotateCcw } from 'lucide-react';

interface Post {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  description: string;
  image?: string;
  status: 'pending' | 'approved';
  timestamp: string;
}

interface PostCardProps {
  post: Post;
  onApprove: (postId: string) => void;
  onRevert: (postId: string) => void;
}

export default function PostCard({ post, onApprove, onRevert }: PostCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
          {post.user.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg dark:text-white">{post.user.name}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{post.timestamp}</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">{post.description}</p>
        </div>
      </div>

      {post.image && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-auto object-contain"
            onError={(e) => {
              console.error('Image failed to load:', post.image);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        {post.status === 'pending' && (
          <button
            onClick={() => onApprove(post.id)}
            className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
          >
            <Check className="w-4 h-4" />
            <span>Approve</span>
          </button>
        )}
        
        {post.status === 'approved' && (
          <button
            onClick={() => onRevert(post.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Revert</span>
          </button>
        )}
      </div>
    </div>
  );
}