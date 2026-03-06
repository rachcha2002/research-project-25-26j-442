const TeleconsultationRequest = require('../models/TeleconsultationRequest');
const mongoose = require('mongoose');

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

// GET /api/teleconsultation/request/:id
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = String(req.userId || '');
    const request = await TeleconsultationRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isParticipant =
      (request.patient?.userId && String(request.patient.userId) === actorId) ||
      (request.doctorId && String(request.doctorId) === actorId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden: cannot access this request' });
    }

    res.json(request);
  } catch (err) {
    console.error('Get teleconsultation request by id error:', err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
};

// GET /api/teleconsultation/queue-position/:id
exports.getQueuePosition = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid request id format' });
    }

    const actorId = String(req.userId || '');
    const request = await TeleconsultationRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isParticipant =
      (request.patient?.userId && String(request.patient.userId) === actorId) ||
      (request.doctorId && String(request.doctorId) === actorId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden: cannot access queue position for this request' });
    }

    const requestPriority = request.risk_priority ?? RISK_PRIORITY[request.risk_level] ?? 0;

    const higherPriorityResult = await TeleconsultationRequest.aggregate([
      {
        $match: {
          status: 'pending',
          _id: { $ne: new mongoose.Types.ObjectId(id) },
        },
      },
      { $addFields: { effectivePriority: priorityExpression } },
      {
        $match: {
          $or: [
            { effectivePriority: { $gt: requestPriority } },
            { effectivePriority: requestPriority, risk_score: { $gt: request.risk_score } },
            {
              effectivePriority: requestPriority,
              risk_score: request.risk_score,
              requestedAt: { $lt: request.requestedAt },
            },
          ],
        },
      },
      { $count: 'count' },
    ]);

    const higherPriority = higherPriorityResult[0]?.count ?? 0;

    // Estimate wait time (e.g., 5 min per consult)
    const estWait = (higherPriority + 1) * 8; // 8 min per consult
    res.json({ position: higherPriority + 1, estWait });
  } catch (err) {
    console.error('Get queue position error:', err);
    res.status(500).json({ error: 'Failed to fetch queue position', details: err?.message || 'Unknown error' });
  }
};
