const express = require('express');
const { followUser, unfollowUser, getFollowers, getFollowing, getUserOverview } = require('../controllers/followController');

const router = express.Router();

router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);
router.get('/userprofile/:userId', getUserOverview);

module.exports = router;