const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
    followerId: { type: String, required: true, index: true },
    followingId: { type: String, required: true, index: true },
    followedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Follow', FollowSchema);