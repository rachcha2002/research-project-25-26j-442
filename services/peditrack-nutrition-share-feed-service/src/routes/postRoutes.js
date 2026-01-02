const express = require('express');
const multer = require('multer');
const { createPost, updatePost, getAllPosts, deletePost, updatePostEngagement, removePostEngagement, getPostWithEngagement, addComment, updateComment, deleteComment, savePost, removeSavedPost, getSavedPostsByUser } = require('../controllers/postController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/createpost', upload.single('file'), createPost);
router.get('/getallposts', getAllPosts);
router.get('/getsavedposts/:UserID', getSavedPostsByUser);
router.delete('/deletepost', deletePost);
router.put('/updatepostengagement', updatePostEngagement);
router.put('/removepostengagement', removePostEngagement);
router.get('/viewsinglepost/:PostID', getPostWithEngagement);
router.post('/addcomment', addComment);
router.put('/updatecomment', updateComment);
router.delete('/deletecomment', deleteComment);
router.put('/savepost', savePost);
router.put('/removesavedpost', removeSavedPost);
router.put('/updatepost', upload.single('file'), updatePost);

module.exports = router;
