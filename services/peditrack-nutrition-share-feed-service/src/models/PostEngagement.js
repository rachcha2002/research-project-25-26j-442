const mongoose = require('mongoose');

const postEngagementSchema = new mongoose.Schema({
    PostID: {
        type: String,
        required: true
    },
    LikedBy: {
        type: Array,
        default: []
    },
    DislikedBy: {
        type: Array,
        default: []
    }
})

module.exports = mongoose.model('PostEngagement', postEngagementSchema);  