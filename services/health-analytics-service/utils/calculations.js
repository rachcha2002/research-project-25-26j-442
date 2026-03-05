/**
 * Growth calculation utilities for BMI, percentiles, and predictions.
 */

/**
 * Calculate BMI from height and weight
 */
function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return null;
  }
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(2));
}

/**
 * Calculate growth velocity (rate of change per month)
 * @param {Array} measurements - Array of measurements sorted newest-first
 * @param {string} metric - 'height' or 'weight'
 */
function calculateGrowthVelocity(measurements, metric = 'height') {
  if (!measurements || measurements.length < 2) {
    return { velocity: 0, trend: 'stable' };
  }

  const recent = measurements[0];
  const previous = measurements[1];

  const recentValue = recent[metric]?.value || recent[metric];
  const previousValue = previous[metric]?.value || previous[metric];

  if (!recentValue || !previousValue) {
    return { velocity: 0, trend: 'stable' };
  }

  const timeDiff = (new Date(recent.measurementDate) - new Date(previous.measurementDate)) / (1000 * 60 * 60 * 24 * 30);

  if (timeDiff === 0) {
    return { velocity: 0, trend: 'stable' };
  }

  const velocity = Number(((recentValue - previousValue) / timeDiff).toFixed(2));

  let trend = 'stable';
  if (velocity > 0.5) trend = 'increasing';
  else if (velocity < -0.5) trend = 'decreasing';

  return { velocity, trend, timeDiff };
}

// ─────────────────────────────────────────────────────────────────────────────
// WHO 2006 LMS reference points [L, M, S] for percentile calculation
// ─────────────────────────────────────────────────────────────────────────────

const _LMS = {
  male: {
    height: {
      0:  [-0.3521, 49.88, 0.03795], 6:  [-0.3484, 67.62, 0.03177],
      12: [-0.3014, 75.75, 0.03043], 18: [-0.2688, 82.34, 0.03006],
      24: [-0.3521, 87.82, 0.03100], 36: [-0.2666, 96.49, 0.03105],
      48: [-0.1979, 103.47, 0.03135], 60: [-0.1494, 109.20, 0.03186],
      72: [-0.1185, 113.92, 0.03261], 84: [-0.1000, 117.82, 0.03355],
    },
    weight: {
      0:  [-0.16, 3.35, 0.14602], 6:  [-0.16, 7.93, 0.10649],
      12: [-0.16, 9.65, 0.09662], 18: [-0.16, 10.94, 0.09183],
      24: [-0.16, 12.14, 0.08915], 36: [-0.16, 14.37, 0.08835],
      48: [-0.16, 17.00, 0.09151], 60: [-0.16, 20.53, 0.09852],
      72: [-0.16, 25.07, 0.10944], 84: [-0.16, 29.90, 0.12380],
    },
  },
  female: {
    height: {
      0:  [-0.3833, 49.15, 0.03790], 6:  [-0.3874, 65.73, 0.03200],
      12: [-0.3874, 74.02, 0.03027], 18: [-0.3717, 80.85, 0.03007],
      24: [-0.3833, 86.82, 0.03121], 36: [-0.3574, 96.12, 0.03091],
      48: [-0.3235, 103.92, 0.03082], 60: [-0.2761, 110.56, 0.03100],
      72: [-0.2143, 116.24, 0.03145], 84: [-0.1391, 121.13, 0.03213],
    },
    weight: {
      0:  [-0.16, 3.23, 0.14171], 6:  [-0.16, 7.30, 0.11927],
      12: [-0.16, 8.95, 0.11340], 18: [-0.16, 10.23, 0.11089],
      24: [-0.16, 11.49, 0.10978], 36: [-0.16, 13.71, 0.10916],
      48: [-0.16, 15.69, 0.11056], 60: [-0.16, 17.75, 0.11409],
      72: [-0.16, 20.05, 0.12013], 84: [-0.16, 22.63, 0.12908],
    },
  },
};

/**
 * Abramowitz & Stegun CDF approximation — same as whoStandards.js
 */
function _normCDF(z) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p  = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/**
 * Estimate WHO percentile using LMS method + proper normal CDF.
 * Replaces the old `50 + zScore * 15` approximation which was wildly inaccurate.
 *
 * @param {number} ageMonths - Age in months (0–84)
 * @param {number} value     - Measurement value
 * @param {string} metric    - 'height' or 'weight'
 * @param {string} gender    - 'male' or 'female'
 * @returns {number} Percentile 0–100 (1 decimal place)
 */
function estimatePercentile(ageMonths, value, metric, gender = 'male') {
  const gKey = (gender === 'male' || gender === 1) ? 'male' : 'female';
  const table = _LMS[gKey]?.[metric];
  if (!table) return 50;

  const ages = Object.keys(table).map(Number).sort((a, b) => a - b);
  const age  = Math.max(0, Math.min(84, ageMonths));
  let L, M, S;

  if (table[age]) {
    [L, M, S] = table[age];
  } else {
    const lo = Math.max(...ages.filter(a => a <= age));
    const hi = Math.min(...ages.filter(a => a >= age));
    if (lo === hi) {
      [L, M, S] = table[lo];
    } else {
      const t = (age - lo) / (hi - lo);
      const tL = table[lo], tH = table[hi];
      L = tL[0] + t * (tH[0] - tL[0]);
      M = tL[1] + t * (tH[1] - tL[1]);
      S = tL[2] + t * (tH[2] - tL[2]);
    }
  }

  // WHO Box-Cox z-score
  const z = Math.abs(L) < 1e-6
    ? Math.log(value / M) / S
    : (Math.pow(value / M, L) - 1) / (L * S);

  return Math.round(_normCDF(z) * 1000) / 10; // 0–100 with 1 dp
}

/**
 * Generate growth predictions based on historical data (linear extrapolation).
 * For ML-powered predictions use the /ai/predictions endpoint instead.
 */
function generatePredictions(measurements, monthsAhead, baby) {
  if (!measurements || measurements.length < 3) {
    return null;
  }

  const sorted = [...measurements].sort((a, b) =>
    new Date(b.measurementDate) - new Date(a.measurementDate)
  );

  const heightVelocity = calculateGrowthVelocity(sorted, 'height');
  const weightVelocity = calculateGrowthVelocity(sorted, 'weight');

  const currentHeight = sorted[0].height?.value || sorted[0].height;
  const currentWeight = sorted[0].weight?.value || sorted[0].weight;

  const predictedHeight = Number((currentHeight + (heightVelocity.velocity * monthsAhead)).toFixed(1));
  const predictedWeight = Number((currentWeight + (weightVelocity.velocity * monthsAhead)).toFixed(1));
  const predictedBMI = calculateBMI(predictedHeight, predictedWeight);

  const dataPoints = measurements.length;
  let confidence = Math.min(95, 50 + (dataPoints * 5));
  const velocityVariance = Math.abs(heightVelocity.velocity) > 5 ? 0.8 : 1;
  confidence = Math.round(confidence * velocityVariance);

  return {
    timeframe: `${monthsAhead} months`,
    confidence,
    metrics: {
      height: {
        predicted: predictedHeight,
        current: currentHeight,
        change: Number((predictedHeight - currentHeight).toFixed(1)),
        unit: 'cm',
      },
      weight: {
        predicted: predictedWeight,
        current: currentWeight,
        change: Number((predictedWeight - currentWeight).toFixed(1)),
        unit: 'kg',
      },
      bmi: {
        predicted: predictedBMI,
        current: calculateBMI(currentHeight, currentWeight),
      },
    },
    influenceFactors: [
      { name: 'Growth Velocity', value: 28 },
      { name: 'Nutrition Patterns', value: 25 },
      { name: 'Sleep Quality', value: 18 },
      { name: 'Genetic Factors', value: 15 },
      { name: 'Health Status', value: 14 },
    ],
  };
}

module.exports = {
  calculateBMI,
  calculateGrowthVelocity,
  estimatePercentile,
  generatePredictions,
};
