/**
 * tests/ai.routes.test.js
 * Integration tests for routes/ai.js using Supertest.
 *
 * All Mongoose models, mlService, and mongoose.connection are fully mocked
 * so no real DB or ML service is needed.
 */

// ── Mongoose mock ─────────────────────────────────────────────────────────────
// Must be done BEFORE requiring any module that imports mongoose.
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      ...actual.connection,
      useDb: jest.fn(),
    },
  };
});

// ── Model mocks ───────────────────────────────────────────────────────────────
jest.mock('../models/Measurement');
jest.mock('../models/HealthRecord');
jest.mock('../models/Medication');
jest.mock('../models/FeedingLog');
jest.mock('../models/SleepLog');
jest.mock('../services/mlService');

const request    = require('supertest');
const express    = require('express');
const mongoose   = require('mongoose');
const mlSvc      = require('../services/mlService');
const Measurement = require('../models/Measurement');
const HealthRecord = require('../models/HealthRecord');
const Medication   = require('../models/Medication');
const FeedingLog   = require('../models/FeedingLog');
const SleepLog     = require('../models/SleepLog');

// Build a minimal Express app with just the AI router
const aiRouter = require('../routes/ai');
const app = express();
app.use(express.json());
app.use('/api/ai', aiRouter);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — reusable mock setups
// ─────────────────────────────────────────────────────────────────────────────

// Valid 24-char hex ObjectId strings required by mongoose.Types.ObjectId()
const BABY_OID  = '507f1f77bcf86cd799439011';
const USER_OID  = '507f1f77bcf86cd799439012';

/** A valid PRO baby profile returned by the users DB */
const PRO_BABY_PROFILE = {
  _id: BABY_OID,
  userId: USER_OID,
  gender: 'male',
  birthDetails: { wasPremature: false, weightAtBirth: 3.2 },
};

/** Spoof the mongoose cross-DB baby + user lookup so that PRO check passes */
function mockProBabyLookup(babyProfile = PRO_BABY_PROFILE) {
  // getBabyAndCheckPro does:
  //   const usersDb = mongoose.connection.useDb('peditrack_users');
  //   usersDb.collection('babyprofiles').findOne(...)   ← first call
  //   usersDb.collection('users').findOne(...)          ← second call
  // useDb is called ONCE; collection() is called TWICE with different names.
  const babyFindOne = jest.fn().mockResolvedValue(babyProfile);
  const userFindOne = jest.fn().mockResolvedValue({ _id: USER_OID, isPro: true });

  mongoose.connection.useDb.mockReturnValue({
    collection: jest.fn().mockImplementation((collectionName) => ({
      findOne: collectionName === 'babyprofiles' ? babyFindOne : userFindOne,
    })),
  });
}

/** Three realistic measurements */
const THREE_MEASUREMENTS = [
  { ageInMonths: 6,  height: { value: 65.0 }, weight: { value: 7.5 }, bmi: 17.8, measurementDate: new Date('2024-01-01') },
  { ageInMonths: 9,  height: { value: 68.0 }, weight: { value: 8.5 }, bmi: 18.4, measurementDate: new Date('2024-04-01') },
  { ageInMonths: 12, height: { value: 72.0 }, weight: { value: 9.2 }, bmi: 17.7, measurementDate: new Date('2024-07-01') },
];

/** Full ML result returned by the mocked mlSvc.predict */
const FULL_ML_RESULT = {
  growth_forecast:  { next_height: 75.5, next_weight: 10.1, next_bmi: 17.7 },
  risk_assessment:  { growth_disorder: 0.15, developmental_delay: 0.1, nutritional_deficiency: 0.2, behavioral_issue: 0.1 },
  health_score:     85,
  cached:           false,
  min_measurements_for_growth: 3,
  min_measurements_for_risks:  2,
};

function setupFullMocks(mlResult = FULL_ML_RESULT, measurements = THREE_MEASUREMENTS) {
  mockProBabyLookup();
  const sortFn = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(measurements) });
  Measurement.find.mockReturnValue({ sort: sortFn });
  HealthRecord.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
  Medication.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
  const sortFn2 = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
  FeedingLog.find.mockReturnValue({ sort: sortFn2 });
  SleepLog.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });
  mlSvc.predict.mockResolvedValue(mlResult);
}

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/status
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/ai/status', () => {
  it('returns 200 with ML service health data', async () => {
    mlSvc.healthCheck.mockResolvedValue({
      status: 'healthy',
      models_loaded: { pic_growth: true, srilanka_risks: true },
      version: '2.0.0',
    });

    const res = await request(app).get('/api/ai/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.models_loaded).toBeDefined();
  });

  it('returns degraded status when models are not loaded', async () => {
    mlSvc.healthCheck.mockResolvedValue({
      status: 'degraded',
      models_loaded: { pic_growth: false, srilanka_risks: false },
    });

    const res = await request(app).get('/api/ai/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('degraded');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/health-score/:babyId
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/ai/health-score/:babyId', () => {
  it('returns 200 with healthScore and factors for a valid PRO baby', async () => {
    setupFullMocks();

    const res = await request(app).get(`/api/ai/health-score/${BABY_OID}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('healthScore', 85);
    expect(res.body).toHaveProperty('riskLevel');
    expect(res.body).toHaveProperty('factors');
    expect(res.body.factors).toHaveProperty('growth');
    expect(res.body.factors).toHaveProperty('nutrition');
    expect(res.body.factors).toHaveProperty('development');
    expect(res.body.factors).toHaveProperty('behavior');
  });

  it('returns riskLevel "low" when healthScore >= 80', async () => {
    setupFullMocks({ ...FULL_ML_RESULT, health_score: 90 });
    const res = await request(app).get(`/api/ai/health-score/${BABY_OID}`);
    expect(res.body.riskLevel).toBe('low');
  });

  it('returns riskLevel "moderate" when healthScore is 60–79', async () => {
    setupFullMocks({ ...FULL_ML_RESULT, health_score: 65 });
    const res = await request(app).get(`/api/ai/health-score/${BABY_OID}`);
    expect(res.body.riskLevel).toBe('moderate');
  });

  it('returns riskLevel "high" when healthScore < 60', async () => {
    setupFullMocks({ ...FULL_ML_RESULT, health_score: 45 });
    const res = await request(app).get(`/api/ai/health-score/${BABY_OID}`);
    expect(res.body.riskLevel).toBe('high');
  });

  it('returns 400 when ML service returns risk_assessment: null (< 2 measurements)', async () => {
    setupFullMocks({ ...FULL_ML_RESULT, risk_assessment: null });
    const res = await request(app).get(`/api/ai/health-score/${BABY_OID}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/2\+.*measurements/i);
  });

  it('returns 404 when baby is not found', async () => {
    mongoose.connection.useDb.mockReturnValue({
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      }),
    });
    const res = await request(app).get(`/api/ai/health-score/${BABY_OID}`);
    expect(res.statusCode).toBe(404);
  });

  it('returns 403 when user does not have PRO status', async () => {
    const babyFindOne = jest.fn().mockResolvedValue(PRO_BABY_PROFILE);
    const userFindOne = jest.fn().mockResolvedValue({ _id: 'userId001', isPro: false });
    mongoose.connection.useDb.mockReturnValue({
      collection: jest.fn().mockImplementation((collectionName) => ({
        findOne: collectionName === 'babyprofiles' ? babyFindOne : userFindOne,
      })),
    });
    const res = await request(app).get(`/api/ai/health-score/${BABY_OID}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/PRO/i);
  });

  it('includes cached:true flag when result came from cache', async () => {
    setupFullMocks({ ...FULL_ML_RESULT, cached: true });
    const res = await request(app).get(`/api/ai/health-score/${BABY_OID}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.cached).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/predictions/:babyId
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/ai/predictions/:babyId', () => {
  it('returns 200 with trajectory, threeMonths, and recommendations', async () => {
    setupFullMocks();
    const res = await request(app).get(`/api/ai/predictions/${BABY_OID}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('predictions');
    expect(res.body.predictions).toHaveProperty('threeMonths');
    expect(res.body.predictions).toHaveProperty('sixMonths');
    expect(res.body.predictions).toHaveProperty('twelveMonths');
    expect(res.body).toHaveProperty('trajectory');
    expect(res.body).toHaveProperty('recommendations');
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  it('returns 400 when growth_forecast is null (< 3 measurements)', async () => {
    setupFullMocks({ ...FULL_ML_RESULT, growth_forecast: null }, THREE_MEASUREMENTS.slice(0, 2));
    const res = await request(app).get(`/api/ai/predictions/${BABY_OID}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/3\+.*measurements/i);
  });

  it('trajectory.months array contains historical + future labels', async () => {
    setupFullMocks();
    const res = await request(app).get(`/api/ai/predictions/${BABY_OID}`);
    expect(res.body.trajectory.months).toContain('+3m');
    expect(res.body.trajectory.months).toContain('+6m');
    expect(res.body.trajectory.months).toContain('+12m');
  });

  it('ensures predicted height is never less than current (growth correction)', async () => {
    // ML returns shrinkage — route should correct this
    const shrinkage = { ...FULL_ML_RESULT, growth_forecast: { next_height: 60.0, next_weight: 7.0, next_bmi: 17.0 } };
    setupFullMocks(shrinkage, THREE_MEASUREMENTS);
    const res = await request(app).get(`/api/ai/predictions/${BABY_OID}`);
    expect(res.statusCode).toBe(200);
    const h3 = res.body.predictions.threeMonths.height_cm;
    // Should be corrected: current height is 72.0, predicted must be >= 72.0
    expect(h3).toBeGreaterThanOrEqual(72.0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/risks/:babyId
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/ai/risks/:babyId', () => {
  it('returns 200 with overallRisk, riskCategories, and recommendations', async () => {
    setupFullMocks();
    const res = await request(app).get(`/api/ai/risks/${BABY_OID}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('overallRisk');
    expect(res.body).toHaveProperty('overallScore');
    expect(res.body).toHaveProperty('riskCategories');
    expect(res.body.riskCategories).toHaveProperty('growth');
    expect(res.body.riskCategories).toHaveProperty('nutrition');
    expect(res.body.riskCategories).toHaveProperty('development');
    expect(res.body.riskCategories).toHaveProperty('behavioral');
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  it('returns overallRisk "low" when avg risk < 0.30', async () => {
    setupFullMocks({
      ...FULL_ML_RESULT,
      risk_assessment: { growth_disorder: 0.1, developmental_delay: 0.1, nutritional_deficiency: 0.1, behavioral_issue: 0.1 },
    });
    const res = await request(app).get(`/api/ai/risks/${BABY_OID}`);
    expect(res.body.overallRisk).toBe('low');
  });

  it('returns overallRisk "moderate" when avg risk is 0.30–0.59', async () => {
    setupFullMocks({
      ...FULL_ML_RESULT,
      risk_assessment: { growth_disorder: 0.4, developmental_delay: 0.4, nutritional_deficiency: 0.4, behavioral_issue: 0.4 },
    });
    const res = await request(app).get(`/api/ai/risks/${BABY_OID}`);
    expect(res.body.overallRisk).toBe('moderate');
  });

  it('returns overallRisk "high" when avg risk >= 0.60', async () => {
    setupFullMocks({
      ...FULL_ML_RESULT,
      risk_assessment: { growth_disorder: 0.8, developmental_delay: 0.8, nutritional_deficiency: 0.8, behavioral_issue: 0.8 },
    });
    const res = await request(app).get(`/api/ai/risks/${BABY_OID}`);
    expect(res.body.overallRisk).toBe('high');
  });

  it('returns 400 when risk_assessment is null', async () => {
    setupFullMocks({ ...FULL_ML_RESULT, risk_assessment: null });
    const res = await request(app).get(`/api/ai/risks/${BABY_OID}`);
    expect(res.statusCode).toBe(400);
  });

  it('returns modelUsed = "srilanka_risks.keras"', async () => {
    setupFullMocks();
    const res = await request(app).get(`/api/ai/risks/${BABY_OID}`);
    expect(res.body.modelUsed).toBe('srilanka_risks.keras');
  });

  it('returns confidence 92 and confidenceLevel "high"', async () => {
    setupFullMocks();
    const res = await request(app).get(`/api/ai/risks/${BABY_OID}`);
    expect(res.body.confidence).toBe(92);
    expect(res.body.confidenceLevel).toBe('high');
  });
});
