// ED-PEWS and WHO ETAT scoring logic

function calculateEDPEWS(vitals) {
  // Example scoring (simplified):
  let score = 0;
  let reasons = [];

  // Temperature
  if (vitals.temperature_c !== null) {
    if (vitals.temperature_c < 36) {
      score += 2;
      reasons.push('Low temperature');
    } else if (vitals.temperature_c > 38) {
      score += 1;
      reasons.push('High temperature');
    }
  }

  // Heart rate
  if (vitals.heart_rate_bpm !== null) {
    if (vitals.heart_rate_bpm < 80 || vitals.heart_rate_bpm > 160) {
      score += 2;
      reasons.push('Abnormal heart rate');
    } else if (vitals.heart_rate_bpm < 100 || vitals.heart_rate_bpm > 140) {
      score += 1;
      reasons.push('Borderline heart rate');
    }
  }

  // Respiratory rate
  if (vitals.respiratory_rate_bpm !== null) {
    if (vitals.respiratory_rate_bpm < 20 || vitals.respiratory_rate_bpm > 60) {
      score += 2;
      reasons.push('Abnormal respiratory rate');
    } else if (vitals.respiratory_rate_bpm < 30 || vitals.respiratory_rate_bpm > 50) {
      score += 1;
      reasons.push('Borderline respiratory rate');
    }
  }

  // SpO2
  if (vitals.spo2_percent !== null) {
    if (vitals.spo2_percent < 92) {
      score += 2;
      reasons.push('Low SpO2');
    } else if (vitals.spo2_percent < 95) {
      score += 1;
      reasons.push('Borderline SpO2');
    }
  }

  // AVPU
  if (vitals.avpu && vitals.avpu !== 'Alert') {
    score += 3;
    reasons.push('Altered consciousness (AVPU)');
  }

  // Pain score
  if (vitals.pain_score !== null && vitals.pain_score > 5) {
    score += 1;
    reasons.push('High pain score');
  }

  return { score, reasons };
}

function checkETAT(danger_signs) {
  // If any danger sign present, immediate flag
  return Array.isArray(danger_signs) && danger_signs.length > 0;
}

function generateRecommendations(risk_level, reasons) {
  // Example recommendations
  if (risk_level === 'high') {
    return [{ code: 'ER', label: 'Seek emergency care immediately', urgency: 'critical' }];
  } else if (risk_level === 'medium') {
    return [{ code: 'GP', label: 'Consult a pediatrician soon', urgency: 'moderate' }];
  } else {
    return [{ code: 'HOME', label: 'Monitor at home, follow care advice', urgency: 'low' }];
  }
}

function assessRisk(payload) {
  const { vitals, danger_signs } = payload;
  const edpews = calculateEDPEWS(vitals);
  const etatFlag = checkETAT(danger_signs);

  let risk_level = 'low';
  let immediate_flag = etatFlag;

  if (immediate_flag || edpews.score >= 6) {
    risk_level = 'high';
  } else if (edpews.score >= 3) {
    risk_level = 'medium';
  }

  const recommendations = generateRecommendations(risk_level, edpews.reasons);

  return {
    risk_score: edpews.score,
    risk_level,
    immediate_flag,
    reasons: edpews.reasons,
    recommendations,
  };
}

module.exports = {
  assessRisk,
};
