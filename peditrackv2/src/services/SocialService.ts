const API_BASE_URL = 'http://192.168.1.3:3007/api';
export const FILE_BASE_URL = 'http://192.168.1.3:3007/api/file/uploads/';

export interface Post {
    PostID: string;
    UserID: string;
    PostUrl?: string;
    Description?: string;
    Tags?: string[];
    PostedTime: string;
    ApprovementReq?: boolean;
    Approved?: boolean;
}

export interface Engagement {
    LikedBy: string[];
    DislikedBy: string[];
}

export interface Comment {
    CommentID: string;
    PostID: string;
    Comment: string;
    CommenterID: string;
    CommentTime: string;
    Reply: boolean;
    to?: string | null;
    replies?: Comment[];
}

export interface PostWithMeta {
    post: Post;
    engagement: Engagement;
    comments: Comment[];
    isSaved: boolean;
}

export interface Follow {
    followerId: string;
    followingId: string;
    followedAt: string;
}

export interface UserProfileOverview {
    userId: string;
    followersCount: number;
    followingCount: number;
    postCount: number;
    posts: PostWithMeta[];
}

/**
 * POSTS
 */

// Create a new post (with optional file)
export const createPost = async (
    UserID: string,
    Description: string,
    Tags: string[] | string,
    file?: { uri: string; type: string; name: string },
    ApprovementReq: boolean = false
): Promise<Post> => {
    const formData = new FormData();
    formData.append('UserID', UserID);
    formData.append('Description', Description);
    formData.append('Tags', Array.isArray(Tags) ? Tags.join(',') : Tags);
    formData.append('ApprovementReq', String(ApprovementReq));
    if (file) formData.append('file', file as any);

    const response = await fetch(`${API_BASE_URL}/posts/createpost`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Failed to create post');
    const data = await response.json();
    return data.post;
};

// Update an existing post (with optional new file)
export const updatePost = async (
    UserID: string,
    PostID: string,
    Description: string,
    Tags: string[] | string,
    ApprovementReq: boolean,
    file?: { uri: string; type: string; name: string },
): Promise<Post> => {
    const formData = new FormData();
    formData.append('UserID', UserID);
    formData.append('PostID', PostID);
    formData.append('Description', Description);
    formData.append('Tags', Array.isArray(Tags) ? Tags.join(',') : Tags);
    formData.append('ApprovementReq', String(ApprovementReq));
    if (file) formData.append('file', file as any);

    const response = await fetch(`${API_BASE_URL}/posts/updatepost`, {
        method: 'PUT',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to update post');
    }

    const data = await response.json();
    return data.post;
};

// Get all posts
export const getAllPosts = async (userId: string): Promise<PostWithMeta[]> => {
    const response = await fetch(
        `${API_BASE_URL}/posts/getallposts?UserID=${encodeURIComponent(userId)}`
    );
    if (!response.ok) throw new Error('Failed to fetch posts');
    return await response.json();
};

// Get saved posts for a user
export const getSavedPostsByUser = async (userId: string): Promise<PostWithMeta[]> => {
    const response = await fetch(
        `${API_BASE_URL}/posts/getsavedposts/${encodeURIComponent(userId)}`
    );
    if (!response.ok) throw new Error('Failed to fetch saved posts');
    return await response.json();
};

// Delete a post
export const deletePost = async (PostID: string, UserID: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/posts/deletepost`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ PostID, UserID }),
    });
    if (!response.ok) throw new Error('Failed to delete post');
};

// Like or dislike a post
export const updatePostEngagement = async (
    UserID: string,
    PostID: string,
    action: 'like' | 'dislike'
): Promise<Engagement> => {
    const response = await fetch(`${API_BASE_URL}/posts/updatepostengagement`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UserID, PostID, action }),
    });
    if (!response.ok) throw new Error('Failed to update engagement');
    const data = await response.json();
    return data.engagement;
};

// Remove like or dislike from a post
export const removePostEngagement = async (
    UserID: string,
    PostID: string,
    action: 'like' | 'dislike'
): Promise<Engagement> => {
    const response = await fetch(`${API_BASE_URL}/posts/removepostengagement`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UserID, PostID, action }),
    });
    if (!response.ok) throw new Error('Failed to remove engagement');
    const data = await response.json();
    return data.engagement;
};

// Get a single post with engagement and comments
export const getPostWithEngagement = async (PostID: string): Promise<{
    post: Post;
    engagement: Engagement;
    comments: Comment[];
}> => {
    const response = await fetch(`${API_BASE_URL}/posts/viewsinglepost/${PostID}`);
    if (!response.ok) throw new Error('Failed to fetch post');
    return await response.json();
};

// Add a comment or reply
export const addComment = async (
    userId: string,
    postId: string,
    comment: string,
    isReply: boolean = false,
    to?: string
): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/posts/addcomment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, postId, comment, isReply, to }),
    });
    if (!response.ok) throw new Error('Failed to add comment');
    const data = await response.json();
    return data.comment;
};

// Update a comment
export const updateComment = async (
    userId: string,
    commentId: string,
    comment: string
): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/posts/updatecomment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, commentId, comment }),
    });
    if (!response.ok) throw new Error('Failed to update comment');
    const data = await response.json();
    return data.comment;
};

// Delete a comment
export const deleteComment = async (
    userId: string,
    commentId: string
): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/posts/deletecomment`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, commentId }),
    });
    if (!response.ok) throw new Error('Failed to delete comment');
};

/**
 * FOLLOWS
 */

// Follow a user
export const followUser = async (
    followerId: string,
    followingId: string
): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/follow/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId, followingId }),
    });
    if (!response.ok) throw new Error('Failed to follow user');
};

// Unfollow a user
export const unfollowUser = async (
    followerId: string,
    followingId: string
): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/follow/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId, followingId }),
    });
    if (!response.ok) throw new Error('Failed to unfollow user');
};

// Get followers (paginated)
export const getFollowers = async (
    userId: string,
    page: number = 1,
    limit: number = 20
): Promise<{ total: number; page: number; limit: number; followers: Follow[] }> => {
    const response = await fetch(
        `${API_BASE_URL}/follow/followers/${userId}?page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Failed to fetch followers');
    return await response.json();
};

// Get following (paginated)
export const getFollowing = async (
    userId: string,
    page: number = 1,
    limit: number = 20
): Promise<{ total: number; page: number; limit: number; following: Follow[] }> => {
    const response = await fetch(
        `${API_BASE_URL}/follow/following/${userId}?page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Failed to fetch following');
    return await response.json();
};

// Get user profile overview
export const getUserProfileOverview = async (
    userId: string
): Promise<UserProfileOverview> => {
    const response = await fetch(
        `${API_BASE_URL}/follow/userprofile/${encodeURIComponent(userId)}`
    );
    if (!response.ok) {
        throw new Error('Failed to fetch user profile overview');
    }
    return await response.json();
};

// Save a post
export const savePost = async (
    UserID: string,
    PostID: string
): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/posts/savepost`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UserID, PostID }),
    });
    if (!response.ok) throw new Error('Failed to save post');
};

// Remove saved post
export const removeSavedPost = async (
    UserID: string,
    PostID: string
): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/posts/removesavedpost`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UserID, PostID }),
    });
    if (!response.ok) throw new Error('Failed to remove saved post');
};