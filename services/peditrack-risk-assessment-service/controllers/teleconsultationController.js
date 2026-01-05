const TeleconsultationRequest = require('../models/TeleconsultationRequest');
const { v4: uuidv4 } = require('uuid');
const id = uuidv4();

// POST /api/teleconsultation/request
exports.createRequest = async (req, res) => {
  try {
    const { patient, risk_level, risk_score, assessment_id } = req.body;
    const newRequest = new TeleconsultationRequest({
      patient: { ...patient, assessment_id },
      risk_level,
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
    // Find the highest priority pending request
    const next = await TeleconsultationRequest.findOne({ status: 'pending' })
      .sort({ risk_level: -1, risk_score: -1, requestedAt: 1 });
    if (!next) return res.status(404).json({ message: 'No pending requests' });
    res.json(next);
  } catch (err) {
    console.error('Get next teleconsultation request error:', err);
    res.status(500).json({ error: 'Failed to fetch next request' });
  }
};

// PATCH /api/teleconsultation/:id/accept
exports.acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    // Generate a unique Twilio room name
    const videoRoom = `teleconsult-${uuidv4()}`;
    const updated = await TeleconsultationRequest.findByIdAndUpdate(
      id,
      { status: 'accepted', acceptedAt: new Date(), videoRoom },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Request not found' });
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
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Request not found' });
    res.json(updated);
  } catch (err) {
    console.error('Complete teleconsultation request error:', err);
    res.status(500).json({ error: 'Failed to complete request' });
  }
};
