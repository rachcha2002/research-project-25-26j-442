const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    PostID: {
        type: String,
        required: true,
        unique: true
    },
    UserID: {
        type: String,
        required: true
    },
    PostUrl: {
        type: String
    },
    Description: {
        type: String
    },
    Tags: {
        type: Array
    },
    PostedTime: {
        type: Date,
        default: Date.now
    },
    ApprovementReq:{
        type: Boolean,
        default: false
    },
    Approved:{
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Posts', postSchema);