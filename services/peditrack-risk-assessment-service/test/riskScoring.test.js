const test = require('node:test');
const assert = require('node:assert/strict');

const { assessRisk } = require('../utils/riskScoring');

test('returns high risk and immediate flag when danger signs are present', () => {
  const result = assessRisk({
    vitals: {},
    danger_signs: ['convulsion'],
  });

  assert.equal(result.risk_level, 'high');
  assert.equal(result.immediate_flag, true);
  assert.equal(result.risk_score, 0);
});

test('returns medium risk for borderline ED-PEWS score (3 points)', () => {
  const result = assessRisk({
    vitals: {
      temperature_c: 38.5,
      heart_rate_bpm: 95,
      respiratory_rate_bpm: 55,
      spo2_percent: 98,
      avpu: 'Alert',
      pain_score: 0,
    },
    danger_signs: [],
  });

  assert.equal(result.risk_score, 3);
  assert.equal(result.risk_level, 'medium');
  assert.equal(result.immediate_flag, false);
});

test('upgrades base risk using high-risk skin model prediction', () => {
  const result = assessRisk({
    vitals: {
      temperature_c: 37,
      heart_rate_bpm: 120,
      respiratory_rate_bpm: 35,
      spo2_percent: 98,
      avpu: 'Alert',
      pain_score: 1,
    },
    danger_signs: [],
    skin_findings: {
      predicted_class: 'Bullous_Disease',
      confidence: 0.91,
    },
  });

  assert.equal(result.risk_score, 0);
  assert.equal(result.risk_level, 'high');
  assert.ok(result.reasons.some((reason) => reason.includes('Bullous_Disease')));
});

test('adds clinical skin evaluation recommendation when skin confidence is very low', () => {
  const result = assessRisk({
    vitals: {},
    danger_signs: [],
    skin_findings: {
      predicted_class: 'Eczema_Atopic_Dermatitis',
      confidence: 0.2,
    },
  });

  const hasSkinEvalRecommendation = result.recommendations.some(
    (recommendation) => recommendation.code === 'CLINICAL_SKIN_EVAL'
  );

  assert.equal(result.risk_level, 'low');
  assert.equal(hasSkinEvalRecommendation, true);
  assert.ok(result.reasons.some((reason) => reason.includes('inconclusive')));
});
