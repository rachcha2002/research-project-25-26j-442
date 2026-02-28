/**
 * utils/whoStandards.js — Node.js port of WHO 2006 LMS method.
 * Avoids calling the Python service for simple percentile lookups used in warning detection.
 *
 * Covers ages 0–84 months for height and weight (boys + girls).
 * Uses the same LMS tables as the Python who_standards.py.
 */

// Key LMS checkpoints — interpolation handles intermediate ages
// Format: { age: [L, M, S] }
const TABLES = {
  boys: {
    height: {
      0:[-.3521,49.88,.03795], 6:[-.3484,67.62,.03177], 12:[-.3014,75.75,.03043],
      18:[-.2688,82.34,.03006], 24:[-.3521,87.82,.03100], 30:[-.3078,92.42,.03099],
      36:[-.2666,96.49,.03105], 42:[-.2298,100.15,.03117], 48:[-.1979,103.47,.03135],
      54:[-.1711,106.47,.03157], 60:[-.1494,109.20,.03186], 66:[-.1321,111.68,.03220],
      72:[-.1185,113.92,.03261], 78:[-.1080,115.96,.03306], 84:[-.1000,117.82,.03355],
    },
    weight: {
      0:[-.16,3.35,.14602], 6:[-.16,7.93,.10649], 12:[-.16,9.65,.09662],
      18:[-.16,10.94,.09183], 24:[-.16,12.14,.08915], 30:[-.16,13.25,.08820],
      36:[-.16,14.37,.08835], 42:[-.16,15.60,.08947], 48:[-.16,17.00,.09151],
      54:[-.16,18.63,.09451], 60:[-.16,20.53,.09852], 66:[-.16,22.70,.10350],
      72:[-.16,25.07,.10944], 78:[-.16,27.53,.11624], 84:[-.16,29.90,.12380],
    },
  },
  girls: {
    height: {
      0:[-.3833,49.15,.03790], 6:[-.3874,65.73,.03200], 12:[-.3874,74.02,.03027],
      18:[-.3717,80.85,.03007], 24:[-.3833,86.82,.03121], 30:[-.3710,91.69,.03104],
      36:[-.3574,96.12,.03091], 42:[-.3418,100.19,.03084], 48:[-.3235,103.92,.03082],
      54:[-.3016,107.37,.03088], 60:[-.2761,110.56,.03100], 66:[-.2470,113.51,.03119],
      72:[-.2143,116.24,.03145], 78:[-.1781,118.77,.03176], 84:[-.1391,121.13,.03213],
    },
    weight: {
      0:[-.16,3.23,.14171], 6:[-.16,7.30,.11927], 12:[-.16,8.95,.11340],
      18:[-.16,10.23,.11089], 24:[-.16,11.49,.10978], 30:[-.16,12.65,.10945],
      36:[-.16,13.71,.10916], 42:[-.16,14.71,.10963], 48:[-.16,15.69,.11056],
      54:[-.16,16.69,.11203], 60:[-.16,17.75,.11409], 66:[-.16,18.87,.11677],
      72:[-.16,20.05,.12013], 78:[-.16,21.29,.12420], 84:[-.16,22.63,.12908],
    },
  },
};

function _lms(ageMonths, gender, type) {
  const gKey   = (gender === 'male' || gender === 1 || gender === 'boy') ? 'boys' : 'girls';
  const table  = TABLES[gKey][type];
  const ages   = Object.keys(table).map(Number).sort((a, b) => a - b);
  const age    = Math.max(0, Math.min(84, ageMonths));

  if (table[age]) return table[age];

  // Linear interpolation
  const lo = Math.max(...ages.filter(a => a <= age));
  const hi = Math.min(...ages.filter(a => a >= age));
  if (lo === hi) return table[lo];

  const t  = (age - lo) / (hi - lo);
  const tL = table[lo], tH = table[hi];
  return [
    tL[0] + t * (tH[0] - tL[0]),
    tL[1] + t * (tH[1] - tL[1]),
    tL[2] + t * (tH[2] - tL[2]),
  ];
}

function _normCDF(z) {
  // Abramowitz & Stegun approximation
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t2 = 1 / (1 + p * x);
  const y = 1 - (((((a5*t2+a4)*t2)+a3)*t2+a2)*t2+a1)*t2*Math.exp(-x*x);
  return 0.5 * (1 + sign * y);
}

function getZScore(ageMonths, value, gender, type) {
  const [L, M, S] = _lms(ageMonths, gender, type);
  const z = Math.abs(L) < 1e-6
    ? Math.log(value / M) / S
    : (Math.pow(value / M, L) - 1) / (L * S);
  return Math.round(z * 1000) / 1000;
}

function getPercentile(ageMonths, value, gender, type) {
  const z = getZScore(ageMonths, value, gender, type);
  return Math.round(_normCDF(z) * 1000) / 10; // 0–100, 1dp
}

function evaluate(ageMonths, value, gender, type) {
  const zScore     = getZScore(ageMonths, value, gender, type);
  const percentile = Math.round(_normCDF(zScore) * 1000) / 10;
  let status = 'normal';
  if (zScore < -3 || zScore > 3) status = 'severe_concern';
  else if (zScore < -2 || zScore > 2) status = 'concern';
  else if (zScore < -1) status = 'monitor';
  return { percentile, zScore, status };
}

module.exports = { getZScore, getPercentile, evaluate };
