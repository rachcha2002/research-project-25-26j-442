const express = require('express');
const multer = require('multer');
const { createPost, getAllPosts, deletePost, updatePostEngagement,removePostEngagement, getPostWithEngagement, addComment, updateComment, deleteComment} = require('../controllers/postController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/createpost', upload.single('file'), createPost);
router.get('/getallposts', getAllPosts);
router.delete('/deletepost', deletePost);
router.put('/updatepostengagement', updatePostEngagement);
router.put('/removepostengagement', removePostEngagement);
router.get('/viewsinglepost/:PostID', getPostWithEngagement);
router.post('/addcomment', addComment);
router.put('/updatecomment', updateComment);
router.delete('/deletecomment', deleteComment);

module.exports = router;
