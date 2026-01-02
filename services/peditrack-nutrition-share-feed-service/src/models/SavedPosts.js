const mongoose = require('mongoose');
const { Schema } = mongoose;

const SavedPostsSchema = new Schema({
    UserId: { type: String, required: true },
    Posts: [{ type: Schema.Types.ObjectId, ref: 'Posts' }]
})

module.exports = mongoose.model('SavedPosts', SavedPostsSchema);
