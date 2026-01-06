const express = require('express');
const router = express.Router();
const Baby = require('../models/Baby');

// Create a new baby profile
router.post('/', async (req, res, next) => {
  try {
    const baby = new Baby(req.body);
    await baby.save();
    res.status(201).json(baby);
  } catch (error) {
    next(error);
  }
});

// Get all babies for an account
router.get('/', async (req, res, next) => {
  try {
    const { accountId, userId } = req.query;
    
    const filter = {};
    if (accountId) filter.accountId = accountId;
    if (userId) filter.userId = userId;
    filter.isActive = true;

    const babies = await Baby.find(filter).sort({ createdAt: -1 });
    res.json(babies);
  } catch (error) {
    next(error);
  }
});

// Get specific baby by ID
router.get('/:id', async (req, res, next) => {
  try {
    const baby = await Baby.findById(req.params.id);
    if (!baby) {
      return res.status(404).json({ error: 'Baby not found' });
    }
    res.json(baby);
  } catch (error) {
    next(error);
  }
});

// Update baby information
router.put('/:id', async (req, res, next) => {
  try {
    const baby = await Baby.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!baby) {
      return res.status(404).json({ error: 'Baby not found' });
    }
    
    res.json(baby);
  } catch (error) {
    next(error);
  }
});

// Delete baby profile (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const baby = await Baby.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!baby) {
      return res.status(404).json({ error: 'Baby not found' });
    }
    
    res.json({ message: 'Baby profile deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
