const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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

/**
 * @route   PUT /api/users/me/upgrade
 * @desc    Subscribe to PRO
 * @access  Private
 */
router.put('/me/upgrade', auth, async (req, res) => {
  try {
    const { plan } = req.body; // 'pro_monthly' or 'pro_yearly'
    if (!['pro_monthly', 'pro_yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan specified' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock payment processing and setting expiry date
    user.isPro = true;
    user.subscriptionPlan = plan;
    
    const expiryDate = new Date();
    if (plan === 'pro_monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (plan === 'pro_yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    user.subscriptionExpiry = expiryDate;

    await user.save();

    res.json({
      message: `Successfully upgraded to ${plan === 'pro_monthly' ? 'Monthly' : 'Yearly'} PRO`,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Upgrade user error:', error);
    res.status(500).json({ error: 'Failed to process subscription' });
  }
});

/**
 * @route   PUT /api/users/me/cancel-subscription
 * @desc    Cancel PRO subscription
 * @access  Private
 */
router.put('/me/cancel-subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isPro = false;
    user.subscriptionPlan = 'basic';
    user.subscriptionExpiry = null;

    await user.save();

    res.json({
      message: 'Subscription cancelled successfully.',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * @route   POST /api/users/public/batch
 * @desc    Get public user profiles in batch (safe fields only)
 * @access  Public (intended for internal service-to-service usage)
 */
router.post('/public/batch', async (req, res) => {
  try {
    const { userIds } = req.body || {};

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds must be an array' });
    }

    // De-duplicate and hard-cap to avoid abusive payload sizes.
    const uniqueIds = [...new Set(userIds.map((id) => String(id).trim()).filter(Boolean))].slice(0, 500);

    const validObjectIds = uniqueIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validObjectIds.length === 0) {
      return res.json({ users: [] });
    }

    const users = await User.find({ _id: { $in: validObjectIds } })
      .select('_id name profilePicture')
      .lean();

    return res.json({
      users: users.map((user) => ({
        _id: String(user._id),
        name: user.name || null,
        profilePicture: user.profilePicture || null,
      })),
    });
  } catch (error) {
    console.error('Batch public profile lookup error:', error);
    return res.status(500).json({ error: 'Failed to fetch public user profiles' });
  }
});

module.exports = router;
