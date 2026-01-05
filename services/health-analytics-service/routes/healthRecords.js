const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');

// Add new health record
router.post('/', async (req, res, next) => {
  try {
    const healthRecord = new HealthRecord(req.body);
    await healthRecord.save();
    res.status(201).json(healthRecord);
  } catch (error) {
    next(error);
  }
});

// Get all health records for a baby
router.get('/baby/:babyId', async (req, res, next) => {
  try {
    const { recordType } = req.query;
    
    const filter = { babyId: req.params.babyId };
    if (recordType) filter.recordType = recordType;

    const healthRecords = await HealthRecord.find(filter)
      .sort({ recordDate: -1 });
    res.json(healthRecords);
  } catch (error) {
    next(error);
  }
});

// Get specific health record
router.get('/:id', async (req, res, next) => {
  try {
    const healthRecord = await HealthRecord.findById(req.params.id);
    if (!healthRecord) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    res.json(healthRecord);
  } catch (error) {
    next(error);
  }
});

// Update health record
router.put('/:id', async (req, res, next) => {
  try {
    const healthRecord = await HealthRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!healthRecord) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    
    res.json(healthRecord);
  } catch (error) {
    next(error);
  }
});

// Delete health record
router.delete('/:id', async (req, res, next) => {
  try {
    const healthRecord = await HealthRecord.findByIdAndDelete(req.params.id);
    
    if (!healthRecord) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    
    res.json({ message: 'Health record deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
