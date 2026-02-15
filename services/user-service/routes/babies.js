const express = require('express');
const router = express.Router();
const BabyProfile = require('../models/BabyProfile');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { validateCreateBaby, validateUpdateBaby, validateObjectId } = require('../middleware/validation');

/**
 * @route   POST /api/babies
 * @desc    Create a new baby profile
 * @access  Private
 */
router.post('/', auth, validateCreateBaby, async (req, res) => {
  try {
    const { name, dateOfBirth, gender, photo, bloodType, allergies, medicalNotes } = req.body;

    // Check if this is the user's first baby
    const existingBabiesCount = await BabyProfile.countDocuments({ userId: req.userId });
    const isFirstBaby = existingBabiesCount === 0;

    // Create baby profile
    const babyProfile = new BabyProfile({
      userId: req.userId,
      name,
      dateOfBirth,
      gender,
      photo,
      bloodType,
      allergies,
      medicalNotes,
      isDefault: isFirstBaby // Set as default if it's the first baby
    });

    await babyProfile.save();

    // If it's the first baby, set as default in user profile
    if (isFirstBaby) {
      await User.findByIdAndUpdate(req.userId, { 
        defaultBabyProfile: babyProfile._id 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Baby profile created successfully',
      baby: babyProfile
    });
  } catch (error) {
    console.error('Create baby profile error:', error);
    res.status(500).json({ error: 'Failed to create baby profile' });
  }
});

/**
 * @route   GET /api/babies
 * @desc    Get all baby profiles for the logged-in user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const babyProfiles = await BabyProfile.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      babies: babyProfiles
    });
  } catch (error) {
    console.error('Get baby profiles error:', error);
    res.status(500).json({ error: 'Failed to get baby profiles' });
  }
});

/**
 * @route   GET /api/babies/:id
 * @desc    Get a single baby profile
 * @access  Private
 */
router.get('/:id', auth, validateObjectId, async (req, res) => {
  try {
    const babyProfile = await BabyProfile.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!babyProfile) {
      return res.status(404).json({ error: 'Baby profile not found' });
    }

    res.json({ success: true, baby: babyProfile });
  } catch (error) {
    console.error('Get baby profile error:', error);
    res.status(500).json({ error: 'Failed to get baby profile' });
  }
});

/**
 * @route   PUT /api/babies/:id
 * @desc    Update a baby profile
 * @access  Private
 */
router.put('/:id', auth, validateObjectId, validateUpdateBaby, async (req, res) => {
  try {
    const { name, dateOfBirth, gender, photo, bloodType, allergies, medicalNotes } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (photo !== undefined) updateData.photo = photo;
    if (bloodType !== undefined) updateData.bloodType = bloodType;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (medicalNotes !== undefined) updateData.medicalNotes = medicalNotes;

    const babyProfile = await BabyProfile.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!babyProfile) {
      return res.status(404).json({ error: 'Baby profile not found' });
    }

    res.json({
      success: true,
      message: 'Baby profile updated successfully',
      baby: babyProfile
    });
  } catch (error) {
    console.error('Update baby profile error:', error);
    res.status(500).json({ error: 'Failed to update baby profile' });
  }
});

/**
 * @route   DELETE /api/babies/:id
 * @desc    Delete a baby profile
 * @access  Private
 */
router.delete('/:id', auth, validateObjectId, async (req, res) => {
  try {
    const babyProfile = await BabyProfile.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!babyProfile) {
      return res.status(404).json({ error: 'Baby profile not found' });
    }

    // Check if there are other baby profiles for this user
    const otherBabies = await BabyProfile.find({
      userId: req.userId,
      _id: { $ne: req.params.id }
    });

    // If this is the default baby, set another baby as default
    if (babyProfile.isDefault && otherBabies.length > 0) {
      const newDefaultBaby = otherBabies[0];
      newDefaultBaby.isDefault = true;
      await newDefaultBaby.save();
      
      await User.findByIdAndUpdate(req.userId, {
        defaultBabyProfile: newDefaultBaby._id
      });
    } else if (babyProfile.isDefault) {
      // If it's the only baby, clear the default
      await User.findByIdAndUpdate(req.userId, {
        defaultBabyProfile: null
      });
    }

    // Delete the baby profile
    await BabyProfile.deleteOne({ _id: req.params.id });

    res.json({ 
      message: 'Baby profile deleted successfully',
      newDefaultBabyId: otherBabies.length > 0 && babyProfile.isDefault ? otherBabies[0]._id : null
    });
  } catch (error) {
    console.error('Delete baby profile error:', error);
    res.status(500).json({ error: 'Failed to delete baby profile' });
  }
});

/**
 * @route   PUT /api/babies/:id/set-default
 * @desc    Set a baby profile as default
 * @access  Private
 */
router.put('/:id/set-default', auth, validateObjectId, async (req, res) => {
  try {
    const babyProfile = await BabyProfile.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!babyProfile) {
      return res.status(404).json({ error: 'Baby profile not found' });
    }

    // Remove default from all other baby profiles
    await BabyProfile.updateMany(
      { userId: req.userId, _id: { $ne: req.params.id } },
      { isDefault: false }
    );

    // Set this baby as default
    babyProfile.isDefault = true;
    await babyProfile.save();

    // Update user's default baby profile
    await User.findByIdAndUpdate(req.userId, {
      defaultBabyProfile: babyProfile._id
    });

    res.json({
      success: true,
      message: 'Default baby profile set successfully',
      baby: babyProfile
    });
  } catch (error) {
    console.error('Set default baby error:', error);
    res.status(500).json({ error: 'Failed to set default baby profile' });
  }
});

module.exports = router;
