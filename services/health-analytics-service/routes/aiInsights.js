const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AIInsight = require('../models/AIInsight');
const Measurement = require('../models/Measurement');
const HealthRecord = require('../models/HealthRecord');
const Medication = require('../models/Medication');
const FeedingLog = require('../models/FeedingLog');
const SleepLog = require('../models/SleepLog');
const mlSvc = require('../services/mlService');

// Generate AI insights for a baby (uses the real ML neural-network service)
router.post('/generate/:babyId', async (req, res, next) => {
  try {
    const babyId = req.params.babyId;

    // Verify baby exists and resolve profile
    const usersDb = mongoose.connection.useDb('peditrack_users');
    const babyProfile = await usersDb.collection('babyprofiles').findOne(
      { _id: new mongoose.Types.ObjectId(babyId) }
    );
    if (!babyProfile) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    const measurements = await Measurement.find({ babyId })
      .sort({ measurementDate: 1 })
      .lean();

    if (measurements.length < 2) {
      return res.status(400).json({
        error: 'Need at least 2 measurements to generate insights',
      });
    }

    const healthRecords = await HealthRecord.find({ babyId, status: 'Active' }).lean();
    const medications = await Medication.find({ babyId, status: 'Active' }).lean();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const feedingLogs = await FeedingLog.find({ babyId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).lean();
    const sleepLogs  = await SleepLog.find({ babyId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).lean();

    // Build a minimal babyData payload (mirrors runPrediction in routes/ai.js)
    const has_asthma = healthRecords.some(r => r.conditionName?.toLowerCase().includes('asthma')) ? 1 : 0;
    const chronic_conditions_count = healthRecords.filter(r => r.conditionType === 'chronic').length;
    let takes_supplements = medications.some(
      m => m.medicationName?.toLowerCase().includes('vitamin') || m.medicationName?.toLowerCase().includes('supplement')
    ) ? 1 : 0;
    if (!takes_supplements && feedingLogs.length > 0) {
      takes_supplements = feedingLogs.some(log => log.supplements && log.supplements.length > 0) ? 1 : 0;
    }
    const has_food_allergies = healthRecords.some(r => r.conditionName?.toLowerCase().includes('allerg')) ? 1 : 0;
    const was_premature    = babyProfile.birthDetails?.wasPremature ? 1 : 0;
    const birth_weight_kg  = babyProfile.birthDetails?.weightAtBirth || 3.0;
    const adequate_sleep   = sleepLogs.length > 0 ? (sleepLogs[0].hours >= 10 ? 1 : 0) : 1;
    const poor_sleep_quality = sleepLogs.length > 0
      ? (['wakesFrequently', 'difficultyFallingAsleep', 'restless'].includes(sleepLogs[0].quality) ? 1 : 0)
      : 0;

    const formattedMeasurements = measurements.map(m => ({
      age_months: m.ageInMonths || 0,
      height_cm:  m.height?.value ?? m.height,
      weight_kg:  m.weight?.value ?? m.weight,
      bmi:        m.bmi || ((m.weight?.value ?? m.weight) / Math.pow((m.height?.value ?? m.height) / 100, 2)),
      gender:     babyProfile.gender === 'male' ? 1 : 0,
      has_asthma,
      chronic_conditions_count,
      food_security: 1,
      data_type:  1,
      takes_supplements,
    }));

    const babyData = {
      measurements: formattedMeasurements,
      has_food_allergies, birth_weight_kg, was_premature,
      immunization_complete: 1, delayed_walking: 0,
      takes_supplements, adequate_sleep, poor_sleep_quality,
      hospitalizations_count: 0, doctor_concern_any: 0,
      rice_adequate: 0, carbs_adequate: 0, protein_adequate: 0,
      eggs_adequate: 0, dhal_adequate: 0, milk_adequate: 0,
      dairy_adequate: 0, fruits_adequate: 0, vegetables_adequate: 0,
    };

    const mlResult = await mlSvc.predict(babyId, babyData);
    const insights = [];

    // Growth insight (requires ≥ 3 measurements)
    if (mlResult.growth_forecast) {
      const latest = measurements[measurements.length - 1];
      const h0 = latest.height?.value ?? latest.height;
      const w0 = latest.weight?.value ?? latest.weight;
      const h3 = mlResult.growth_forecast.next_height <= h0 ? h0 + 1.5 : mlResult.growth_forecast.next_height;
      const w3 = mlResult.growth_forecast.next_weight <= w0 ? w0 + 0.4 : mlResult.growth_forecast.next_weight;

      const growthInsight = new AIInsight({
        babyId,
        insightType: 'growth_prediction',
        title: '3-Month Growth Forecast',
        description: `Based on ${measurements.length} measurements, we predict your baby will be approximately ${h3.toFixed(1)} cm tall and weigh ${w3.toFixed(1)} kg in 3 months.`,
        confidenceScore: 90,
        severity: 'info',
        predictions: { next_height: h3, next_weight: w3, next_bmi: mlResult.growth_forecast.next_bmi },
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        relatedMeasurementIds: measurements.slice(-5).map(m => m._id),
      });
      await growthInsight.save();
      insights.push(growthInsight);
    }

    // Risk insight (requires ≥ 2 measurements)
    if (mlResult.risk_assessment) {
      const ra = mlResult.risk_assessment;
      const highRisks = Object.entries(ra)
        .filter(([, v]) => v > 0.6)
        .map(([k]) => k.replace(/_/g, ' '));

      if (highRisks.length > 0) {
        const riskInsight = new AIInsight({
          babyId,
          insightType: 'health_alert',
          title: 'Health Risk Alert',
          description: `Elevated risk detected: ${highRisks.join(', ')}. Consider consulting a pediatrician.`,
          confidenceScore: Math.round(mlResult.health_score),
          severity: 'warning',
          status: 'active',
          relatedMeasurementIds: measurements.slice(-3).map(m => m._id),
        });
        await riskInsight.save();
        insights.push(riskInsight);
      }
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
