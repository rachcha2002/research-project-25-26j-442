const mongoose = require('mongoose');

const AssessmentReportSchema = new mongoose.Schema(
  {
    assessment_id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: null, index: true },
    child: {
      name: { type: String, default: null },
      age_months: { type: Number, default: null },
      weight_kg: { type: Number, default: null },
    },
    assessment: {
      date: { type: String, required: true },
      risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
      score: { type: Number, required: true },
      summary: { type: String, default: '' },
      dangerSigns: [{ type: String }],
      symptoms: [
        {
          label: { type: String },
          severity: { type: String },
        },
      ],
      vitals: {
        temperature: { type: Number, default: null },
        heartRate: { type: Number, default: null },
        respRate: { type: Number, default: null },
        spo2: { type: Number, default: null },
        avpu: { type: String, default: null },
        pain: { type: Number, default: null },
      },
      feeding: {
        feedingNormally: { type: String, default: 'unknown' },
        drinkingNormally: { type: String, default: 'unknown' },
        urineOutput: { type: String, default: 'unknown' },
      },
      context: {
        chronicConditions: { type: String, default: '' },
        medications: { type: String, default: '' },
        recentTravel: { type: String, default: '' },
        exposures: { type: String, default: '' },
        onset: { type: String, default: '' },
        trend: { type: String, default: '' },
      },
      skinFindings: {
        predictedClass: { type: String, default: null },
        confidence: { type: Number, default: null },
        model: { type: String, default: null },
        version: { type: String, default: null },
      },
      reasons: [{ type: String }],
      recommendations: [
        {
          code: { type: String },
          label: { type: String },
          urgency: { type: String },
        },
      ],
    },
  },
  {
    timestamps: true,
    collection: 'assessment reports',
  }
);

module.exports = mongoose.model('AssessmentReport', AssessmentReportSchema);