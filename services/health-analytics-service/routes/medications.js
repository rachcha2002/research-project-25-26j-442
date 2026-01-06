const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');

// Add new medication
router.post('/', async (req, res, next) => {
  try {
    const medication = new Medication(req.body);
    await medication.save();
    res.status(201).json(medication);
  } catch (error) {
    next(error);
  }
});

// Get all medications for a baby
router.get('/baby/:babyId', async (req, res, next) => {
  try {
    const medications = await Medication.find({ babyId: req.params.babyId })
      .sort({ startDate: -1 });
    res.json(medications);
  } catch (error) {
    next(error);
  }
});

// Get active medications only
router.get('/baby/:babyId/active', async (req, res, next) => {
  try {
    const medications = await Medication.find({ 
      babyId: req.params.babyId,
      status: 'active',
    }).sort({ startDate: -1 });
    
    // Filter by date to ensure currently active
    const now = new Date();
    const activeMedications = medications.filter(med => {
      if (now < med.startDate) return false;
      if (med.endDate && now > med.endDate) return false;
      return true;
    });
    
    res.json(activeMedications);
  } catch (error) {
    next(error);
  }
});

// Get specific medication
router.get('/:id', async (req, res, next) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    res.json(medication);
  } catch (error) {
    next(error);
  }
});

// Update medication
router.put('/:id', async (req, res, next) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json(medication);
  } catch (error) {
    next(error);
  }
});

// Update medication status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'completed', 'discontinued'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json(medication);
  } catch (error) {
    next(error);
  }
});

// Delete medication
router.delete('/:id', async (req, res, next) => {
  try {
    const medication = await Medication.findByIdAndDelete(req.params.id);
    
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
