/**
 * featureBuilder.js — Maps MongoDB baby data → ML model feature vectors.
 *
 * DNN (15 features): used when baby has < 4 measurements
 * LSTM (3×9 matrix): used when baby has ≥ 4 measurements
 */
const Measurement  = require('../models/Measurement');
const HealthRecord = require('../models/HealthRecord');
const Medication   = require('../models/Medication');
const Vaccination  = require('../models/Vaccination');
const FeedingLog   = require('../models/FeedingLog');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function ageInMonths(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  return (now.getFullYear() - dob.getFullYear()) * 12 +
         (now.getMonth() - dob.getMonth());
}

function hasCondition(records, terms) {
  const t = terms.map(s => s.toLowerCase());
  return records.some(r =>
    t.some(term =>
      (r.diagnosis || '').toLowerCase().includes(term) ||
      (r.symptoms || []).some(s =>
        (typeof s === 'string' ? s : s.name || '').toLowerCase().includes(term)
      )
    )
  ) ? 1 : 0;
}

function hasMedication(medications, terms) {
  const t = terms.map(s => s.toLowerCase());
  return medications.some(m => t.some(term => m.name.toLowerCase().includes(term))) ? 1 : 0;
}

async function estimateFoodSecurity(babyId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const logs = await FeedingLog.find({ babyId, date: { $gte: sevenDaysAgo } }).lean();
  if (logs.length < 5) return 0; // fewer than 5 days logged = insecure
  const adequate = logs.every(log => log.ricePortions || log.proteinMeat || log.milkCups);
  return adequate ? 1 : 0;
}

async function vaccinationCompliance(babyId) {
  const vax = await Vaccination.find({ babyId }).lean();
  if (!vax.length) return 0;
  const completed = vax.filter(v => v.status === 'completed').length;
  return completed / vax.length >= 0.8 ? 1 : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// DNN — 15 features
// ─────────────────────────────────────────────────────────────────────────────

async function buildDNNFeatures(babyId, latestMeasurement, babyProfile) {
  const [records, meds] = await Promise.all([
    HealthRecord.find({ babyId, status: 'active' }).lean(),
    Medication.find({ babyId, status: 'active' }).lean(),
  ]);

  const [immComplete, foodSec] = await Promise.all([
    vaccinationCompliance(babyId),
    estimateFoodSecurity(babyId),
  ]);

  return {
    height_cm:                latestMeasurement.height?.value ?? latestMeasurement.height,
    weight_kg:                latestMeasurement.weight?.value ?? latestMeasurement.weight,
    bmi:                      latestMeasurement.bmi ?? 0,
    age_months:               ageInMonths(babyProfile.dateOfBirth),
    gender:                   babyProfile.gender === 'male' ? 1 : 0,
    has_asthma:               hasCondition(records, ['asthma']),
    has_food_allergies:       babyProfile.allergies?.length > 0 ? 1 : 0,
    birth_weight_kg:          babyProfile.birthWeight ?? 3.0,
    was_premature:            babyProfile.isPremature ? 1 : 0,
    immunization_complete:    immComplete,
    chronic_conditions_count: records.length,
    family_income_ratio:      2.5,   // default — not collected
    parent_education:         2,     // default — medium
    health_insurance:         1,     // default — assumed insured
    food_security:            foodSec,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LSTM — 3×9 matrix from last 4+ measurements
// ─────────────────────────────────────────────────────────────────────────────

async function buildLSTMSequence(babyId, babyProfile) {
  const measurements = await Measurement.find({ babyId })
    .sort({ measurementDate: -1 })
    .limit(4)
    .lean();

  if (measurements.length < 4) {
    throw new Error('LSTM requires ≥ 4 measurements; use DNN instead');
  }

  const [records, meds] = await Promise.all([
    HealthRecord.find({ babyId, status: 'active' }).lean(),
    Medication.find({ babyId, status: 'active' }).lean(),
  ]);

  const hasRespiratory = hasCondition(records, ['asthma', 'bronchitis', 'pneumonia', 'respiratory']);
  const hasInfection   = hasCondition(records, ['infection', 'viral', 'bacterial']);
  const onAntibiotics  = hasMedication(meds, ['amoxicillin', 'azithromycin', 'antibiotic', 'penicillin']);
  const onSteroids     = hasMedication(meds, ['prednisone', 'dexamethasone', 'steroid', 'prednisolone']);

  // Chronological order (oldest → newest), use last 3 of the 4 fetched
  const orderedMeasurements = [...measurements].reverse().slice(-3);

  const sequence = orderedMeasurements.map(m => [
    m.height?.value  ?? m.height,
    m.weight?.value  ?? m.weight,
    m.bmi            ?? 0,
    hasRespiratory,
    hasInfection,
    records.length,
    onAntibiotics,
    onSteroids,
    meds.length,
  ]);

  return {
    sequence,
    age_months: ageInMonths(babyProfile.dateOfBirth),
    gender:     babyProfile.gender === 'male' ? 1 : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LATEST MEASUREMENT (convenience)
// ─────────────────────────────────────────────────────────────────────────────

async function getLatestMeasurement(babyId) {
  return Measurement.findOne({ babyId }).sort({ measurementDate: -1 }).lean();
}

async function getMeasurementCount(babyId) {
  return Measurement.countDocuments({ babyId });
}

module.exports = {
  buildDNNFeatures,
  buildLSTMSequence,
  getLatestMeasurement,
  getMeasurementCount,
  ageInMonths,
};
