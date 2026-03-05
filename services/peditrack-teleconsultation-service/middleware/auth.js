const jwt = require('jsonwebtoken');

const verifyTokenWithSecrets = (token) => {
  const secrets = [process.env.JWT_ACCESS_SECRET, process.env.JWT_SECRET].filter(Boolean);
  if (secrets.length === 0) {
    return { error: 'No JWT secrets configured' };
  }

  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret);
      return { decoded };
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        return { error: 'TOKEN_EXPIRED', code: 'TOKEN_EXPIRED' };
      }
      if (error?.name !== 'JsonWebTokenError') {
        return { error: 'AUTH_ERROR', details: error };
      }
    }
  }

  return { error: 'INVALID_TOKEN', code: 'INVALID_TOKEN' };
};

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. Missing bearer token.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { decoded, error, code, details } = verifyTokenWithSecrets(token);

    if (error === 'No JWT secrets configured') {
      return res.status(500).json({ error: 'JWT secret is not configured.' });
    }

    if (error === 'TOKEN_EXPIRED') {
      return res.status(401).json({ error: 'Token expired', code });
    }

    if (error === 'INVALID_TOKEN') {
      return res.status(401).json({ error: 'Invalid token', code });
    }

    if (error === 'AUTH_ERROR') {
      console.error('Teleconsultation auth middleware error:', details);
      return res.status(500).json({ error: 'Authentication failed' });
    }

    req.userId = String(decoded.userId || decoded.doctor_id || '');
    req.user = decoded;

    if (!req.userId) {
      return res.status(401).json({ error: 'Invalid token payload.' });
    }

    next();
  } catch (error) {
    console.error('Teleconsultation auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = { authenticateToken };
