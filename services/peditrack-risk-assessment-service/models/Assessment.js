const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  userId: { type: String, default: null, index: true },
  child: {
    name: { type: String, default: null },
    age_months: { type: Number, default: null },
    weight_kg: { type: Number, default: null },
  },
  vitals: {
    temperature_c: { type: Number, default: null },
    heart_rate_bpm: { type: Number, default: null },
    respiratory_rate_bpm: { type: Number, default: null },
    spo2_percent: { type: Number, default: null },
    avpu: { type: String, enum: ['Alert', 'Voice', 'Pain', 'Unresponsive'], default: 'Alert' },
    pain_score: { type: Number, default: 0 },
  },
  symptoms: [{
    key: String,
    severity: String,
    details: String,
  }],
  danger_signs: [String],
  feeding: {
    feeding_normally: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    drinking_normally: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    urine_output_last_12h: { type: String, enum: ['normal', 'reduced', 'none', 'unknown'], default: 'unknown' },
  },
  context: {
    chronic_conditions: String,
    medications: String,
    recent_travel: String,
    environmental_exposures: String,
    onset: String,
    trend: String,
  },
  optional: {
    photo_uri: { type: String, default: null },
    timestamp: { type: String },
  },
  immediate_flag: { type: Boolean, default: false },
  // Backend response fields
  assessment_id: { type: String },
  risk_level: { type: String, enum: ['low', 'medium', 'high'] },
  risk_score: { type: Number },
  risk_scale: { type: String },
  reasons: [String],
  recommendations: [{
    code: String,
    label: String,
    urgency: String,
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Assessment', AssessmentSchema);
