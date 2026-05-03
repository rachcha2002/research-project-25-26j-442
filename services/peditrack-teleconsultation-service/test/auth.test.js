const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { authenticateToken } = require('../middleware/auth');

const createMockReqRes = (authorizationHeader) => {
  const req = {
    header: (key) => {
      if (key === 'Authorization') return authorizationHeader;
      return undefined;
    },
  };

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return { req, res };
};

test('returns 401 when bearer token is missing', () => {
  process.env.JWT_SECRET = 'test-secret';
  delete process.env.JWT_ACCESS_SECRET;

  const { req, res } = createMockReqRes(undefined);
  let nextCalled = false;

  authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Access denied. Missing bearer token.');
});

test('returns 401 for invalid token', () => {
  process.env.JWT_SECRET = 'test-secret';
  delete process.env.JWT_ACCESS_SECRET;

  const { req, res } = createMockReqRes('Bearer not-a-valid-token');
  let nextCalled = false;

  authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Invalid token');
  assert.equal(res.body.code, 'INVALID_TOKEN');
});

test('sets req.userId and calls next for a valid token', () => {
  process.env.JWT_SECRET = 'test-secret';
  delete process.env.JWT_ACCESS_SECRET;

  const token = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const { req, res } = createMockReqRes(`Bearer ${token}`);
  let nextCalled = false;

  authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
  assert.equal(req.userId, 'user-123');
  assert.ok(req.user);
});

test('returns 401 with TOKEN_EXPIRED code for expired token', () => {
  process.env.JWT_SECRET = 'test-secret';
  delete process.env.JWT_ACCESS_SECRET;

  const expiredToken = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET, { expiresIn: -10 });
  const { req, res } = createMockReqRes(`Bearer ${expiredToken}`);
  let nextCalled = false;

  authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Token expired');
  assert.equal(res.body.code, 'TOKEN_EXPIRED');
});
