const Follow = require('../models/Follow');
const Post = require('../models/Post'); // <- make sure this path/name matches your project

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

        res.status(200).json({
            total,
            page,
            limit,
            followers
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

        res.status(200).json({
            total,
            page,
            limit,
            following
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

        const [followersCount, followingCount, posts, postCount] = await Promise.all([
            Follow.countDocuments({ followingId: userId }),       // followers
            Follow.countDocuments({ followerId: userId }),        // following
            Post.find({ UserID: userId })                         // this user's posts
                .sort({ PostedTime: -1 }),
            Post.countDocuments({ UserID: userId })
        ]);

        return res.status(200).json({
            userId,
            followersCount,
            followingCount,
            postCount,
            posts
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
};