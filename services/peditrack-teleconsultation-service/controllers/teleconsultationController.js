const TeleconsultationRequest = require('../models/TeleconsultationRequest');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const { createToken } = require('./livekit.service');

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

// POST /api/teleconsultation/request
exports.createRequest = async (req, res) => {
  try {
    const { patient, risk_level, risk_score, assessment_id } = req.body;
    const riskPriority = RISK_PRIORITY[risk_level] ?? 0;
    const newRequest = new TeleconsultationRequest({
      patient: { ...patient, assessment_id },
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

// PATCH /api/teleconsultation/:id/accept
exports.acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId } = req.body || {};

    if (!doctorId) {
      return res.status(400).json({ error: 'doctorId is required' });
    }

    const videoRoom = `teleconsult-${uuidv4()}`;
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
    const updated = await TeleconsultationRequest.findByIdAndUpdate(
      id,
      { status: 'completed', completedAt: new Date() },
      { returnDocument: 'after' }
    );
    if (!updated) return res.status(404).json({ message: 'Request not found' });
    res.json(updated);
  } catch (err) {
    console.error('Complete teleconsultation request error:', err);
    res.status(500).json({ error: 'Failed to complete request' });
  }
};

// POST /api/teleconsultation/video-token
exports.generateVideoToken = async (req, res) => {
  try {
    const { identity, room } = req.body;

    if (!identity || !room) {
      return res.status(400).json({ error: 'identity and room are required' });
    }

    const linkedRequest = await TeleconsultationRequest.findOne({
      videoRoom: room,
      status: 'accepted',
      $or: [{ _id: mongoose.Types.ObjectId.isValid(identity) ? identity : null }, { doctorId: identity }],
    });

    if (!linkedRequest) {
      return res.status(403).json({ error: 'Not authorized for this consultation room' });
    }

    const token = createToken({ roomName: room, participantName: identity });
    res.json({ token, url: process.env.LIVEKIT_URL });
  } catch (err) {
    console.error('Generate video token error:', err);
    res.status(500).json({ error: 'Failed to generate video token' });
  }
};
