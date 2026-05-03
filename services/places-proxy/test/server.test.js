const test = require('node:test');
const assert = require('node:assert/strict');

const axios = require('axios');
const {
  nearbyHospitalsHandler,
  travelTimesHandler,
  placePhotoHandler,
} = require('../server');

const createRes = () => {
  const res = {
    statusCode: 200,
    jsonPayload: null,
    redirectUrl: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
    redirect(url) {
      this.redirectUrl = url;
      return this;
    },
  };
  return res;
};

test('nearby hospitals returns 400 when required query params are missing', async () => {
  process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  const req = { query: { lat: '6.9' } };
  const res = createRes();

  await nearbyHospitalsHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.jsonPayload.error, 'Missing lat, lng, or API key');
});

test('nearby hospitals uses rankby=distance without radius and enriches missing photos', async () => {
  process.env.GOOGLE_PLACES_API_KEY = 'test-key';

  const calls = [];
  const originalGet = axios.get;
  axios.get = async (url) => {
    calls.push(url);
    if (url.includes('/nearbysearch/')) {
      return {
        data: {
          results: [{ place_id: 'abc123', name: 'Clinic A' }],
        },
      };
    }

    return {
      data: {
        result: {
          photos: [{ photo_reference: 'photo-1' }],
          formatted_phone_number: '+1-555-1111',
        },
      },
    };
  };

  const req = { query: { lat: '6.91', lng: '79.86' } };
  const res = createRes();

  try {
    await nearbyHospitalsHandler(req, res);
  } finally {
    axios.get = originalGet;
  }

  assert.equal(res.statusCode, 200);
  assert.ok(calls[0].includes('rankby=distance'));
  assert.ok(!calls[0].includes('&radius='));
  assert.equal(res.jsonPayload.results[0].formatted_phone_number, '+1-555-1111');
  assert.equal(res.jsonPayload.results[0].photos[0].photo_reference, 'photo-1');
});

test('travel times returns 400 when required query params are missing', async () => {
  process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  const req = { query: { originLat: '6.9', originLng: '79.8' } };
  const res = createRes();

  await travelTimesHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.jsonPayload.error, 'Missing origin, destinations, or API key');
});

test('place photo redirects to Google photo endpoint with default max width', async () => {
  process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  const req = { query: { photoReference: 'photo-ref-123' } };
  const res = createRes();

  await placePhotoHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.redirectUrl.includes('/place/photo?'));
  assert.ok(res.redirectUrl.includes('maxwidth=500'));
  assert.ok(res.redirectUrl.includes('photo_reference=photo-ref-123'));
});
