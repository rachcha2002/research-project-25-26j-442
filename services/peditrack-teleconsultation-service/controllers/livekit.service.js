const { AccessToken } = require('livekit-server-sdk');

async function createToken({ roomName, participantIdentity, participantName }) {
  const apiKey = String(process.env.LIVEKIT_API_KEY || '').trim();
  const apiSecret = String(process.env.LIVEKIT_API_SECRET || '').trim();

  if (!apiKey || !apiSecret) {
    throw new Error('LIVEKIT_API_KEY or LIVEKIT_API_SECRET is missing');
  }

  if (!roomName || !participantIdentity) {
    throw new Error('roomName and participantIdentity are required to create LiveKit token');
  }

  const displayName = String(participantName || participantIdentity);

  const at = new AccessToken(apiKey, apiSecret, {
    identity: String(participantIdentity),
    name: displayName,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName
  });

  const jwt = await at.toJwt();
  return String(jwt);
}

module.exports = { createToken };