const express = require('express');
const router = express.Router();
const AIInsight = require('../models/AIInsight');
const Measurement = require('../models/Measurement');
const { generatePredictions } = require('../utils/calculations');
const Baby = require('../models/Baby');

// Generate AI insights for a baby
router.post('/generate/:babyId', async (req, res, next) => {
  try {
    const baby = await Baby.findById(req.params.babyId);
    if (!baby) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    // Get measurements
    const measurements = await Measurement.find({ babyId: req.params.babyId })
      .sort({ measurementDate: -1 })
      .limit(20);

    if (measurements.length < 3) {
      return res.status(400).json({ 
        error: 'Need at least 3 measurements to generate insights' 
      });
    }

    const insights = [];

    // Generate growth prediction insight
    const prediction6m = generatePredictions(measurements, 6, baby);
    if (prediction6m) {
      const growthInsight = new AIInsight({
        babyId: req.params.babyId,
        insightType: 'growth_prediction',
        title: '6-Month Growth Forecast',
        description: `Based on ${measurements.length} measurements, we predict your baby will be approximately ${prediction6m.metrics.height.predicted} cm tall and weigh ${prediction6m.metrics.weight.predicted} kg in 6 months.`,
        confidenceScore: prediction6m.confidence,
        severity: 'info',
        predictions: prediction6m,
        influenceFactors: prediction6m.influenceFactors,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        relatedMeasurementIds: measurements.slice(0, 5).map(m => m._id),
      });
      await growthInsight.save();
      insights.push(growthInsight);
    }

    // Check for potential growth alerts
    const latest = measurements[0];
    const heightPercentile = latest.percentiles?.height;
    
    if (heightPercentile && (heightPercentile < 5 || heightPercentile > 95)) {
      const alertInsight = new AIInsight({
        babyId: req.params.babyId,
        insightType: 'health_alert',
        title: 'Growth Percentile Alert',
        description: `Current height is at the ${heightPercentile}th percentile. Consider consulting with a pediatrician to ensure healthy growth.`,
        confidenceScore: 85,
        severity: heightPercentile < 5 ? 'medium' : 'low',
        status: 'active',
        recommendations: [
          {
            type: 'Schedule a pediatrician appointment',
            priority: 'medium',
          },
        ],
        relatedMeasurementIds: [latest._id],
      });
      await alertInsight.save();
      insights.push(alertInsight);
    }

    res.status(201).json(insights);
  } catch (error) {
    next(error);
  }
});

// Get all AI insights for a baby
router.get('/baby/:babyId', async (req, res, next) => {
  try {
    const insights = await AIInsight.find({ babyId: req.params.babyId })
      .sort({ generatedDate: -1 });
    res.json(insights);
  } catch (error) {
    next(error);
  }
});

// Get active/recent insights
router.get('/baby/:babyId/active', async (req, res, next) => {
  try {
    const insights = await AIInsight.find({ 
      babyId: req.params.babyId,
      status: 'active',
    }).sort({ generatedDate: -1 });
    
    // Filter out expired insights
    const now = new Date();
    const activeInsights = insights.filter(insight => {
      if (!insight.expiryDate) return true;
      return now <= insight.expiryDate;
    });
    
    res.json(activeInsights);
  } catch (error) {
    next(error);
  }
});

// Get specific insight
router.get('/:id', async (req, res, next) => {
  try {
    const insight = await AIInsight.findById(req.params.id)
      .populate('relatedMeasurementIds')
      .populate('relatedHealthRecordIds');
    
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    res.json(insight);
  } catch (error) {
    next(error);
  }
});

// Update insight status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, action, notes } = req.body;
    
    if (!['active', 'dismissed', 'acted_upon', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updateData = { status };
    
    if (action) {
      updateData.$push = {
        userActions: {
          action,
          date: new Date(),
          notes,
        },
      };
    }

    const insight = await AIInsight.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    res.json(insight);
  } catch (error) {
    next(error);
  }
});

// Delete insight
router.delete('/:id', async (req, res, next) => {
  try {
    const insight = await AIInsight.findByIdAndDelete(req.params.id);
    
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    res.json({ message: 'Insight deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
