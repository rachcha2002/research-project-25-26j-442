const express = require('express');
const router = express.Router();
const { calculateGrowthPercentiles } = require('../utils/whoGrowthService');

/**
 * POST /api/growth-standards/percentiles
 * Calculate WHO percentile curves for growth charts
 * 
 * Request body:
 * {
 *   gender: 'male' | 'female',
 *   birthDate: '2023-01-15',
 *   measurements: [
 *     { date: '2024-01-15', height: 85, weight: 12, headCircumference: 47 }
 *   ],
 *   metric: 'height' | 'weight' | 'bmi'
 * }
 */
router.post('/percentiles', async (req, res) => {
  try {
    const { gender, birthDate, measurements, metric } = req.body;

    // Validate required fields
    if (!gender || !birthDate || !measurements || !metric) {
      return res.status(400).json({
        error: 'Missing required fields: gender, birthDate, measurements, metric'
      });
    }

    // Validate gender
    if (gender !== 'male' && gender !== 'female') {
      return res.status(400).json({
        error: 'Gender must be either "male" or "female"'
      });
    }

    // Validate metric
    if (!['height', 'weight', 'bmi'].includes(metric)) {
      return res.status(400).json({
        error: 'Metric must be one of: height, weight, bmi'
      });
    }

    // Validate measurements array
    if (!Array.isArray(measurements) || measurements.length === 0) {
      return res.status(400).json({
        error: 'Measurements must be a non-empty array'
      });
    }

    // Calculate percentiles
    const chartData = await calculateGrowthPercentiles(
      gender,
      new Date(birthDate),
      measurements,
      metric
    );

    res.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Error calculating growth percentiles:', error);
    res.status(500).json({
      error: 'Failed to calculate growth percentiles',
      message: error.message
    });
  }
});

module.exports = router;
