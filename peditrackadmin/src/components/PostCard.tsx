import { Check, X, RotateCcw } from 'lucide-react';

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

interface PostCardProps {
  post: Post;
  onApprove: (postId: number) => void;
  onReject: (postId: number) => void;
  onRevert: (postId: number) => void;
}

export default function PostCard({ post, onApprove, onReject, onRevert }: PostCardProps) {
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
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        {post.status === 'pending' && (
          <>
            <button
              onClick={() => onApprove(post.id)}
              className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
            >
              <Check className="w-4 h-4" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => onReject(post.id)}
              className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              <X className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </>
        )}
        
        {post.status === 'approved' && (
          <>
            <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="w-5 h-5" />
              <span>Approved</span>
            </span>
            <button
              onClick={() => onRevert(post.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Revert</span>
            </button>
          </>
        )}

        {post.status === 'rejected' && (
          <>
            <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <X className="w-5 h-5" />
              <span>Rejected</span>
            </span>
            <button
              onClick={() => onRevert(post.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Revert</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}