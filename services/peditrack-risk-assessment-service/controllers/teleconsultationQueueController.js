const TeleconsultationRequest = require('../models/TeleconsultationRequest');

// GET /api/teleconsultation/request/:id
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await TeleconsultationRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
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
    const request = await TeleconsultationRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    // Count number of pending requests with higher priority or earlier time
    const higherPriority = await TeleconsultationRequest.countDocuments({
      status: 'pending',
      $or: [
        { risk_level: { $gt: request.risk_level } },
        { risk_level: request.risk_level, risk_score: { $gt: request.risk_score } },
        { risk_level: request.risk_level, risk_score: request.risk_score, requestedAt: { $lt: request.requestedAt } },
      ],
    });
    // Estimate wait time (e.g., 5 min per consult)
    const estWait = (higherPriority + 1) * 8; // 8 min per consult
    res.json({ position: higherPriority + 1, estWait });
  } catch (err) {
    console.error('Get queue position error:', err);
    res.status(500).json({ error: 'Failed to fetch queue position' });
  }
};
