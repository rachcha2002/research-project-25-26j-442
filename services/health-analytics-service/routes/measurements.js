const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');
const { calculateGrowthVelocity, estimatePercentile, generatePredictions } = require('../utils/calculations');
const Baby = require('../models/Baby');

// Add new measurement
router.post('/', async (req, res, next) => {
  try {
    const measurement = new Measurement(req.body);
    await measurement.save();
    res.status(201).json(measurement);
  } catch (error) {
    next(error);
  }
});

// Get all measurements for a baby
router.get('/baby/:babyId', async (req, res, next) => {
  try {
    const measurements = await Measurement.find({ babyId: req.params.babyId })
      .sort({ measurementDate: -1 });
    res.json(measurements);
  } catch (error) {
    next(error);
  }
});

// Get latest measurement for a baby
router.get('/baby/:babyId/latest', async (req, res, next) => {
  try {
    const measurement = await Measurement.findOne({ babyId: req.params.babyId })
      .sort({ measurementDate: -1 });
    
    if (!measurement) {
      return res.status(404).json({ error: 'No measurements found' });
    }
    
    res.json(measurement);
  } catch (error) {
    next(error);
  }
});

// Get growth analytics for a baby
router.get('/baby/:babyId/analytics', async (req, res, next) => {
  try {
    const measurements = await Measurement.find({ babyId: req.params.babyId })
      .sort({ measurementDate: -1 })
      .limit(20);

    if (measurements.length === 0) {
      return res.status(404).json({ error: 'No measurements found' });
    }

    const baby = await Baby.findById(req.params.babyId);

    // Calculate velocities
    const heightVelocity = calculateGrowthVelocity(measurements, 'height');
    const weightVelocity = calculateGrowthVelocity(measurements, 'weight');

    // Generate predictions
    const predictions3m = generatePredictions(measurements, 3, baby);
    const predictions6m = generatePredictions(measurements, 6, baby);
    const predictions12m = generatePredictions(measurements, 12, baby);

    // Get latest measurement
    const latest = measurements[0];

    res.json({
      latest,
      velocity: {
        height: heightVelocity,
        weight: weightVelocity,
      },
      predictions: {
        '3months': predictions3m,
        '6months': predictions6m,
        '12months': predictions12m,
      },
      totalMeasurements: measurements.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get specific measurement
router.get('/:id', async (req, res, next) => {
  try {
    const measurement = await Measurement.findById(req.params.id);
    if (!measurement) {
      return res.status(404).json({ error: 'Measurement not found' });
    }
    res.json(measurement);
  } catch (error) {
    next(error);
  }
});

// Update measurement
router.put('/:id', async (req, res, next) => {
  try {
    const measurement = await Measurement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!measurement) {
      return res.status(404).json({ error: 'Measurement not found' });
    }
    
    res.json(measurement);
  } catch (error) {
    next(error);
  }
});

// Delete measurement
router.delete('/:id', async (req, res, next) => {
  try {
    const measurement = await Measurement.findByIdAndDelete(req.params.id);
    
    if (!measurement) {
      return res.status(404).json({ error: 'Measurement not found' });
    }
    
    res.json({ message: 'Measurement deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
