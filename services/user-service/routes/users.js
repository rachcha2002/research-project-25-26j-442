const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BabyProfile = require('../models/BabyProfile');
const { auth } = require('../middleware/auth');
const { validateUpdateProfile, validateChangePassword, validateObjectId } = require('../middleware/validation');

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password -refreshTokens')
      .populate('defaultBabyProfile');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * @route   PUT /api/users/me
 * @desc    Update user profile
 * @access  Private
 */
router.put('/me', auth, validateUpdateProfile, async (req, res) => {
  try {
    const { name, phone, profilePicture } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * @route   PUT /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', auth, validateChangePassword, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has password (Google OAuth users might not)
    if (!user.password) {
      return res.status(400).json({ 
        error: 'Cannot change password for Google authenticated accounts' 
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens for security
    user.refreshTokens = [];
    await user.save();

    res.json({ 
      message: 'Password changed successfully. Please login again with your new password.' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/me', auth, async (req, res) => {
  try {
    // Delete all baby profiles
    await BabyProfile.deleteMany({ userId: req.userId });

    // Delete user
    await User.findByIdAndDelete(req.userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

/**
 * @route   PUT /api/users/me/default-baby/:babyId
 * @desc    Set default baby profile
 * @access  Private
 */
router.put('/me/default-baby/:babyId', auth, validateObjectId, async (req, res) => {
  try {
    const { babyId } = req.params;

    // Verify baby profile exists and belongs to user
    const babyProfile = await BabyProfile.findOne({ 
      _id: babyId, 
      userId: req.userId 
    });

    if (!babyProfile) {
      return res.status(404).json({ error: 'Baby profile not found' });
    }

    // Update user's default baby profile
    const user = await User.findByIdAndUpdate(
      req.userId,
      { defaultBabyProfile: babyId },
      { new: true }
    ).select('-password -refreshTokens').populate('defaultBabyProfile');

    // Update baby profile's isDefault flag
    await BabyProfile.updateMany(
      { userId: req.userId },
      { isDefault: false }
    );
    babyProfile.isDefault = true;
    await babyProfile.save();

    res.json({
      message: 'Default baby profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Set default baby error:', error);
    res.status(500).json({ error: 'Failed to set default baby profile' });
  }
});

module.exports = router;
