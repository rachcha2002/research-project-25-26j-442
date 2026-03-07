const axios = require('axios');
const FormData = require('form-data');

const DEFAULT_MODEL_NAME = 'efficientnet-b0';

const CLASS_LABELS = [
  'eczema',
  'urticaria',
  'impetigo',
  'chickenpox',
  'cellulitis',
  'measles_like_rash',
];

function resolveModelUrl(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return '';

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  if (/\/predict-skin$/i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/predict-skin`;
}

function normalizePrediction(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid classifier response');
  }

  // Accept either direct fields or nested payloads.
  const predictedClass =
    data.predicted_class ||
    data.class_name ||
    data.label ||
    data.prediction ||
    data.result?.predicted_class ||
    data.result?.class_name ||
    data.result?.label ||
    null;

  const confidenceCandidate =
    data.confidence ??
    data.score ??
    data.probability ??
    data.result?.confidence ??
    data.result?.score ??
    null;

  const confidence =
    typeof confidenceCandidate === 'number'
      ? confidenceCandidate
      : Number.isFinite(Number(confidenceCandidate))
      ? Number(confidenceCandidate)
      : null;

  const model = data.model || data.model_name || data.result?.model || DEFAULT_MODEL_NAME;
  const version = data.version || data.model_version || data.result?.version || null;

  if (!predictedClass || typeof predictedClass !== 'string') {
    throw new Error('Classifier response does not include a valid predicted class');
  }

  return {
    predicted_class: predictedClass,
    confidence,
    model,
    version,
    labels: Array.isArray(data.labels) ? data.labels : CLASS_LABELS,
    raw: data,
  };
}

async function classifySkinImage(file) {
  const configuredUrl = process.env.SKIN_MODEL_URL;
  const modelUrl = resolveModelUrl(configuredUrl);
  const modelApiKey = process.env.SKIN_MODEL_API_KEY;

  if (!modelUrl) {
    throw new Error('SKIN_MODEL_URL is not configured in risk-assessment-service environment');
  }

  if (!file || !file.buffer) {
    throw new Error('Image buffer is required for skin classification');
  }

  const form = new FormData();
  form.append('image', file.buffer, {
    filename: file.originalname || 'rash-image.jpg',
    contentType: file.mimetype || 'image/jpeg',
  });

  const headers = {
    ...form.getHeaders(),
  };

  if (modelApiKey) {
    headers.Authorization = `Bearer ${modelApiKey}`;
  }

  let response;
  try {
    response = await axios.post(modelUrl, form, {
      headers,
      timeout: 25000,
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024,
    });
  } catch (error) {
    const status = error?.response?.status;
    const responseData = error?.response?.data;
    const detailText =
      typeof responseData === 'string'
        ? responseData
        : responseData && typeof responseData === 'object'
        ? JSON.stringify(responseData)
        : error?.message || 'Unknown upstream error';

    throw new Error(
      `Skin model request failed (${status || 'no-status'}) url=${modelUrl} details=${detailText}`
    );
  }

  return normalizePrediction(response.data);
}

module.exports = {
  classifySkinImage,
  CLASS_LABELS,
};
