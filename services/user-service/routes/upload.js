const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const { uploadToR2, deleteFromR2 } = require('../utils/r2Upload');
const { isR2Enabled } = require('../config/r2');
const User = require('../models/User');
const BabyProfile = require('../models/BabyProfile');

/**
 * @route   POST /api/upload/profile-picture
 * @desc    Upload user profile picture to R2
 * @access  Private
 */
router.post('/profile-picture', auth, upload.single('image'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!isR2Enabled) {
      return res.status(503).json({ 
        error: 'File upload is not available. R2 storage is not configured.' 
      });
    }

    // Upload to R2
    const imageUrl = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'profile-pictures'
    );

    // Update user profile with new image URL
    const user = await User.findByIdAndUpdate(
      req.userId,
      { profilePicture: imageUrl },
      { new: true }
    ).select('-password -refreshTokens');

    res.json({
      message: 'Profile picture uploaded successfully',
      imageUrl,
      user
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload profile picture',
      details: error.message 
    });
  }
});

/**
 * @route   POST /api/upload/baby-photo/:babyId
 * @desc    Upload baby photo to R2
 * @access  Private
 */
router.post('/baby-photo/:babyId', auth, upload.single('image'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!isR2Enabled) {
      return res.status(503).json({ 
        error: 'File upload is not available. R2 storage is not configured.' 
      });
    }

    const { babyId } = req.params;

    // Verify baby profile exists and belongs to user
    const babyProfile = await BabyProfile.findOne({
      _id: babyId,
      userId: req.userId
    });

    if (!babyProfile) {
      return res.status(404).json({ error: 'Baby profile not found' });
    }

    // Delete old photo from R2 if it exists and is an R2 URL
    if (babyProfile.photo && babyProfile.photo.includes('r2.dev')) {
      await deleteFromR2(babyProfile.photo);
    }

    // Upload new photo to R2
    const imageUrl = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'baby-photos'
    );

    // Update baby profile with new image URL
    babyProfile.photo = imageUrl;
    await babyProfile.save();

    res.json({
      message: 'Baby photo uploaded successfully',
      imageUrl,
      babyProfile
    });
  } catch (error) {
    console.error('Baby photo upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload baby photo',
      details: error.message 
    });
  }
});

/**
 * @route   DELETE /api/upload/profile-picture
 * @desc    Delete user profile picture from R2
 * @access  Private
 */
router.delete('/profile-picture', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user.profilePicture) {
      return res.status(404).json({ error: 'No profile picture to delete' });
    }

    // Delete from R2 if it's an R2 URL
    if (user.profilePicture.includes('r2.dev')) {
      await deleteFromR2(user.profilePicture);
    }

    // Remove from user profile
    user.profilePicture = null;
    await user.save();

    res.json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});

/**
 * @route   DELETE /api/upload/baby-photo/:babyId
 * @desc    Delete baby photo from R2
 * @access  Private
 */
router.delete('/baby-photo/:babyId', auth, async (req, res) => {
  try {
    const { babyId } = req.params;

    const babyProfile = await BabyProfile.findOne({
      _id: babyId,
      userId: req.userId
    });

    if (!babyProfile) {
      return res.status(404).json({ error: 'Baby profile not found' });
    }

    if (!babyProfile.photo) {
      return res.status(404).json({ error: 'No photo to delete' });
    }

    // Delete from R2 if it's an R2 URL
    if (babyProfile.photo.includes('r2.dev')) {
      await deleteFromR2(babyProfile.photo);
    }

    // Remove from baby profile
    babyProfile.photo = null;
    await babyProfile.save();

    res.json({ message: 'Baby photo deleted successfully' });
  } catch (error) {
    console.error('Delete baby photo error:', error);
    res.status(500).json({ error: 'Failed to delete baby photo' });
  }
});

module.exports = router;
