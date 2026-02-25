const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');

// Get all health conditions for a baby
router.get('/baby/:babyId', async (req, res) => {
  try {
    const { babyId } = req.params;
    const conditions = await HealthRecord.find({ 
      babyId, 
      recordType: { $in: ['illness', 'condition'] } // Assuming 'illness' or custom 'condition' type if added later
    }).sort({ recordDate: -1 });
    res.json(conditions);
  } catch (error) {
    console.error('Error fetching health conditions:', error);
    res.status(500).json({ error: 'Failed to fetch health conditions' });
  }
});

// Get active health conditions for a baby
router.get('/baby/:babyId/active', async (req, res) => {
  try {
    const { babyId } = req.params;
    const conditions = await HealthRecord.find({ 
      babyId, 
      recordType: { $in: ['illness', 'condition'] },
      status: { $in: ['active', 'monitoring', 'underTreatment'] } // Exclude 'resolved'
    }).sort({ recordDate: -1 });
    res.json(conditions);
  } catch (error) {
    console.error('Error fetching active health conditions:', error);
    res.status(500).json({ error: 'Failed to fetch active health conditions' });
  }
});

// Get a single health condition by ID
router.get('/:id', async (req, res) => {
  try {
    const condition = await HealthRecord.findById(req.params.id);
    if (!condition) {
      return res.status(404).json({ error: 'Health condition not found' });
    }
    res.json(condition);
  } catch (error) {
    console.error('Error fetching health condition:', error);
    res.status(500).json({ error: 'Failed to fetch health condition' });
  }
});

// Create a new health condition
router.post('/', async (req, res) => {
  try {
    // Force recordType to 'illness' if not specified, or ensure it's treated as a condition
    const conditionData = {
      ...req.body,
      recordType: 'illness' 
    };
    
    const condition = new HealthRecord(conditionData);
    await condition.save();
    res.status(201).json(condition);
  } catch (error) {
    console.error('Error creating health condition:', error);
    res.status(400).json({ error: 'Failed to create health condition' });
  }
});

// Update a health condition
router.put('/:id', async (req, res) => {
  try {
    const condition = await HealthRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!condition) {
      return res.status(404).json({ error: 'Health condition not found' });
    }
    
    res.json(condition);
  } catch (error) {
    console.error('Error updating health condition:', error);
    res.status(400).json({ error: 'Failed to update health condition' });
  }
});

// Delete a health condition
router.delete('/:id', async (req, res) => {
  try {
    const condition = await HealthRecord.findByIdAndDelete(req.params.id);
    if (!condition) {
      return res.status(404).json({ error: 'Health condition not found' });
    }
    res.json({ message: 'Health condition deleted successfully' });
  } catch (error) {
    console.error('Error deleting health condition:', error);
    res.status(500).json({ error: 'Failed to delete health condition' });
  }
});

module.exports = router;
