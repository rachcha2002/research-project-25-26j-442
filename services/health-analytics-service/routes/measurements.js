const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');
const { calculateGrowthVelocity, estimatePercentile, generatePredictions } = require('../utils/calculations');
const Baby = require('../models/Baby');

/**
 * Calculate age in months between two dates with decimal precision
 * e.g. baby aged 6 months and 15 days → 6.5 months
 */
const calcAgeInMonths = (dateOfBirth, measurementDate) => {
  const dob = new Date(dateOfBirth);
  const mDate = new Date(measurementDate);
  const months =
    (mDate.getFullYear() - dob.getFullYear()) * 12 +
    (mDate.getMonth() - dob.getMonth()) +
    (mDate.getDate() - dob.getDate()) / 30.44;
  return Math.max(0, parseFloat(months.toFixed(2)));
};

// Add new measurement
router.post('/', async (req, res, next) => {
  try {
    const { dateOfBirth, ...measurementData } = req.body; // strip DOB — don't persist it

    // Auto-calculate ageInMonths if dateOfBirth was provided
    if (dateOfBirth && measurementData.measurementDate) {
      measurementData.ageInMonths = calcAgeInMonths(dateOfBirth, measurementData.measurementDate);
    }

    const measurement = new Measurement(measurementData);
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
    const { dateOfBirth, ...updateData } = req.body; // strip DOB — don't persist it

    // Recalculate ageInMonths if dateOfBirth and a date are available
    const dateToUse = updateData.measurementDate;
    if (dateOfBirth && dateToUse) {
      updateData.ageInMonths = calcAgeInMonths(dateOfBirth, dateToUse);
    } else if (dateOfBirth) {
      // If no new measurementDate in the update, fetch the existing one
      const existing = await Measurement.findById(req.params.id).select('measurementDate');
      if (existing?.measurementDate) {
        updateData.ageInMonths = calcAgeInMonths(dateOfBirth, existing.measurementDate);
      }
    }

    const measurement = await Measurement.findByIdAndUpdate(
      req.params.id,
      updateData,
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
