/**
 * WHO Growth Standards Service
 * Simplified implementation using WHO growth standard reference values
 * 
 * Data source: WHO Child Growth Standards (2006)
 * https://www.who.int/tools/child-growth-standards
 */

/**
 * WHO percentile reference data (simplified for common ages 0-24 months)
 * Values are approximations for demonstration - in production, use full WHO tables
 */
const WHO_STANDARDS = {
  'height': {
    'male': {
      // Age in months: { p5, p50, p95 } in cm
      0: { p5: 46.3, p50: 49.9, p95: 53.4 },
      3: { p5: 57.3, p50: 61.4, p95: 65.3 },
      6: { p5: 63.6, p50: 67.6, p95: 71.6 },
      9: { p5: 68.0, p50: 72.0, p95: 76.0 },
      12: { p5: 71.7, p50: 75.7, p95: 79.8 },
      15: { p5: 75.0, p50: 79.1, p95: 83.2 },
      18: { p5: 77.8, p50: 82.3, p95: 86.4 },
      24: { p5: 82.5, p50: 87.1, p95: 91.9 },
    },
    'female': {
      0: { p5: 45.6, p50: 49.1, p95: 52.7 },
      3: { p5: 56.2, p50: 59.8, p95: 63.8 },
      6: { p5: 61.8, p50: 65.7, p95: 69.8 },
      9: { p5: 66.1, p50: 70.1, p95: 74.2 },
      12: { p5: 69.8, p50: 74.0, p95: 78.2 },
      15: { p5: 73.1, p50: 77.5, p95: 81.9 },
      18: { p5: 76.0, p50: 80.7, p95: 85.4 },
      24: { p5: 81.3, p50: 86.4, p95: 91.5 },
    },
  },
  'weight': {
    'male': {
      // Age in months: { p5, p50, p95 } in kg
      0: { p5: 2.5, p50: 3.3, p95: 4.3 },
      3: { p5: 5.0, p50: 6.0, p95: 7.2 },
      6: { p5: 6.4, p50: 7.9, p95: 9.5 },
      9: { p5: 7.6, p50: 9.2, p95: 10.9 },
      12: { p5: 8.4, p50: 10.0, p95: 11.8 },
      15: { p5: 9.2, p50: 10.8, p95: 12.6 },
      18: { p5: 9.8, p50: 11.5, p95: 13.4 },
      24: { p5: 10.8, p50: 12.7, p95: 14.8 },
    },
    'female': {
      0: { p5: 2.4, p50: 3.2, p95: 4.2 },
      3: { p5: 4.5, p50: 5.6, p95: 6.9 },
      6: { p5: 5.7, p50: 7.3, p95: 8.9 },
      9: { p5: 7.0, p50: 8.6, p95: 10.3 },
      12: { p5: 7.7, p50: 9.5, p95: 11.3 },
      15: { p5: 8.5, p50: 10.3, p95: 12.2 },
      18: { p5: 9.1, p50: 11.0, p95: 13.0 },
      24: { p5: 10.2, p50: 12.2, p95: 14.5 },
    },
  },
  'bmi': {
    'male': {
      // Age in months: { p5, p50, p95 } 
      0: { p5: 11.6, p50: 13.3, p95: 15.4 },
      3: { p5: 13.5, p50: 15.9, p95: 18.6 },
      6: { p5: 15.0, p50: 17.7, p95: 20.4 },
      9: { p5: 15.3, p50: 17.8, p95: 20.4 },
      12: { p5: 15.3, p50: 17.6, p95: 20.0 },
      15: { p5: 15.1, p50: 17.4, p95: 19.7 },
      18: { p5: 14.9, p50: 17.1, p95: 19.4 },
      24: { p5: 14.5, p50: 16.5, p95: 18.7 },
    },
    'female': {
      0: { p5: 11.5, p50: 13.1, p95: 15.1 },
      3: { p5: 12.9, p50: 15.4, p95: 18.3 },
      6: { p5: 14.3, p50: 17.1, p95: 20.1 },
      9: { p5: 14.7, p50: 17.3, p95: 20.1 },
      12: { p5: 14.7, p50: 17.2, p95: 19.8 },
      15: { p5: 14.6, p50: 17.0, p95: 19.5 },
      18: { p5: 14.5, p50: 16.8, p95: 19.1 },
      24: { p5: 14.2, p50: 16.2, p95: 18.5 },
    },
  },
};

/**
 * Interpolate between two values based on age
 */
function interpolate(age, lowerAge, upperAge, lowerValue, upperValue) {
  if (lowerAge === upperAge) return lowerValue;
  const ratio = (age - lowerAge) / (upperAge - lowerAge);
  return lowerValue + ratio * (upperValue - lowerValue);
}

/**
 * Get WHO percentile value for a specific age, gender, and metric
 */
function getPercentileValue(ageInMonths, gender, metric, percentile) {
  const standards = WHO_STANDARDS[metric]?.[gender];
  if (!standards) {
    throw new Error(`Invalid metric or gender: ${metric}, ${gender}`);
  }

  // Get available ages as sorted array
  const ages = Object.keys(standards).map(Number).sort((a, b) => a - b);
  
  // Handle ages outside our range
  if (ageInMonths <= ages[0]) {
    const data = standards[ages[0]];
    return percentile === 5 ? data.p5 : percentile === 50 ? data.p50 : data.p95;
  }
  if (ageInMonths >= ages[ages.length - 1]) {
    const data = standards[ages[ages.length - 1]];
    return percentile === 5 ? data.p5 : percentile === 50 ? data.p50 : data.p95;
  }

  // Find the two ages to interpolate between
  let lowerAge = ages[0];
  let upperAge = ages[ages.length - 1];
  
  for (let i = 0; i < ages.length - 1; i++) {
    if (ageInMonths >= ages[i] && ageInMonths <= ages[i + 1]) {
      lowerAge = ages[i];
      upperAge = ages[i + 1];
      break;
    }
  }

  const lowerData = standards[lowerAge];
  const upperData = standards[upperAge];
  
  const lowerValue = percentile === 5 ? lowerData.p5 : percentile === 50 ? lowerData.p50 : lowerData.p95;
  const upperValue = percentile === 5 ? upperData.p5 : percentile === 50 ? upperData.p50 : upperData.p95;

  return interpolate(ageInMonths, lowerAge, upperAge, lowerValue, upperValue);
}

/**
 * Calculate age in months from two dates
 */
function calculateAgeInMonths(birthDate, measurementDate) {
  const birth = new Date(birthDate);
  const measurement = new Date(measurementDate);
  
  const months = (measurement.getFullYear() - birth.getFullYear()) * 12 +
                 (measurement.getMonth() - birth.getMonth());
  
  return Math.max(0, months); // Ensure non-negative
}

/**
 * Calculate WHO percentile values for growth charts
 */
async function calculateGrowthPercentiles(gender, birthDate, measurements, metric) {
  try {
    const chartData = {
      labels: [],
      childData: [],
      who5thData: [],
      who50thData: [],
      who95thData: [],
    };

    measurements.forEach(measurement => {
      const measurementDate = new Date(measurement.date);
      
      // Calculate age in months
      const ageInMonths = calculateAgeInMonths(birthDate, measurementDate);
      
      // Add label
      chartData.labels.push(`${measurementDate.getMonth() + 1}/${measurementDate.getDate()}`);
      
      // Get child's actual value
      let childValue;
      if (metric === 'height') {
        childValue = measurement.height;
      } else if (metric === 'weight') {
        childValue = measurement.weight;
      } else if (metric === 'bmi') {
        const heightInMeters = measurement.height / 100;
        childValue = Number((measurement.weight / (heightInMeters * heightInMeters)).toFixed(1));
      }
      
      chartData.childData.push(childValue);
      
      try {
        // Get WHO percentile values for this age
        const who5th = getPercentileValue(ageInMonths, gender, metric, 5);
        const who50th = getPercentileValue(ageInMonths, gender, metric, 50);
        const who95th = getPercentileValue(ageInMonths, gender, metric, 95);
        
        chartData.who5thData.push(Number(who5th.toFixed(1)));
        chartData.who50thData.push(Number(who50th.toFixed(1)));
        chartData.who95thData.push(Number(who95th.toFixed(1)));
      } catch (err) {
        console.error(`Error getting WHO percentile for age ${ageInMonths} months:`, err);
        chartData.who5thData.push(null);
        chartData.who50thData.push(null);
        chartData.who95thData.push(null);
      }
    });

    return chartData;
  } catch (error) {
    console.error('Error in calculateGrowthPercentiles:', error);
    throw error;
  }
}

module.exports = {
  calculateGrowthPercentiles,
};
