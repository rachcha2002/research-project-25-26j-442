const TeleconsultationRequest = require('../models/TeleconsultationRequest');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const { createToken } = require('./livekit.service');

const AUTH_USER_SERVICE_API_URL = (process.env.AUTH_USER_SERVICE_API_URL || 'http://localhost:3012/api/doctors').replace(/\/+$/, '');

const RISK_PRIORITY = {
  low: 1,
  medium: 2,
  high: 3,
};

const priorityExpression = {
  $ifNull: [
    '$risk_priority',
    {
      $switch: {
        branches: [
          { case: { $eq: ['$risk_level', 'high'] }, then: 3 },
          { case: { $eq: ['$risk_level', 'medium'] }, then: 2 },
          { case: { $eq: ['$risk_level', 'low'] }, then: 1 },
        ],
        default: 0,
      },
    },
  ],
};

const sanitizeRoomSegment = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9_-]/g, '')
  .slice(0, 40);

const getDoctorDisplayName = async (doctorId) => {
  try {
    if (!doctorId) return null;
    const response = await fetch(`${AUTH_USER_SERVICE_API_URL}/${encodeURIComponent(doctorId)}/public`);
    if (!response.ok) return null;

    const data = await response.json();
    const doctor = data?.doctor;
    if (!doctor) return null;

    const fullName = [doctor.first_name, doctor.last_name].filter(Boolean).join(' ').trim();
    return fullName || null;
  } catch (error) {
    return null;
  }
};

// POST /api/teleconsultation/request
exports.createRequest = async (req, res) => {
  try {
    const { patient = {}, risk_level, risk_score, assessment_id } = req.body;
    const patientUserId = String(req.userId || '');

    if (!patientUserId) {
      return res.status(401).json({ error: 'Unauthorized user context' });
    }

    const riskPriority = RISK_PRIORITY[risk_level] ?? 0;
    const newRequest = new TeleconsultationRequest({
      userId: patientUserId,
      patient: { ...patient, userId: patientUserId, assessment_id },
      risk_level,
      risk_priority: riskPriority,
      risk_score,
      status: 'pending',
    });
    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (err) {
    console.error('Create teleconsultation request error:', err);
    res.status(500).json({ error: 'Failed to create teleconsultation request' });
  }
};

// GET /api/teleconsultation/next
exports.getNextRequest = async (req, res) => {
  try {
    const nextResult = await TeleconsultationRequest.aggregate([
      { $match: { status: 'pending' } },
      { $addFields: { effectivePriority: priorityExpression } },
      { $sort: { effectivePriority: -1, risk_score: -1, requestedAt: 1 } },
      { $limit: 1 },
    ]);

    const next = nextResult[0];
    if (!next) return res.status(404).json({ message: 'No pending requests' });
    res.json(next);
  } catch (err) {
    console.error('Get next teleconsultation request error:', err);
    res.status(500).json({ error: 'Failed to fetch next request' });
  }
};

// GET /api/teleconsultation/queue
exports.getPendingQueue = async (req, res) => {
  try {
    const queue = await TeleconsultationRequest.aggregate([
      { $match: { status: 'pending' } },
      { $addFields: { effectivePriority: priorityExpression } },
      { $sort: { effectivePriority: -1, risk_score: -1, requestedAt: 1 } },
    ]);

    res.json(queue);
  } catch (err) {
    console.error('Get pending teleconsultation queue error:', err);
    res.status(500).json({ error: 'Failed to fetch pending queue' });
  }
};

// GET /api/teleconsultation/doctor/:doctorId/active
exports.getDoctorActiveRequest = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (String(doctorId) !== String(req.userId)) {
      return res.status(403).json({ error: 'Forbidden: cannot access another doctor\'s active consultation' });
    }

    const activeRequest = await TeleconsultationRequest.findOne({
      doctorId,
      status: 'accepted',
    }).sort({ acceptedAt: -1 });

    if (!activeRequest) {
      return res.status(404).json({ message: 'No active request for doctor' });
    }

    res.json(activeRequest);
  } catch (err) {
    console.error('Get doctor active request error:', err);
    res.status(500).json({ error: 'Failed to fetch doctor active request' });
  }
};

// GET /api/teleconsultation/stats/today
exports.getTodayStats = async (req, res) => {
  try {
    const doctorId = String(req.userId || '');

    if (!doctorId) {
      return res.status(401).json({ error: 'Unauthorized user context' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const completedToday = await TeleconsultationRequest.countDocuments({
      doctorId,
      status: 'completed',
      completedAt: { $gte: startOfDay, $lt: endOfDay },
    });

    res.json({ completedToday });
  } catch (err) {
    console.error('Get today teleconsultation stats error:', err);
    res.status(500).json({ error: 'Failed to fetch today stats' });
  }
};

// GET /api/teleconsultation/my-requests?limit=5
exports.getMyRequests = async (req, res) => {
  try {
    const userId = String(req.userId || '');
    const parsedLimit = Number(req.query?.limit);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 20)
      : 5;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user context' });
    }

    const requests = await TeleconsultationRequest.find({ 'patient.userId': userId })
      .sort({ requestedAt: -1 })
      .limit(limit)
      .lean();

    const withDoctorNames = await Promise.all(
      requests.map(async (request) => {
        const doctorId = request?.doctorId ? String(request.doctorId) : '';
        if (!doctorId) {
          return request;
        }

        const doctorName = await getDoctorDisplayName(doctorId);
        return {
          ...request,
          doctorName: doctorName || null,
        };
      })
    );

    return res.json(withDoctorNames);
  } catch (err) {
    console.error('Get my teleconsultation requests error:', err);
    return res.status(500).json({ error: 'Failed to fetch teleconsultation requests' });
  }
};

// PATCH /api/teleconsultation/:id/accept
exports.acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = String(req.userId || '');

    if (!doctorId) {
      return res.status(401).json({ error: 'Unauthorized user context' });
    }

    const existing = await TeleconsultationRequest.findById(id).select('patient.userId userId');
    if (!existing) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const requestUserId = String(existing.patient?.userId || existing.userId || 'unknown');
    const roomUserSegment = sanitizeRoomSegment(requestUserId) || 'unknown';
    const videoRoom = `teleconsult-${roomUserSegment}-${uuidv4().slice(0, 8)}`;
    const updated = await TeleconsultationRequest.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { status: 'accepted', acceptedAt: new Date(), videoRoom, doctorId },
      { returnDocument: 'after' }
    );
    if (!updated) {
      const existing = await TeleconsultationRequest.findById(id);
      if (!existing) return res.status(404).json({ message: 'Request not found' });
      if (existing.status === 'accepted' && existing.doctorId === doctorId) {
        return res.json(existing);
      }
      return res.status(409).json({ message: `Request already ${existing.status}` });
    }
    res.json(updated);
  } catch (err) {
    console.error('Accept teleconsultation request error:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
};

// PATCH /api/teleconsultation/:id/complete
exports.completeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = String(req.userId || '');
    const existing = await TeleconsultationRequest.findById(id);

    if (!existing) return res.status(404).json({ message: 'Request not found' });

    const isDoctor = existing.doctorId && String(existing.doctorId) === actorId;
    const isPatient = existing.patient?.userId && String(existing.patient.userId) === actorId;

    if (!isDoctor && !isPatient) {
      return res.status(403).json({ error: 'Forbidden: not allowed to complete this consultation' });
    }

    if (existing.status === 'completed') {
      return res.json(existing);
    }

    if (existing.status === 'cancelled') {
      return res.status(409).json({ message: 'Cannot complete a cancelled request' });
    }

    existing.status = 'completed';
    existing.completedAt = new Date();
    await existing.save();
    res.json(existing);
  } catch (err) {
    console.error('Complete teleconsultation request error:', err);
    res.status(500).json({ error: 'Failed to complete request' });
  }
};

// PATCH /api/teleconsultation/:id/cancel
exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = String(req.userId || '');
    const existing = await TeleconsultationRequest.findById(id);

    if (!existing) return res.status(404).json({ message: 'Request not found' });

    const isOwnerPatient = existing.patient?.userId && String(existing.patient.userId) === actorId;
    if (!isOwnerPatient) {
      return res.status(403).json({ error: 'Forbidden: only the request owner can cancel' });
    }

    if (existing.status === 'cancelled') {
      return res.json(existing);
    }

    if (existing.status === 'completed') {
      return res.status(409).json({ message: 'Cannot cancel a completed request' });
    }

    existing.status = 'cancelled';
    existing.cancelledAt = new Date();
    await existing.save();

    res.json(existing);
  } catch (err) {
    console.error('Cancel teleconsultation request error:', err);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
};

// POST /api/teleconsultation/video-token
exports.generateVideoToken = async (req, res) => {
  try {
    const { room } = req.body;
    const identity = String(req.userId || '');
    const livekitUrl = String(process.env.LIVEKIT_URL || '').trim();
    const livekitApiKey = String(process.env.LIVEKIT_API_KEY || '').trim();
    const livekitApiSecret = String(process.env.LIVEKIT_API_SECRET || '').trim();

    console.log('[teleconsultation] generateVideoToken request', {
      room,
      identity,
      hasLivekitUrl: Boolean(livekitUrl),
      hasApiKey: Boolean(livekitApiKey),
      hasApiSecret: Boolean(livekitApiSecret),
      livekitUrl,
      livekitApiKeyPrefix: livekitApiKey ? livekitApiKey.slice(0, 6) : '',
    });

    if (!room) {
      return res.status(400).json({ error: 'room is required' });
    }

    if (!identity) {
      return res.status(401).json({ error: 'Unauthorized user context' });
    }

    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      return res.status(500).json({
        error: 'LiveKit server is not configured. Missing LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET.',
      });
    }

    const linkedRequest = await TeleconsultationRequest.findOne({
      videoRoom: room,
      status: 'accepted',
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(identity) ? identity : null },
        { doctorId: identity },
        { 'patient.userId': identity },
      ],
    });

    if (!linkedRequest) {
      console.warn('[teleconsultation] generateVideoToken unauthorized', {
        room,
        identity,
      });
      return res.status(403).json({ error: 'Not authorized for this consultation room' });
    }

    console.log('[teleconsultation] generateVideoToken linked request found', {
      requestId: linkedRequest._id,
      status: linkedRequest.status,
      doctorId: linkedRequest.doctorId,
      patientId: linkedRequest.patient?.userId,
      videoRoom: linkedRequest.videoRoom,
    });

    let participantName = 'Participant';
    const linkedDoctorId = String(linkedRequest.doctorId || '');
    const linkedPatientId = String(linkedRequest.patient?.userId || '');

    if (linkedDoctorId && identity === linkedDoctorId) {
      participantName = (await getDoctorDisplayName(linkedDoctorId)) || 'Doctor';
    } else if (linkedPatientId && identity === linkedPatientId) {
      participantName = String(linkedRequest.patient?.name || 'Patient');
    }

    const token = await createToken({
      roomName: room,
      participantIdentity: identity,
      participantName,
    });
    if (!token || typeof token !== 'string') {
      throw new Error('Generated LiveKit token is invalid');
    }
    console.log('[teleconsultation] generateVideoToken success', {
      room,
      identity,
      participantName,
      requestId: linkedRequest._id,
      tokenType: typeof token,
      tokenLength: token.length,
    });
    res.json({ token, url: livekitUrl });
  } catch (err) {
    console.error('Generate video token error:', err);
    res.status(500).json({ error: 'Failed to generate video token' });
  }
};
