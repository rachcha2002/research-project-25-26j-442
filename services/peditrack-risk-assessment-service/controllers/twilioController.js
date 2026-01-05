const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !apiKeySid || !apiKeySecret) {
  console.warn('Twilio credentials are not set in environment variables.');
}

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

exports.generateToken = (req, res) => {
  const { identity, room } = req.body;
  if (!identity || !room) {
    return res.status(400).json({ error: 'identity and room are required' });
  }

  try {
    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, { identity });
    token.addGrant(new VideoGrant({ room }));
    res.json({ token: token.toJwt() });
  } catch (err) {
    console.error('Error generating Twilio token:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
};
