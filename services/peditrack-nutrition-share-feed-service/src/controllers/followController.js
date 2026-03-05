const Follow = require('../models/Follow');
const Post = require('../models/Post'); // <- make sure this path/name matches your project
const PostEngagement = require('../models/PostEngagement');
const PostComment = require('../models/PostComments');
const SavedPosts = require('../models/SavedPosts');
const { fetchUserProfilesMap, getUserMeta } = require('../utils/userProfileClient');

// helper to build comment tree (same as in postController)
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

const enrichCommentTreeWithUserMeta = (comments, userMap) =>
    comments.map((comment) => {
        const replies = Array.isArray(comment?.replies)
            ? enrichCommentTreeWithUserMeta(comment.replies, userMap)
            : [];

        return {
            ...comment,
            userMeta: getUserMeta(comment.CommenterID, userMap),
            replies,
        };
    });

// Follow a user
exports.followUser = async (req, res) => {
    try {
        const { followerId, followingId } = req.body;
        if (!followerId || !followingId) {
            return res.status(400).json({ message: 'followerId and followingId required.' });
        }
        if (followerId === followingId) {
            return res.status(400).json({ message: 'Cannot follow yourself.' });
        }
        const exists = await Follow.findOne({ followerId, followingId });
        if (exists) {
            return res.status(409).json({ message: 'Already following.' });
        }
        const follow = new Follow({ followerId, followingId });
        await follow.save();
        res.status(201).json({ message: 'Followed successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
    try {
        const { followerId, followingId } = req.body;
        if (!followerId || !followingId) {
            return res.status(400).json({ message: 'followerId and followingId required.' });
        }
        await Follow.deleteOne({ followerId, followingId });
        res.status(200).json({ message: 'Unfollowed successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Get followers (paginated)
exports.getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const followers = await Follow.find({ followingId: userId })
            .skip(skip)
            .limit(limit)
            .select('followerId followedAt -_id');

        const total = await Follow.countDocuments({ followingId: userId });
        const userMap = await fetchUserProfilesMap(followers.map((f) => f.followerId));
        const enrichedFollowers = followers.map((follower) => {
            const userMeta = getUserMeta(follower.followerId, userMap);
            return {
                ...follower.toObject(),
                followerName: userMeta?.name || null,
                followerProfilePicture: userMeta?.profilePicture || null,
                followerMeta: userMeta,
            };
        });

        res.status(200).json({
            total,
            page,
            limit,
            followers: enrichedFollowers
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Get following (paginated)
exports.getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const following = await Follow.find({ followerId: userId })
            .skip(skip)
            .limit(limit)
            .select('followingId followedAt -_id');

        const total = await Follow.countDocuments({ followerId: userId });
        const userMap = await fetchUserProfilesMap(following.map((f) => f.followingId));
        const enrichedFollowing = following.map((row) => {
            const userMeta = getUserMeta(row.followingId, userMap);
            return {
                ...row.toObject(),
                followingName: userMeta?.name || null,
                followingProfilePicture: userMeta?.profilePicture || null,
                followingMeta: userMeta,
            };
        });

        res.status(200).json({
            total,
            page,
            limit,
            following: enrichedFollowing
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Get user overview: posts + counts
exports.getUserOverview = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }

        const [followersCount, followingCount, rawPosts, postCount] = await Promise.all([
            Follow.countDocuments({ followingId: userId }),       // followers
            Follow.countDocuments({ followerId: userId }),        // following
            Post.find({ UserID: userId }).sort({ PostedTime: -1 }).lean(),
            Post.countDocuments({ UserID: userId })
        ]);

        const postIds = rawPosts.map(p => p.PostID);
        if (postIds.length === 0) {
            return res.status(200).json({
                userId,
                followersCount,
                followingCount,
                postCount,
                posts: []
            });
        }

        // engagements
        const engagements = await PostEngagement.find({ PostID: { $in: postIds } }).lean();
        const engagementMap = {};
        engagements.forEach(e => {
            engagementMap[e.PostID] = e;
        });

        // comments
        const comments = await PostComment.find({ PostID: { $in: postIds } })
            .sort({ CommentTime: 1 });

        const commentsByPost = {};
        postIds.forEach(id => { commentsByPost[id] = []; });
        comments.forEach(c => {
            if (!commentsByPost[c.PostID]) commentsByPost[c.PostID] = [];
            commentsByPost[c.PostID].push(c);
        });

        const userIdSet = new Set([String(userId)]);
        rawPosts.forEach((post) => userIdSet.add(String(post.UserID)));
        comments.forEach((comment) => {
            if (comment?.CommenterID) {
                userIdSet.add(String(comment.CommenterID));
            }
        });
        const userMap = await fetchUserProfilesMap([...userIdSet]);

        // optional: saved posts for this same user
        let savedSet = new Set();
        const saved = await SavedPosts.findOne({ UserId: userId }).lean();
        if (saved && saved.Posts) {
            savedSet = new Set(saved.Posts.map(id => String(id)));
        }

        const posts = rawPosts.map(post => ({
            post: {
                ...post,
                userMeta: getUserMeta(post.UserID, userMap),
            },
            engagement: engagementMap[post.PostID] || { PostID: post.PostID, LikedBy: [], DislikedBy: [] },
            comments: enrichCommentTreeWithUserMeta(buildCommentTree(commentsByPost[post.PostID] || []), userMap),
            isSaved: savedSet.has(String(post._id)),
        }));

        return res.status(200).json({
            userId,
            userMeta: getUserMeta(userId, userMap),
            followersCount,
            followingCount,
            postCount,
            posts
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
};