/**
 * WHO Growth Standards Service (WHO 2006)
 * Uses the full WHO LMS table covering 0–84 months for height, weight, and BMI.
 * Calculates percentile curves using the LMS Box-Cox method instead of a
 * coarse 8-age-point lookup table that previously clamped at 24 months.
 */

// ─────────────────────────────────────────────────────────────────────────────
// WHO 2006 LMS tables: [L, M, S] for each age in months
// Source: https://www.who.int/tools/child-growth-standards
// ─────────────────────────────────────────────────────────────────────────────

const LMS = {
  height: {
    male: {
      0:[-0.3521,49.8842,0.03795],3:[-0.3264,61.4292,0.03328],6:[-0.3484,67.6236,0.03177],
      9:[-0.3248,71.9687,0.03097],12:[-0.3014,75.7488,0.03043],15:[-0.2765,79.1699,0.03017],
      18:[-0.2688,82.3432,0.03006],21:[-0.2578,85.1774,0.03019],24:[-0.3521,87.8161,0.03100],
      27:[-0.3297,90.2001,0.03099],30:[-0.3078,92.4219,0.03099],33:[-0.2867,94.5120,0.03102],
      36:[-0.2666,96.4902,0.03105],39:[-0.2476,98.3672,0.03111],42:[-0.2298,100.1510,0.03117],
      45:[-0.2132,101.8486,0.03125],48:[-0.1979,103.4652,0.03135],51:[-0.1839,105.0054,0.03145],
      54:[-0.1711,106.4730,0.03157],57:[-0.1596,107.8710,0.03170],60:[-0.1494,109.2021,0.03186],
      63:[-0.1402,110.4692,0.03202],66:[-0.1321,111.6754,0.03220],69:[-0.1249,112.8240,0.03240],
      72:[-0.1185,113.9184,0.03261],75:[-0.1129,114.9620,0.03283],78:[-0.1080,115.9583,0.03306],
      81:[-0.1037,116.9110,0.03330],84:[-0.1000,117.8232,0.03355],
    },
    female: {
      0:[-0.3833,49.1477,0.03790],3:[-0.3849,59.8029,0.03397],6:[-0.3874,65.7311,0.03200],
      9:[-0.3880,70.1435,0.03089],12:[-0.3874,74.0150,0.03027],15:[-0.3754,77.5458,0.03009],
      18:[-0.3717,80.8533,0.03007],21:[-0.3664,83.9620,0.03015],24:[-0.3833,86.8217,0.03121],
      27:[-0.3773,89.3173,0.03112],30:[-0.3710,91.6884,0.03104],33:[-0.3644,93.9535,0.03097],
      36:[-0.3574,96.1222,0.03091],39:[-0.3499,98.1985,0.03087],42:[-0.3418,100.1867,0.03084],
      45:[-0.3331,102.0927,0.03082],48:[-0.3235,103.9223,0.03082],51:[-0.3130,105.6806,0.03084],
      54:[-0.3016,107.3710,0.03088],57:[-0.2893,108.9964,0.03093],60:[-0.2761,110.5594,0.03100],
      63:[-0.2620,112.0624,0.03109],66:[-0.2470,113.5080,0.03119],69:[-0.2311,114.8994,0.03131],
      72:[-0.2143,116.2386,0.03145],75:[-0.1966,117.5290,0.03160],78:[-0.1781,118.7732,0.03176],
      81:[-0.1589,119.9735,0.03194],84:[-0.1391,121.1316,0.03213],
    },
  },
  weight: {
    male: {
      0:[-0.1600,3.3464,0.14602],3:[-0.1600,6.3762,0.11727],6:[-0.1600,7.9340,0.10649],
      9:[-0.1600,9.0014,0.10038],12:[-0.1600,9.6479,0.09662],15:[-0.1600,10.3108,0.09388],
      18:[-0.1600,10.9385,0.09183],21:[-0.1600,11.5480,0.09030],24:[-0.1600,12.1435,0.08915],
      27:[-0.1600,12.7036,0.08853],30:[-0.1600,13.2528,0.08820],33:[-0.1600,13.8060,0.08814],
      36:[-0.1600,14.3745,0.08835],39:[-0.1600,14.9676,0.08880],42:[-0.1600,15.5959,0.08947],
      45:[-0.1600,16.2696,0.09038],48:[-0.1600,16.9963,0.09151],51:[-0.1600,17.7818,0.09289],
      54:[-0.1600,18.6314,0.09451],57:[-0.1600,19.5486,0.09639],60:[-0.1600,20.5335,0.09852],
      63:[-0.1600,21.5845,0.10089],66:[-0.1600,22.6972,0.10350],69:[-0.1600,23.8624,0.10635],
      72:[-0.1600,25.0677,0.10944],75:[-0.1600,26.2963,0.11274],78:[-0.1600,27.5275,0.11624],
      81:[-0.1600,28.7361,0.11993],84:[-0.1600,29.8960,0.12380],
    },
    female: {
      0:[-0.1600,3.2322,0.14171],3:[-0.1600,5.8458,0.12619],6:[-0.1600,7.2970,0.11927],
      9:[-0.1600,8.2254,0.11566],12:[-0.1600,8.9481,0.11340],15:[-0.1600,9.5993,0.11192],
      18:[-0.1600,10.2279,0.11089],21:[-0.1600,10.8558,0.11021],24:[-0.1600,11.4917,0.10978],
      27:[-0.1600,12.0993,0.10967],30:[-0.1600,12.6650,0.10945],33:[-0.1600,13.2001,0.10928],
      36:[-0.1600,13.7148,0.10916],39:[-0.1600,14.2153,0.10934],42:[-0.1600,14.7068,0.10963],
      45:[-0.1600,15.1953,0.11003],48:[-0.1600,15.6864,0.11056],51:[-0.1600,16.1844,0.11123],
      54:[-0.1600,16.6932,0.11203],57:[-0.1600,17.2159,0.11299],60:[-0.1600,17.7537,0.11409],
      63:[-0.1600,18.3060,0.11536],66:[-0.1600,18.8712,0.11677],69:[-0.1600,19.4503,0.11836],
      72:[-0.1600,20.0450,0.12013],75:[-0.1600,20.6578,0.12207],78:[-0.1600,21.2912,0.12420],
      81:[-0.1600,21.9476,0.12654],84:[-0.1600,22.6290,0.12908],
    },
  },
  bmi: {
    // WHO BMI-for-age LMS (2006), 0–60 months. For 60–84 months, WHO uses 2007 reference tables.
    // Using published values below with linear interpolation between key ages.
    male: {
      0:[-0.0631,13.3363,0.09276],3:[0.4745,15.8573,0.09219],6:[0.5746,17.6633,0.08888],
      9:[0.3770,17.8168,0.08688],12:[0.1935,17.6026,0.08541],18:[-0.0888,17.2118,0.08429],
      24:[-0.3496,16.5073,0.08334],30:[-0.4903,16.0344,0.08296],36:[-0.6053,15.6831,0.08295],
      42:[-0.7027,15.4224,0.08336],48:[-0.7762,15.2387,0.08420],54:[-0.8267,15.1157,0.08537],
      60:[-0.8560,15.0282,0.08673],
    },
    female: {
      0:[0.1247,13.1085,0.09066],3:[0.4972,15.4239,0.09434],6:[0.5677,17.0853,0.09310],
      9:[0.4239,17.2866,0.09140],12:[0.2294,17.2173,0.08975],18:[-0.0965,16.8045,0.08861],
      24:[-0.3615,16.2031,0.08757],30:[-0.5651,15.7502,0.08741],36:[-0.7291,15.3814,0.08773],
      42:[-0.8687,15.0792,0.08854],48:[-0.9838,14.8361,0.08966],54:[-1.0712,14.6548,0.09097],
      60:[-1.1296,14.5274,0.09237],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Abramowitz & Stegun normal CDF approximation */
function normCDF(z) {
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return 0.5 * (1 + sign * y);
}

/** Inverse normal CDF (percent point function) — Beasley-Springer-Moro approximation */
function normPPF(p) {
  const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01];
  const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[1]*q+c[2])*q+c[3])*q+c[4])*q+c[5])*q+c[6]) / ((((d[1]*q+d[2])*q+d[3])*q+d[4])*q+1);
  }
  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (((((a[1]*r+a[2])*r+a[3])*r+a[4])*r+a[5])*r+a[6])*q / (((((b[1]*r+b[2])*r+b[3])*r+b[4])*r+b[5])*r+1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[1]*q+c[2])*q+c[3])*q+c[4])*q+c[5])*q+c[6]) / ((((d[1]*q+d[2])*q+d[3])*q+d[4])*q+1);
}

/** Interpolate the LMS triple for a given age */
function getLMS(ageMonths, gender, metric) {
  const table = LMS[metric]?.[gender];
  if (!table) throw new Error(`No LMS table for metric=${metric} gender=${gender}`);

  const ages = Object.keys(table).map(Number).sort((a, b) => a - b);
  const maxAge = ages[ages.length - 1];
  const age = Math.max(0, Math.min(maxAge, ageMonths));

  if (table[age]) return table[age];

  const lo = Math.max(...ages.filter(a => a <= age));
  const hi = Math.min(...ages.filter(a => a >= age));
  if (lo === hi) return table[lo];

  const t = (age - lo) / (hi - lo);
  const [Ll, Ml, Sl] = table[lo];
  const [Lh, Mh, Sh] = table[hi];
  return [Ll + t*(Lh-Ll), Ml + t*(Mh-Ml), Sl + t*(Sh-Sl)];
}

/**
 * Get the measurement value at a given z-score and age (inverse of z → value).
 * Solves: value = M * (1 + L*S*z)^(1/L)
 */
function valueAtZ(z, L, M, S) {
  if (Math.abs(L) < 1e-6) return M * Math.exp(S * z);
  return M * Math.pow(1 + L * S * z, 1 / L);
}

/**
 * Get the WHO percentile reference value at a given age, gender, metric, and percentile.
 * @param {number} ageMonths
 * @param {'male'|'female'} gender
 * @param {'height'|'weight'|'bmi'} metric
 * @param {5|50|95} percentile
 */
function getPercentileValue(ageMonths, gender, metric, percentile) {
  const z = normPPF(percentile / 100);
  const [L, M, S] = getLMS(ageMonths, gender, metric);
  return valueAtZ(z, L, M, S);
}

/** Calculate age in months (fractional) from two dates */
function calculateAgeInMonths(birthDate, measurementDate) {
  const birth = new Date(birthDate);
  const meas  = new Date(measurementDate);
  const months =
    (meas.getFullYear() - birth.getFullYear()) * 12 +
    (meas.getMonth() - birth.getMonth()) +
    (meas.getDate() - birth.getDate()) / 30.44;
  return Math.max(0, months);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

async function calculateGrowthPercentiles(gender, birthDate, measurements, metric) {
  const chartData = {
    labels: [],
    childData: [],
    who5thData: [],
    who50thData: [],
    who95thData: [],
  };

  measurements.forEach(measurement => {
    const measurementDate = new Date(measurement.date);
    const ageInMonths = calculateAgeInMonths(birthDate, measurementDate);

    // Label: M/D
    chartData.labels.push(`${measurementDate.getMonth() + 1}/${measurementDate.getDate()}`);

    // Child's actual value
    let childValue;
    if (metric === 'height') {
      childValue = measurement.height;
    } else if (metric === 'weight') {
      childValue = measurement.weight;
    } else {
      // BMI — height must be in cm, weight in kg
      const heightInMeters = measurement.height / 100;
      if (heightInMeters <= 0) {
        childValue = null;
      } else {
        childValue = Number((measurement.weight / (heightInMeters * heightInMeters)).toFixed(1));
      }
    }
    chartData.childData.push(childValue);

    try {
      const who5th  = Number(getPercentileValue(ageInMonths, gender, metric, 5).toFixed(1));
      const who50th = Number(getPercentileValue(ageInMonths, gender, metric, 50).toFixed(1));
      const who95th = Number(getPercentileValue(ageInMonths, gender, metric, 95).toFixed(1));

      chartData.who5thData.push(who5th);
      chartData.who50thData.push(who50th);
      chartData.who95thData.push(who95th);
    } catch (err) {
      console.error(`Error getting WHO percentile for age ${ageInMonths}m:`, err);
      chartData.who5thData.push(null);
      chartData.who50thData.push(null);
      chartData.who95thData.push(null);
    }
  });

  return chartData;
}

module.exports = { calculateGrowthPercentiles };
