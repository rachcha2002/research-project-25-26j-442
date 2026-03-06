// ED-PEWS and WHO ETAT scoring logic + skin-condition model risk merge

const RISK_RANK = {
  low: 1,
  medium: 2,
  high: 3,
};

// Keep these 6 labels aligned with your EfficientNet-B0 training classes.
const SKIN_CLASS_RISK_MAP = {
  // Model labels currently produced by condition_mapping.json
  Acne_Rosacea: 'low',
  Atopic_Dermatitis: 'low',
  Bullous_Disease: 'high',
  Cellulitis_Impetigo: 'high',
  Eczema: 'low',
  Fungal_Infections: 'medium',
};

function getHigherRisk(a, b) {
  const safeA = RISK_RANK[a] ? a : 'low';
  const safeB = RISK_RANK[b] ? b : 'low';
  return RISK_RANK[safeA] >= RISK_RANK[safeB] ? safeA : safeB;
}

function getSkinModelRisk(skin_findings) {
  if (!skin_findings || typeof skin_findings !== 'object') {
    return { risk_level: null, reasons: [] };
  }

  const predictedClass =
    typeof skin_findings.predicted_class === 'string' ? skin_findings.predicted_class : null;
  const confidence =
    typeof skin_findings.confidence === 'number' ? skin_findings.confidence : null;

  if (!predictedClass) {
    return { risk_level: null, reasons: [] };
  }

  const mappedRisk = SKIN_CLASS_RISK_MAP[predictedClass] || 'medium';
  const reasons = [];

  if (confidence !== null) {
    reasons.push(
      `Skin model predicted ${predictedClass} (${Math.round(confidence * 100)}% confidence)`
    );
  } else {
    reasons.push(`Skin model predicted ${predictedClass}`);
  }

  // Confidence guard: low-confidence predictions are treated conservatively.
  if (confidence !== null && confidence < 0.55) {
    reasons.push('Skin model confidence is low; risk adjusted conservatively');
    return { risk_level: getHigherRisk(mappedRisk, 'medium'), reasons };
  }

  return { risk_level: mappedRisk, reasons };
}

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
  const { vitals = {}, danger_signs = [], skin_findings = null } = payload || {};
  const edpews = calculateEDPEWS(vitals);
  const etatFlag = checkETAT(danger_signs);
  const skinRisk = getSkinModelRisk(skin_findings);

  let risk_level = 'low';
  let immediate_flag = etatFlag;

  if (immediate_flag || edpews.score >= 6) {
    risk_level = 'high';
  } else if (edpews.score >= 3) {
    risk_level = 'medium';
  }

  if (skinRisk.risk_level) {
    risk_level = getHigherRisk(risk_level, skinRisk.risk_level);
  }

  const mergedReasons = [...edpews.reasons, ...skinRisk.reasons];
  const recommendations = generateRecommendations(risk_level, mergedReasons);

  return {
    risk_score: edpews.score,
    risk_level,
    immediate_flag,
    reasons: mergedReasons,
    recommendations,
  };
}

module.exports = {
  assessRisk,
};
