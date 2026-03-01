const Post = require('../models/Post');
const PostEngagement = require('../models/PostEngagement');
const PostComment = require('../models/PostComments');
const SavedPosts = require('../models/SavedPosts');
const mongoose = require('mongoose');
const { uploadToR2, deleteFromR2 } = require('./uploadController');

// helper to build comment tree (same logic as getPostWithEngagement)
const buildCommentTree = (comments) => {
    const commentMap = {};
    comments.forEach(c => {
        const obj = c.toObject ? c.toObject() : { ...c };
        obj.replies = [];
        commentMap[obj.CommentID] = obj;
    });

    const roots = [];
    Object.values(commentMap).forEach(comment => {
        if (comment.Reply && comment.to && commentMap[comment.to]) {
            commentMap[comment.to].replies.push(comment);
        } else if (!comment.Reply) {
            roots.push(comment);
        }
    });

    return roots;
};

exports.createPost = async (req, res) => {
    try {
        const { UserID, Description, ApprovementReq, Tags } = req.body;

        if (!UserID) {
            return res.status(400).json({ message: "UserID is required" });
        }

        let postUrl = null;

        // 1. Handle File Upload if present
        if (req.file) {
            try {
                const uploadResult = await uploadToR2(req.file);
                postUrl = uploadResult.key; // Saving the key as PostUrl per requirements
            } catch (uploadError) {
                console.error("File upload failed:", uploadError);
                return res.status(500).json({ message: "File upload failed" });
            }
        }

        const lastPost = await Post.findOne({ UserID: UserID })
            .sort({ PostID: -1 }) // Sort by PostID descending to get the highest number
            .collation({ locale: "en_US", numericOrdering: true }); // Ensure numeric sorting behavior if possible, though strict string sort might work if fixed length

        let nextSequence = 0;

        if (lastPost && lastPost.PostID) {
            const prefix = `PST${UserID}`;
            if (lastPost.PostID.startsWith(prefix)) {
                const numberPart = lastPost.PostID.replace(prefix, '');
                const parsedNumber = parseInt(numberPart, 10);
                if (!isNaN(parsedNumber)) {
                    nextSequence = parsedNumber + 1;
                }
            }
        }
        const paddedSequence = nextSequence.toString().padStart(4, '0');
        const newPostID = `PST${UserID}${paddedSequence}`;

        // 3. Process Tags
        let processedTags = [];
        if (Tags) {
            if (Array.isArray(Tags)) {
                processedTags = Tags;
            } else if (typeof Tags === 'string') {
                // Split by comma and trim whitespace
                processedTags = Tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
        }

        // 4. Create Post
        const newPost = new Post({
            PostID: newPostID,
            UserID,
            PostUrl: postUrl,
            Description,
            Tags: processedTags,
            PostedTime: new Date(), // Storing current server time (UTC). Frontend can convert to SL Time, or server naturally handles it if configured.
            ApprovementReq: ApprovementReq === 'true' || ApprovementReq === true, // Handle likely string input from formData
            // Approved default handled by Schema
        });

        await newPost.save();

        res.status(201).json({
            message: "Post created successfully",
            post: newPost
        });

    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// ...existing code...

exports.updatePost = async (req, res) => {
    try {
        const { UserID, PostID, Description, ApprovementReq, Tags } = req.body;

        if (!UserID || !PostID) {
            return res.status(400).json({ message: "UserID and PostID are required" });
        }

        // Find post
        const post = await Post.findOne({ PostID });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Verify ownership
        if (post.UserID !== UserID) {
            return res.status(403).json({ message: "Unauthorized: UserID does not match post owner" });
        }

        // Process tags (optional)
        if (typeof Tags !== 'undefined') {
            if (Array.isArray(Tags)) {
                post.Tags = Tags;
            } else if (typeof Tags === 'string') {
                post.Tags = Tags.split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
            } else {
                post.Tags = [];
            }
        }

        // Update description (optional)
        if (typeof Description !== 'undefined') {
            post.Description = Description;
        }

        // Update ApprovementReq (allow recommendations)
        if (typeof ApprovementReq !== 'undefined') {
            post.ApprovementReq = ApprovementReq === 'true' || ApprovementReq === true;
        }

        // Handle file replacement (optional)
        if (req.file) {
            try {
                // upload new file
                const uploadResult = await uploadToR2(req.file);
                const newKey = uploadResult.key;

                // delete old file if exists
                if (post.PostUrl) {
                    try {
                        await deleteFromR2(post.PostUrl);
                    } catch (fileError) {
                        console.error("Error deleting old file from storage:", fileError);
                        // continue even if file delete fails
                    }
                }

                post.PostUrl = newKey;
            } catch (uploadError) {
                console.error("File upload failed during update:", uploadError);
                return res.status(500).json({ message: "File upload failed" });
            }
        }

        // Reset approval on any change
        post.Approved = false;

        // Update PostedTime to now
        post.PostedTime = new Date();

        await post.save();

        return res.status(200).json({
            message: "Post updated successfully",
            post,
        });
    } catch (error) {
        console.error("Error updating post:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// ...existing code...

exports.getAllPosts = async (req, res) => {
    try {
        const { UserID } = req.query;   // <-- NEW (optional)

        // 1. Get all posts
        const posts = await Post.find().sort({ PostedTime: -1 }).lean();
        const postIds = posts.map(p => p.PostID);

        if (postIds.length === 0) {
            return res.status(200).json([]);
        }

        // 2. Get all engagements for these posts
        const engagements = await PostEngagement.find({ PostID: { $in: postIds } }).lean();
        const engagementMap = {};
        engagements.forEach(e => {
            engagementMap[e.PostID] = e;
        });

        // 3. Get all comments for these posts
        const comments = await PostComment.find({ PostID: { $in: postIds } })
            .sort({ CommentTime: 1 });

        const commentsByPost = {};
        postIds.forEach(id => { commentsByPost[id] = []; });
        comments.forEach(c => {
            if (!commentsByPost[c.PostID]) commentsByPost[c.PostID] = [];
            commentsByPost[c.PostID].push(c);
        });

        // 3b. Get saved posts for this user (once)
        let savedSet = new Set();
        if (UserID) {
            const saved = await SavedPosts.findOne({ UserId: UserID }).lean();
            if (saved && saved.Posts) {
                savedSet = new Set(saved.Posts.map(id => String(id)));
            }
        }

        // 4. Build response array with post + engagement + comment tree + isSaved
        const result = posts.map(post => ({
            post,
            engagement: engagementMap[post.PostID] || { PostID: post.PostID, LikedBy: [], DislikedBy: [] },
            comments: buildCommentTree(commentsByPost[post.PostID] || []),
            isSaved: savedSet.has(String(post._id)),   // <-- NEW
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Error fetching posts", error: error.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { PostID, UserID } = req.body;

        if (!PostID || !UserID) {
            return res.status(400).json({ message: "PostID and UserID are required" });
        }

        // Find the post
        const post = await Post.findOne({ PostID });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Verify ownership
        if (post.UserID !== UserID) {
            return res.status(403).json({ message: "Unauthorized: UserID does not match post owner" });
        }

        // Delete file from storage if it exists
        if (post.PostUrl) {
            try {
                await deleteFromR2(post.PostUrl);
            } catch (fileError) {
                console.error("Error deleting file from storage (continuing with post deletion):", fileError);
                // We choose to continue deleting the post even if file deletion fails
            }
        }

        // Delete the post from DB
        await Post.deleteOne({ PostID });

        res.status(200).json({ message: "Post deleted successfully" });

    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.updatePostEngagement = async (req, res) => {
    try {
        const { UserID, PostID, action } = req.body; // action: 'like' or 'dislike'

        if (!UserID || !PostID || !['like', 'dislike'].includes(action)) {
            return res.status(400).json({ message: "UserID, PostID, and valid action are required" });
        }

        // Find or create engagement document for this post
        let engagement = await PostEngagement.findOne({ PostID });
        if (!engagement) {
            engagement = new PostEngagement({ PostID });
        }

        // Remove user from both arrays first
        engagement.LikedBy = engagement.LikedBy.filter(id => id !== UserID);
        engagement.DislikedBy = engagement.DislikedBy.filter(id => id !== UserID);

        // Add to the correct array
        if (action === 'like') {
            engagement.LikedBy.push(UserID);
        } else if (action === 'dislike') {
            engagement.DislikedBy.push(UserID);
        }

        await engagement.save();

        res.status(200).json({ message: "Engagement updated", engagement });
    } catch (error) {
        console.error("Error updating engagement:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.removePostEngagement = async (req, res) => {
    try {
        const { UserID, PostID, action } = req.body; // action: 'like' or 'dislike'

        if (!UserID || !PostID || !['like', 'dislike'].includes(action)) {
            return res.status(400).json({ message: "UserID, PostID, and valid action are required" });
        }

        let engagement = await PostEngagement.findOne({ PostID });
        if (!engagement) {
            return res.status(404).json({ message: "Engagement record not found for this post" });
        }

        if (action === 'like') {
            engagement.LikedBy = engagement.LikedBy.filter(id => id !== UserID);
        } else if (action === 'dislike') {
            engagement.DislikedBy = engagement.DislikedBy.filter(id => id !== UserID);
        }

        await engagement.save();

        res.status(200).json({ message: "Engagement removed", engagement });
    } catch (error) {
        console.error("Error removing engagement:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.getPostWithEngagement = async (req, res) => {
    try {
        const { PostID } = req.params;

        if (!PostID) {
            return res.status(400).json({ message: "PostID is required" });
        }

        const post = await Post.findOne({ PostID });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const engagement = await PostEngagement.findOne({ PostID });

        // Fetch all comments for this post
        const comments = await PostComment.find({ PostID }).sort({ CommentTime: 1 });

        // Build comment hierarchy
        const commentMap = {};
        comments.forEach(comment => {
            comment = comment.toObject();
            comment.replies = [];
            commentMap[comment.CommentID] = comment;
        });

        const commentTree = [];
        comments.forEach(comment => {
            if (comment.Reply && comment.to && commentMap[comment.to]) {
                commentMap[comment.to].replies.push(commentMap[comment.CommentID]);
            } else if (!comment.Reply) {
                commentTree.push(commentMap[comment.CommentID]);
            }
        });

        res.status(200).json({
            post,
            engagement: engagement || { LikedBy: [], DislikedBy: [] },
            comments: commentTree
        });
    } catch (error) {
        console.error("Error fetching post with engagement and comments:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Add Comment to Post (including replies)
exports.addComment = async (req, res) => {
    try {
        const { userId, postId, comment, isReply = false, to = null } = req.body;

        // Validate required fields
        if (!userId || !postId || !comment) {
            return res.status(400).json({ success: false, message: 'userId, postId, and comment are required.' });
        }

        // Check if Post exists
        const postExists = await Post.findOne({ PostID: postId });
        if (!postExists) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        // If reply, check if parent comment exists
        if (isReply && to) {
            const parentComment = await PostComment.findOne({ CommentID: to, PostID: postId });
            if (!parentComment) {
                return res.status(404).json({ success: false, message: 'Parent comment not found.' });
            }
        }

        // Generate next CommentID for this post
        const lastComment = await PostComment.find({ PostID: postId })
            .sort({ CommentID: -1 })
            .limit(1);
        let nextNumber = 1;
        if (lastComment.length > 0) {
            const lastId = lastComment[0].CommentID;
            const numPart = parseInt(lastId.slice(postId.length), 10);
            nextNumber = numPart + 1;
        }
        const commentId = postId + String(nextNumber).padStart(5, '0');

        // Create comment
        const newComment = new PostComment({
            PostID: postId,
            CommentID: commentId,
            Comment: comment,
            CommenterID: userId,
            Reply: isReply,
            to: isReply ? to : null
        });

        await newComment.save();

        return res.status(201).json({
            success: true,
            message: 'Comment added successfully.',
            comment: newComment
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

// Update Comment
exports.updateComment = async (req, res) => {
    try {
        const { userId, commentId, comment } = req.body;

        if (!userId || !commentId || !comment) {
            return res.status(400).json({ success: false, message: 'userId, commentId, and new comment are required.' });
        }

        // Find the comment
        const existingComment = await PostComment.findOne({ CommentID: commentId });

        if (!existingComment) {
            return res.status(404).json({ success: false, message: 'Comment not found.' });
        }

        // Verify ownership
        if (existingComment.CommenterID !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Only the comment owner can update this comment.' });
        }

        // Update the comment
        existingComment.Comment = comment;
        await existingComment.save();

        return res.status(200).json({
            success: true,
            message: 'Comment updated successfully.',
            comment: existingComment
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

// Delete Comment
exports.deleteComment = async (req, res) => {
    try {
        const { userId, commentId } = req.body;

        if (!userId || !commentId) {
            return res.status(400).json({ success: false, message: 'userId and commentId are required.' });
        }

        // Find the comment
        const comment = await PostComment.findOne({ CommentID: commentId });
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found.' });
        }

        // Find the post to check for post owner
        const post = await Post.findOne({ PostID: comment.PostID });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Associated post not found.' });
        }

        // Authorize: Only comment owner or post owner can delete
        if (comment.CommenterID !== userId && post.UserID !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Only the comment owner or post owner can delete this comment.' });
        }

        // Recursive function to delete replies
        async function deleteReplies(parentCommentId) {
            const replies = await PostComment.find({ to: parentCommentId, Reply: true });
            for (const reply of replies) {
                await deleteReplies(reply.CommentID);
                await PostComment.deleteOne({ CommentID: reply.CommentID });
            }
        }

        // Delete all replies recursively
        await deleteReplies(commentId);

        // Delete the main comment
        await PostComment.deleteOne({ CommentID: commentId });

        return res.status(200).json({ success: true, message: 'Comment and its replies deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

// Save a post for a user
exports.savePost = async (req, res) => {
    try {
        const { UserID, PostID } = req.body;

        if (!UserID || !PostID) {
            return res.status(400).json({ success: false, message: 'UserID and PostID are required.' });
        }

        const post = await Post.findOne({ PostID });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        let saved = await SavedPosts.findOne({ UserId: UserID });
        if (!saved) {
            saved = new SavedPosts({ UserId: UserID, Posts: [] });
        }

        const alreadySaved = saved.Posts.some(id => id.equals(post._id));
        if (alreadySaved) {
            return res.status(200).json({ success: true, message: 'Post already saved.', savedPosts: saved });
        }

        saved.Posts.push(post._id);
        await saved.save();

        return res.status(200).json({
            success: true,
            message: 'Post saved successfully.',
            savedPosts: saved,
        });
    } catch (error) {
        console.error('Error saving post:', error);
        return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

// Remove a saved post for a user
exports.removeSavedPost = async (req, res) => {
    try {
        const { UserID, PostID } = req.body;

        if (!UserID || !PostID) {
            return res.status(400).json({ success: false, message: 'UserID and PostID are required.' });
        }

        const post = await Post.findOne({ PostID });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        const saved = await SavedPosts.findOne({ UserId: UserID });
        if (!saved) {
            return res.status(404).json({ success: false, message: 'No saved posts found for user.' });
        }

        const before = saved.Posts.length;
        saved.Posts = saved.Posts.filter(id => !id.equals(post._id));

        if (saved.Posts.length === before) {
            return res.status(200).json({ success: true, message: 'Post was not saved.', savedPosts: saved });
        }

        await saved.save();

        return res.status(200).json({
            success: true,
            message: 'Post removed from saved list.',
            savedPosts: saved,
        });
    } catch (error) {
        console.error('Error removing saved post:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get all saved posts (with details) for a user
exports.getSavedPostsByUser = async (req, res) => {
    try {
        const { UserID } = req.params;

        if (!UserID) {
            return res.status(400).json({ success: false, message: 'UserID is required.' });
        }

        // 1. Find saved posts document and populate posts
        const saved = await SavedPosts.findOne({ UserId: UserID })
            .populate('Posts')
            .lean();

        if (!saved || !saved.Posts || saved.Posts.length === 0) {
            return res.status(200).json([]); // no saved posts
        }

        const posts = saved.Posts; // populated Post documents
        const postIds = posts.map(p => p.PostID);

        // 2. Get engagements for these posts
        const engagements = await PostEngagement.find({ PostID: { $in: postIds } }).lean();
        const engagementMap = {};
        engagements.forEach(e => {
            engagementMap[e.PostID] = e;
        });

        // 3. Get comments for these posts
        const comments = await PostComment.find({ PostID: { $in: postIds } })
            .sort({ CommentTime: 1 });

        const commentsByPost = {};
        postIds.forEach(id => { commentsByPost[id] = []; });
        comments.forEach(c => {
            if (!commentsByPost[c.PostID]) commentsByPost[c.PostID] = [];
            commentsByPost[c.PostID].push(c);
        });

        // 4. Build response (same shape as getAllPosts)
        const result = posts.map(post => ({
            post,
            engagement: engagementMap[post.PostID] || { PostID: post.PostID, LikedBy: [], DislikedBy: [] },
            comments: buildCommentTree(commentsByPost[post.PostID] || []),
            isSaved: true,
        }));

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching saved posts:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get posts requiring approval for a specific doctor
exports.getPostsRequiringApproval = async (req, res) => {
    try {
        const { DoctorID } = req.params;

        if (!DoctorID) {
            return res.status(400).json({ success: false, message: 'DoctorID is required.' });
        }

        // Verify doctor exists in database
        const doctorsCollection = mongoose.connection.db.collection('doctors');
        const doctor = await doctorsCollection.findOne({ doctor_id: DoctorID });

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }

        // Get posts with ApprovementReq = true
        const posts = await Post.find({ ApprovementReq: true })
            .sort({ PostedTime: -1 })
            .lean();

        if (posts.length === 0) {
            return res.status(200).json([]);
        }

        const postIds = posts.map(p => p.PostID);

        // Get engagements for these posts
        const engagements = await PostEngagement.find({ PostID: { $in: postIds } }).lean();
        const engagementMap = {};
        engagements.forEach(e => {
            engagementMap[e.PostID] = e;
        });

        // Get comments for these posts
        const comments = await PostComment.find({ PostID: { $in: postIds } })
            .sort({ CommentTime: 1 });

        const commentsByPost = {};
        postIds.forEach(id => { commentsByPost[id] = []; });
        comments.forEach(c => {
            if (!commentsByPost[c.PostID]) commentsByPost[c.PostID] = [];
            commentsByPost[c.PostID].push(c);
        });

        // Build response
        const result = posts.map(post => ({
            post,
            engagement: engagementMap[post.PostID] || { PostID: post.PostID, LikedBy: [], DislikedBy: [] },
            comments: buildCommentTree(commentsByPost[post.PostID] || []),
        }));

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching posts requiring approval:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Approve a post by a doctor
exports.approvePost = async (req, res) => {
    try {
        const { DoctorID, PostID, Approved } = req.body;

        if (!DoctorID || !PostID || typeof Approved !== 'boolean') {
            return res.status(400).json({ success: false, message: 'DoctorID, PostID, and Approved (boolean) are required.' });
        }

        // Verify doctor exists in database
        const doctorsCollection = mongoose.connection.db.collection('doctors');
        const doctor = await doctorsCollection.findOne({ doctor_id: DoctorID });

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }

        // Find the post
        const post = await Post.findOne({ PostID });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        // Check if post requires approval
        if (!post.ApprovementReq) {
            return res.status(400).json({ success: false, message: 'This post does not require approval.' });
        }

        // Update approval status
        post.Approved = Approved;
        await post.save();

        return res.status(200).json({
            success: true,
            message: `Post ${Approved ? 'approved' : 'rejected'} successfully.`,
            post
        });
    } catch (error) {
        console.error('Error approving post:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
