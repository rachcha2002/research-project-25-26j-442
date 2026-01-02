const mongoose = require('mongoose');

const postCommentSchema = new mongoose.Schema({
    PostID: {
        type: String,
        required: true
    },
    CommentID: {
        type: String,
        required: true
    },
    Comment: {
        type: String,
        required: true
    },
    CommenterID: {
        type: String,
        required: true
    },
    CommentTime: {
        type: Date,
        default: Date.now
    },
    Reply: {
        type: Boolean,
        default: false
    },
    to: {
        type: String,
        default: null
    }
})

module.exports = mongoose.model('PostComment', postCommentSchema);
