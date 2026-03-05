/**
 * mlService.js — Axios wrapper for the Python ML service.
 * Simplified for the unified Two-Model Predictor API.
 */
const axios = require('axios');
const AIInsight = require('../models/AIInsight');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5003';

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getCached(babyId, insightType) {
  return AIInsight.findOne({
    babyId,
    insightType,
    generatedDate: { $gte: new Date(Date.now() - CACHE_TTL_MS) },
  }).sort({ generatedDate: -1 }).lean();
}

async function saveCache(babyId, insightType, data, confidence) {
  try {
    await AIInsight.findOneAndUpdate(
      { babyId, insightType },
      {
        babyId,
        insightType,
        generatedDate: new Date(),
        confidenceScore: confidence,
        cachedData: data,
        status: 'active',
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('[mlService] Cache save failed:', err.message);
  }
}

const _lastCallMap = new Map();
const RATE_LIMIT_MS = 5 * 60 * 1000;

function isRateLimited(babyId, type) {
  const key = `${babyId}:${type}`;
  const last = _lastCallMap.get(key);
  if (last && Date.now() - last < RATE_LIMIT_MS) return true;
  _lastCallMap.set(key, Date.now());
  return false;
}

async function predict(babyId, babyData) {
  const cacheType = 'comprehensive_prediction';
  if (isRateLimited(babyId, 'predict')) {
    const cached = await getCached(babyId, cacheType);
    if (cached) return { ...cached.cachedData, cached: true };
  }
  try {
    const { data } = await client.post('/predict', babyData);
    await saveCache(babyId, cacheType, data, 0.92);
    return data;
  } catch (err) {
    console.error('[mlService] predict failed:', err.message);
    const cached = await getCached(babyId, cacheType);
    if (cached) return { ...cached.cachedData, cached: true };
    throw new Error('ML service unavailable and no cached results exist');
  }
}

async function healthCheck() {
  try {
    const { data } = await client.get('/health', { timeout: 5000 });
    return data;
  } catch {
    return { status: 'unhealthy', models_loaded: { pic_growth: false, srilanka_risks: false } };
  }
}

/**
 * Invalidate the cached prediction for a baby.
 * Call this whenever a measurement is added, updated, or deleted so the
 * next request to /ai/predictions or /ai/health-score gets a fresh result
 * instead of the stale 24-hour cache.
 */
async function invalidateCache(babyId) {
  // Clear in-memory rate-limit entry so the next predict() call goes through
  _lastCallMap.delete(`${babyId}:predict`);

  // Remove the MongoDB cached document
  try {
    await AIInsight.deleteMany({ babyId, insightType: 'comprehensive_prediction' });
  } catch (err) {
    console.warn('[mlService] Cache invalidation DB delete failed:', err.message);
  }
}

module.exports = { predict, healthCheck, invalidateCache };
