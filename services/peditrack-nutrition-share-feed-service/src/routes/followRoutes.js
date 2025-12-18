const express = require('express');
const { followUser, unfollowUser, getFollowers, getFollowing } = require('../controllers/followController');

const router = express.Router();

router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

module.exports = router;