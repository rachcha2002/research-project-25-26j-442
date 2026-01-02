/**
 * Growth calculation utilities for BMI, percentiles, and predictions
 */

/**
 * Calculate BMI from height and weight
 * @param {number} heightCm - Height in centimeters
 * @param {number} weightKg - Weight in kilograms
 * @returns {number} BMI value
 */
function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return null;
  }
  
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(2));
}

/**
 * Calculate growth velocity (rate of change)
 * @param {Array} measurements - Array of measurements sorted by date
 * @param {string} metric - Metric to calculate velocity for ('height', 'weight', etc.)
 * @returns {Object} Velocity data
 */
function calculateGrowthVelocity(measurements, metric = 'height') {
  if (!measurements || measurements.length < 2) {
    return { velocity: 0, trend: 'stable' };
  }

  // Get last two measurements
  const recent = measurements[0];
  const previous = measurements[1];

  const recentValue = recent[metric]?.value || recent[metric];
  const previousValue = previous[metric]?.value || previous[metric];
  
  if (!recentValue || !previousValue) {
    return { velocity: 0, trend: 'stable' };
  }

  // Calculate time difference in months
  const timeDiff = (new Date(recent.measurementDate) - new Date(previous.measurementDate)) / (1000 * 60 * 60 * 24 * 30);
  
  if (timeDiff === 0) {
    return { velocity: 0, trend: 'stable' };
  }

  // Calculate velocity (change per month)
  const velocity = Number(((recentValue - previousValue) / timeDiff).toFixed(2));
  
  let trend = 'stable';
  if (velocity > 0.5) trend = 'increasing';
  else if (velocity < -0.5) trend = 'decreasing';

  return { velocity, trend, timeDiff };
}

/**
 * Estimate percentile based on simplified WHO growth standards
 * This is a simplified approximation. For production, use WHO growth charts data.
 * @param {number} ageMonths - Age in months
 * @param {number} value - Measurement value
 * @param {string} metric - Metric type ('height', 'weight', 'headCircumference')
 * @param {string} gender - 'male' or 'female'
 * @returns {number} Estimated percentile (0-100)
 */
function estimatePercentile(ageMonths, value, metric, gender = 'male') {
  // This is a simplified estimation
  // In production, you should use actual WHO growth chart data
  
  // Simplified reference values (these should be replaced with WHO data)
  const referenceData = {
    height: {
      male: { 36: { median: 96, sd: 3.5 }, 48: { median: 103, sd: 3.8 } },
      female: { 36: { median: 95, sd: 3.4 }, 48: { median: 102, sd: 3.7 } },
    },
    weight: {
      male: { 36: { median: 14.3, sd: 1.5 }, 48: { median: 16.2, sd: 1.8 } },
      female: { 36: { median: 13.9, sd: 1.5 }, 48: { median: 15.8, sd: 1.7 } },
    },
  };

  // Find closest age reference
  const ages = Object.keys(referenceData[metric]?.[gender] || {}).map(Number);
  if (ages.length === 0) return 50; // Default to 50th percentile if no data

  const closestAge = ages.reduce((prev, curr) => 
    Math.abs(curr - ageMonths) < Math.abs(prev - ageMonths) ? curr : prev
  );

  const ref = referenceData[metric]?.[gender]?.[closestAge];
  if (!ref) return 50;

  // Calculate z-score
  const zScore = (value - ref.median) / ref.sd;
  
  // Convert z-score to percentile (simplified approximation)
  // In production, use proper cumulative distribution function
  let percentile = 50 + (zScore * 15); // Simplified conversion
  percentile = Math.max(1, Math.min(99, Math.round(percentile)));

  return percentile;
}

/**
 * Generate growth predictions based on historical data
 * @param {Array} measurements - Historical measurements
 * @param {number} monthsAhead - Number of months to predict
 * @param {Object} baby - Baby information
 * @returns {Object} Prediction data
 */
function generatePredictions(measurements, monthsAhead, baby) {
  if (!measurements || measurements.length < 3) {
    return null;
  }

  // Sort by date
  const sorted = [...measurements].sort((a, b) => 
    new Date(b.measurementDate) - new Date(a.measurementDate)
  );

  // Calculate average growth velocity
  const heightVelocity = calculateGrowthVelocity(sorted, 'height');
  const weightVelocity = calculateGrowthVelocity(sorted, 'weight');

  const currentHeight = sorted[0].height?.value || sorted[0].height;
  const currentWeight = sorted[0].weight?.value || sorted[0].weight;

  // Simple linear prediction (in production, use more sophisticated models)
  const predictedHeight = Number((currentHeight + (heightVelocity.velocity * monthsAhead)).toFixed(1));
  const predictedWeight = Number((currentWeight + (weightVelocity.velocity * monthsAhead)).toFixed(1));

  // Calculate predicted BMI
  const predictedBMI = calculateBMI(predictedHeight, predictedWeight);

  // Confidence score based on data consistency
  const dataPoints = measurements.length;
  let confidence = Math.min(95, 50 + (dataPoints * 5)); // More data = higher confidence
  
  // Reduce confidence if velocity varies significantly
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
