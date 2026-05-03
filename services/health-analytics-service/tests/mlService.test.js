/**
 * tests/mlService.test.js
 * Unit tests for services/mlService.js
 *
 * Strategy: mock axios and the AIInsight Mongoose model entirely so
 * no real HTTP calls or DB connections are made.
 */

// ── Mock axios BEFORE requiring the service ──────────────────────────────────
jest.mock('axios', () => {
  const mockInstance = {
    post: jest.fn(),
    get:  jest.fn(),
  };
  return {
    create: jest.fn(() => mockInstance),
    // store reference for per-test access
    __mockInstance: mockInstance,
  };
});

// ── Mock the AIInsight Mongoose model ────────────────────────────────────────
jest.mock('../models/AIInsight', () => ({
  findOne:          jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteMany:       jest.fn(),
}));

const axios    = require('axios');
const AIInsight = require('../models/AIInsight');

// Grab the singleton axios instance that mlService.js received
let mockAxios;
let mlSvc;

beforeAll(() => {
  // mlService creates its axios instance on require(), so we capture it after
  mlSvc     = require('../services/mlService');
  mockAxios = axios.__mockInstance;
});

beforeEach(() => {
  jest.clearAllMocks();
  // Reset in-memory rate-limit map between tests by re-requiring the module
  // (Jest caches modules; we work around per-test state via clearAllMocks + explicit resets)
});

// ─────────────────────────────────────────────────────────────────────────────
// healthCheck()
// ─────────────────────────────────────────────────────────────────────────────

describe('mlService.healthCheck()', () => {
  it('returns the ML service response when reachable', async () => {
    const fakeStatus = { status: 'healthy', models_loaded: { pic_growth: true, srilanka_risks: true }, version: '2.0.0' };
    mockAxios.get.mockResolvedValueOnce({ data: fakeStatus });

    const result = await mlSvc.healthCheck();

    expect(result.status).toBe('healthy');
    expect(result.models_loaded.pic_growth).toBe(true);
  });

  it('returns unhealthy sentinel when axios throws (network error)', async () => {
    mockAxios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await mlSvc.healthCheck();

    expect(result.status).toBe('unhealthy');
    expect(result.models_loaded.pic_growth).toBe(false);
    expect(result.models_loaded.srilanka_risks).toBe(false);
  });

  it('returns unhealthy sentinel when ML service times out', async () => {
    const timeoutErr = new Error('timeout of 5000ms exceeded');
    timeoutErr.code = 'ECONNABORTED';
    mockAxios.get.mockRejectedValueOnce(timeoutErr);

    const result = await mlSvc.healthCheck();
    expect(result.status).toBe('unhealthy');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// predict() — happy path
// ─────────────────────────────────────────────────────────────────────────────

describe('mlService.predict() — happy path', () => {
  const BABY_ID = 'baby_abc_123';
  const BABY_DATA = { measurements: [{ age_months: 6 }] };
  const ML_RESULT = {
    growth_forecast: { next_height: 70.5, next_weight: 9.1, next_bmi: 18.4 },
    risk_assessment: { growth_disorder: 0.2, developmental_delay: 0.1, nutritional_deficiency: 0.3, behavioral_issue: 0.15 },
    health_score: 82,
  };

  beforeEach(() => {
    // Default: no cache in DB
    AIInsight.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    AIInsight.findOneAndUpdate.mockResolvedValue({});
    mockAxios.post.mockResolvedValue({ data: ML_RESULT });
  });

  it('calls the ML service /predict endpoint with the baby data', async () => {
    await mlSvc.predict(BABY_ID, BABY_DATA);
    expect(mockAxios.post).toHaveBeenCalledWith('/predict', BABY_DATA);
  });

  it('returns the ML service result on success', async () => {
    const result = await mlSvc.predict(BABY_ID, BABY_DATA);
    expect(result.health_score).toBe(82);
    expect(result.growth_forecast.next_height).toBe(70.5);
  });

  it('persists the result to AIInsight cache after a successful call', async () => {
    await mlSvc.predict(BABY_ID, BABY_DATA);
    expect(AIInsight.findOneAndUpdate).toHaveBeenCalledWith(
      { babyId: BABY_ID, insightType: 'comprehensive_prediction' },
      expect.objectContaining({ cachedData: ML_RESULT, status: 'active' }),
      { upsert: true, new: true }
    );
  });

  it('does NOT include cached:true flag on a fresh result', async () => {
    const result = await mlSvc.predict(BABY_ID, BABY_DATA);
    expect(result.cached).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// predict() — cache fallback when ML service is down
// ─────────────────────────────────────────────────────────────────────────────

describe('mlService.predict() — cache fallback', () => {
  const BABY_ID = 'baby_offline_456';
  const BABY_DATA = { measurements: [] };
  const CACHED_DATA = { health_score: 75, growth_forecast: null, risk_assessment: null };

  it('returns cached data with cached:true when ML service is unavailable', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('Network Error'));
    AIInsight.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ cachedData: CACHED_DATA }),
      }),
    });

    const result = await mlSvc.predict(BABY_ID, BABY_DATA);

    expect(result.health_score).toBe(75);
    expect(result.cached).toBe(true);
  });

  it('throws when ML service is down AND no cache exists', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('Network Error'));
    AIInsight.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    await expect(mlSvc.predict(BABY_ID, BABY_DATA)).rejects.toThrow(
      'ML service unavailable and no cached results exist'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// predict() — cache save failure is swallowed (non-breaking)
// ─────────────────────────────────────────────────────────────────────────────

describe('mlService.predict() — cache save failure handling', () => {
  it('does not crash if AIInsight.findOneAndUpdate throws', async () => {
    const BABY_ID = 'baby_cache_err_789';
    const ML_RESULT = { health_score: 90, growth_forecast: {}, risk_assessment: {} };

    AIInsight.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    AIInsight.findOneAndUpdate.mockRejectedValueOnce(new Error('DB write failed'));
    mockAxios.post.mockResolvedValue({ data: ML_RESULT });

    // Should not throw — cache save is best-effort
    const result = await mlSvc.predict(BABY_ID, { measurements: [] });
    expect(result.health_score).toBe(90);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// invalidateCache()
// ─────────────────────────────────────────────────────────────────────────────

describe('mlService.invalidateCache()', () => {
  it('calls AIInsight.deleteMany with correct query', async () => {
    AIInsight.deleteMany.mockResolvedValue({ deletedCount: 1 });
    await mlSvc.invalidateCache('baby_inv_001');
    expect(AIInsight.deleteMany).toHaveBeenCalledWith({
      babyId: 'baby_inv_001',
      insightType: 'comprehensive_prediction',
    });
  });

  it('does not throw if AIInsight.deleteMany fails', async () => {
    AIInsight.deleteMany.mockRejectedValueOnce(new Error('DB delete failed'));
    await expect(mlSvc.invalidateCache('baby_inv_002')).resolves.not.toThrow();
  });
});
