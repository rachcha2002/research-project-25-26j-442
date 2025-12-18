const Post = require('../models/Post');
const PostEngagement = require('../models/PostEngagement');
const PostComment = require('../models/PostComments');
const { uploadToR2, deleteFromR2 } = require('./uploadController');

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

exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ PostedTime: -1 }); // Sort by newest first
        res.status(200).json(posts);
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
