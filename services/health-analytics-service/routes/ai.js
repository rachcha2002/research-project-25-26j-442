/**
 * routes/ai.js — AI endpoints for PediTrack health analytics.
 * Rewritten for the Unified Two-Model Architecture.
 */
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const mlSvc    = require('../services/mlService');
const Measurement = require('../models/Measurement');
const HealthRecord = require('../models/HealthRecord');
const Medication = require('../models/Medication');
const FeedingLog = require('../models/FeedingLog');
const SleepLog = require('../models/SleepLog');
const whoStd   = require('../utils/whoStandards');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Recommendation Engine
// ─────────────────────────────────────────────────────────────────────────────

function generateRecommendations(ra) {
  if (!ra) return [];
  const recs = [];
  
  if (ra.growth_disorder > 0.6) {
    recs.push({
      priority: 'high',
      title: 'Monitor Growth',
      description: 'Schedule a consultation with a pediatrician to monitor growth trajectory.',
      icon: '📏',
      actions: ['Review height and weight percentiles', 'Book pediatrician visit']
    });
  } else if (ra.growth_disorder > 0.3) {
    recs.push({
      priority: 'normal',
      title: 'Track Growth',
      description: 'Continue tracking height and weight monthly to ensure steady percentiles.',
      icon: '📈',
      actions: []
    });
  }

  if (ra.nutritional_deficiency > 0.6) {
    recs.push({
      priority: 'high',
      title: 'Review Nutrition',
      description: 'Review dietary intake and ensure infant receives adequate iron and macronutrients.',
      icon: '🥦',
      actions: ['Assess daily iron intake', 'Consult pediatric nutritionist']
    });
  } else if (ra.nutritional_deficiency > 0.3) {
    recs.push({
      priority: 'normal',
      title: 'Supplement Diet',
      description: 'Consider supplementing diet with varied nutrient-dense solid foods.',
      icon: '🥑',
      actions: []
    });
  }

  if (ra.developmental_delay > 0.6) {
    recs.push({
      priority: 'urgent',
      title: 'Developmental Check',
      description: "Discuss developmental milestones (motor and cognitive) with your child's doctor.",
      icon: '🧠',
      actions: ['Review milestone checklist', 'Schedule developmental screening']
    });
  }

  if (ra.behavioral_issue > 0.6) {
    recs.push({
      priority: 'high',
      title: 'Behavioral Monitoring',
      description: 'Monitor sleep quality and daily behavior patterns closely.',
      icon: '💤',
      actions: ['Keep a sleep log', 'Note any behavioral triggers']
    });
  }

  if (recs.length === 0) {
    recs.push({
      priority: 'normal',
      title: 'Healthy Routine',
      description: 'Maintain current healthy routines and attend scheduled checkups.',
      icon: '⭐',
      actions: []
    });
  }
  
  return recs;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Verify PRO Status
// ─────────────────────────────────────────────────────────────────────────────

async function getBabyAndCheckPro(babyId, res) {
  try {
    const usersDb = mongoose.connection.useDb('peditrack_users');
    const babyProfile = await usersDb.collection('babyprofiles').findOne({ _id: new mongoose.Types.ObjectId(babyId) });
    
    if (!babyProfile) {
      res.status(404).json({ error: 'Baby not found' });
      return null;
    }

    if (babyProfile.userId) {
      const user = await usersDb.collection('users').findOne({ _id: new mongoose.Types.ObjectId(babyProfile.userId) });
      if (!user || user.isPro !== true) {
        res.status(403).json({ error: 'PRO Version required to access AI Insights.' });
        return null;
      }
    }

    return babyProfile;
  } catch (err) {
    console.error('PRO verification error:', err);
    res.status(500).json({ error: 'Internal error verifying PRO status' });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Gather comprehensive baby data for ML Service
// ─────────────────────────────────────────────────────────────────────────────

async function runPrediction(babyId, babyProfile) {
  const measurements = await Measurement.find({ babyId }).sort({ measurementDate: 1 }).lean();
  
  const healthRecords = await HealthRecord.find({ babyId, status: 'Active' }).lean();
  const medications = await Medication.find({ babyId, status: 'Active' }).lean();
  
  // Get the most recent 30 days of logs to average/detect behaviors
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const feedingLogs = await FeedingLog.find({ babyId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).lean();
  const sleepLogs = await SleepLog.find({ babyId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).lean();

  const has_asthma = healthRecords.some(r => r.conditionName?.toLowerCase().includes('asthma')) ? 1 : 0;
  const chronic_conditions_count = healthRecords.filter(r => r.severity === 'chronic' || r.severity === 'High').length;
  // Look at medications for supplements OR feeding logs
  let takes_supplements = medications.some(m => m.medicationName?.toLowerCase().includes('vitamin') || m.medicationName?.toLowerCase().includes('supplement')) ? 1 : 0;
  if (!takes_supplements && feedingLogs.length > 0) {
     takes_supplements = feedingLogs.some(log => log.supplements && log.supplements.length > 0) ? 1 : 0;
  }
  
  const has_food_allergies = healthRecords.some(r => r.conditionName?.toLowerCase().includes('allerg')) ? 1 : 0;
  const was_premature = babyProfile.birthDetails?.wasPremature ? 1 : 0;
  const birth_weight_kg = babyProfile.birthDetails?.weightAtBirth || 3.0;
  
  // -- SLEEP MAPPING (Based on Python Notebook Logic) --
  // Q19: sleep_dur.str.contains('10-11|11-12|පැය 10').fillna(False)
  // Q20: sleep_qual.str.contains('frequently|difficulty|නිතර').fillna(False)
  let adequate_sleep = 1;
  let poor_sleep_quality = 0;
  if (sleepLogs.length > 0) {
      const latestSleep = sleepLogs[0];
      adequate_sleep = latestSleep.hours >= 10 ? 1 : 0;
      poor_sleep_quality = ['wakesFrequently', 'difficultyFallingAsleep', 'restless'].includes(latestSleep.quality) ? 1 : 0;
  }

  // -- NUTRITION MAPPING (Based on Python Notebook Logic) --
  let rice_adequate = 0, carbs_adequate = 0, protein_adequate = 0, eggs_adequate = 0;
  let dhal_adequate = 0, milk_adequate = 0, dairy_adequate = 0, fruits_adequate = 0, vegetables_adequate = 0;
  let food_security = 1.0; // By default adequate if no logs

  if (feedingLogs.length > 0) {
    const log = feedingLogs[0]; // Take most recent
    rice_adequate = ['1.5', '2', '2.5', '3', '3plus'].includes(log.ricePortions) ? 1 : 0;
    carbs_adequate = log.otherCarbs && log.otherCarbs !== 'rarely' ? 1 : 0;
    protein_adequate = ['2to3', '3plus'].includes(log.proteinMeat) ? 1 : 0;
    eggs_adequate = ['3to5', '6to7', '7plus'].includes(log.eggsPerWeek) ? 1 : 0; // Usually recorded weekly but field holds enum
    dhal_adequate = ['daily', '3to5perWeek'].includes(log.lentils) ? 1 : 0;
    milk_adequate = ['1to2', '2to3', '3plus'].includes(log.milkCups) ? 1 : 0;
    dairy_adequate = log.otherDairy && log.otherDairy !== 'never' && log.otherDairy !== 'rarely' ? 1 : 0;
    fruits_adequate = ['2', '3plus'].includes(log.fruitServings) ? 1 : 0;
    vegetables_adequate = ['with2meals', 'withAllMeals'].includes(log.vegServings) ? 1 : 0;
    
    const nutrition_sum = rice_adequate + carbs_adequate + protein_adequate + eggs_adequate + 
                          dhal_adequate + milk_adequate + dairy_adequate + fruits_adequate + vegetables_adequate;
    food_security = nutrition_sum >= 5 ? 1.0 : 0.0;
  }

  // Keep Node.js floating point age (e.g. 4.53) for the scikit-learn continuous scaler
  const formattedMeasurements = measurements.map(m => ({
    age_months: m.ageInMonths || 0,
    height_cm: m.height?.value ?? m.height,
    weight_kg: m.weight?.value ?? m.weight,
    bmi: m.bmi || ((m.weight?.value ?? m.weight) / Math.pow((m.height?.value ?? m.height)/100, 2)),
    gender: babyProfile.gender === 'male' ? 1 : 0,
    has_asthma,
    chronic_conditions_count,
    food_security,
    data_type: 1, // 1 = longitudinal (model was trained mapped to cross-sectional or longitudinal string, but scaler expects 1)
    takes_supplements,
  }));

  const babyData = {
    measurements: formattedMeasurements,
    rice_adequate, carbs_adequate, protein_adequate, eggs_adequate,
    dhal_adequate, milk_adequate, dairy_adequate, fruits_adequate,
    vegetables_adequate, 
    has_food_allergies, 
    birth_weight_kg,
    was_premature, 
    immunization_complete: 1, // Assumption unless tracking system built
    delayed_walking: 0, // Need developmental milestones tracker to be accessed (defaults 0)
    takes_supplements, 
    adequate_sleep, 
    poor_sleep_quality,
    hospitalizations_count: 0, 
    doctor_concern_any: 0
  };

  const result = await mlSvc.predict(babyId, babyData);
  return { result, measurements };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.get('/health-score/:babyId', async (req, res) => {
  try {
    const { babyId } = req.params;
    const babyProfile = await getBabyAndCheckPro(babyId, res);
    if (!babyProfile) return;

    const { result } = await runPrediction(babyId, babyProfile);

    // If < 2 measurements, ML service returns risk_assessment: null
    if (!result.risk_assessment) {
      return res.status(400).json({ error: 'Need 2+ measurements for health score & risks', currentCount: result.min_measurements_for_risks });
    }

    const { growth_disorder, nutritional_deficiency, developmental_delay, behavioral_issue } = result.risk_assessment;

    res.json({
      healthScore: result.health_score,
      riskLevel: result.health_score >= 80 ? 'low' : result.health_score >= 60 ? 'moderate' : 'high',
      confidence: 92, // AUC 0.92
      confidenceLevel: 'high',
      modelUsed: 'two_model_v1',
      cached: result.cached ?? false,
      factors: {
        growth: Math.round((1 - growth_disorder) * 100),
        nutrition: Math.round((1 - nutritional_deficiency) * 100),
        development: Math.round((1 - developmental_delay) * 100),
        behavior: Math.round((1 - behavioral_issue) * 100),
      },
      lastCalculated: new Date(),
    });
  } catch (err) {
    console.error('[ai/health-score]', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/predictions/:babyId', async (req, res) => {
  try {
    const { babyId } = req.params;
    const babyProfile = await getBabyAndCheckPro(babyId, res);
    if (!babyProfile) return;

    const { result, measurements } = await runPrediction(babyId, babyProfile);

    if (!result.growth_forecast) {
      return res.status(400).json({
        error: 'Need 4+ measurements for growth predictions',
        currentCount: measurements.length,
        needed: 4,
      });
    }

    const latest = measurements[measurements.length - 1];

    let trajectory = { months: [], heights: [], weights: [], confidences: [] };
    let threeMonths = null, sixMonths = null, twelveMonths = null;

    if (result.growth_forecast) {
      const h0 = latest.height?.value ?? latest.height;
      const w0 = latest.weight?.value ?? latest.weight;
      
      const rawH3 = result.growth_forecast.next_height;
      const rawW3 = result.growth_forecast.next_weight;

      // Minimum realistic growth over 3 months if AI outputs anomaly/shrinkage
      const h3 = rawH3 <= h0 ? h0 + 1.5 : rawH3;
      const w3 = rawW3 <= w0 ? w0 + 0.4 : rawW3;
      
      // Calculate monthly delta to synthesize future milestones for the UI chart
      const dh = (h3 - h0) / 3;
      const dw = (w3 - w0) / 3;
      
      const h6 = h3 + dh * 3;
      const w6 = w3 + dw * 3;
      const h9 = h6 + dh * 3;
      const w9 = w6 + dw * 3;
      const h12 = h9 + dh * 3;
      const w12 = w9 + dw * 3;
      
      threeMonths = { height_cm: h3, weight_kg: w3, bmi: result.growth_forecast.next_bmi, confidence: 0.90 };
      sixMonths =   { height_cm: h6, weight_kg: w6, bmi: w6 / Math.pow(h6/100, 2), confidence: 0.82 };
      twelveMonths = { height_cm: h12, weight_kg: w12, bmi: w12 / Math.pow(h12/100, 2), confidence: 0.60 };
      
      const allMonths = [];
      const allHeights = [];
      const allWeights = [];
      const allConf = [];

      // Append up to 3 historical points for the chart context
      const history = measurements.slice(0, -1).slice(-3);
      history.forEach((m, idx) => {
        allMonths.push(`-` + (history.length - idx) + `m`); // e.g. -2m, -1m
        allHeights.push(m.height?.value ?? m.height);
        allWeights.push(m.weight?.value ?? m.weight);
        allConf.push(1.0);
      });

      // Append current and future
      allMonths.push('Now', '+3m', '+6m', '+9m', '+12m');
      allHeights.push(h0, h3, h6, h9, h12);
      allWeights.push(w0, w3, w6, w9, w12);
      allConf.push(1.0, 0.90, 0.82, 0.75, 0.60);

      trajectory = {
         months: allMonths,
         heights: allHeights,
         weights: allWeights,
         confidences: allConf
      };
    }

    res.json({
      current: {
        height:  latest.height?.value ?? latest.height,
        weight:  latest.weight?.value ?? latest.weight,
        bmi:     latest.bmi,
        date:    latest.measurementDate,
        ageMonths: latest.ageInMonths,
      },
      predictions: {
        threeMonths:  threeMonths,
        sixMonths:    sixMonths,
        twelveMonths: twelveMonths,
      },
      trajectory: trajectory,
      // We pass the risk scores here to maintain shape compatibility, though risks route is preferred
      riskScores: result.risk_assessment ? {
        growth_disorder: { score: result.risk_assessment.growth_disorder },
        developmental_delay: { score: result.risk_assessment.developmental_delay },
        nutritional_deficiency: { score: result.risk_assessment.nutritional_deficiency },
        behavioral_issue: { score: result.risk_assessment.behavioral_issue }
      } : null,
      healthScore: result.health_score,
      warnings: [],
      recommendations: generateRecommendations(result.risk_assessment),
      cached: result.cached ?? false,
      lastCalculated: new Date(),
    });
  } catch (err) {
    console.error('[ai/predictions]', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/risks/:babyId', async (req, res) => {
  try {
    const { babyId } = req.params;
    const babyProfile = await getBabyAndCheckPro(babyId, res);
    if (!babyProfile) return;

    const { result } = await runPrediction(babyId, babyProfile);
    
    if (!result.risk_assessment) {
      return res.status(400).json({ error: 'Need 2+ measurements for risks' });
    }

    const ra = result.risk_assessment;
    const avgRisk = (ra.growth_disorder + ra.developmental_delay + ra.nutritional_deficiency + ra.behavioral_issue) / 4;
    const overallRisk = avgRisk < 0.30 ? 'low' : avgRisk < 0.60 ? 'moderate' : 'high';

    res.json({
      overallRisk,
      overallScore: Math.round(avgRisk * 100),
      healthScore: result.health_score,
      riskCategories: {
        growth:      { score: ra.growth_disorder, level: ra.growth_disorder > 0.6 ? 'high' : 'low' },
        nutrition:   { score: ra.nutritional_deficiency, level: ra.nutritional_deficiency > 0.6 ? 'high' : 'low' },
        development: { score: ra.developmental_delay, level: ra.developmental_delay > 0.6 ? 'high' : 'low' },
        behavioral:  { score: ra.behavioral_issue, level: ra.behavioral_issue > 0.6 ? 'high' : 'low' },
      },
      recommendations: generateRecommendations(ra),
      confidence: 92,
      confidenceLevel: 'high',
      modelUsed: 'srilanka_risks.keras',
      cached: result.cached ?? false,
      lastCalculated: new Date(),
    });
  } catch (err) {
    console.error('[ai/risks]', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/status', async (_req, res) => {
  const status = await mlSvc.healthCheck();
  res.json(status);
});

module.exports = router;
