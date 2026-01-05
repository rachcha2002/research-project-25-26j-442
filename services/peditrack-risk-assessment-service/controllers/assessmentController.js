const Assessment = require('../models/Assessment');
const { assessRisk } = require('../utils/riskScoring');

// POST /api/risk-score
exports.createAssessment = async (req, res) => {
  try {
    const payload = req.body;
    // Calculate risk
    const result = assessRisk(payload);
    // Create assessment_id
    const assessment_id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    // Save to DB
    const assessmentDoc = new Assessment({
      ...payload,
      ...result,
      assessment_id,
    });
    await assessmentDoc.save();
    // Respond
    res.json({
      assessment_id,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Risk score error:', err);
    res.status(500).json({ error: 'Risk assessment failed' });
  }
};

// GET /api/assessments
exports.getAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find().sort({ createdAt: -1 }).limit(50);
    res.json(assessments);
  } catch (err) {
    console.error('Get assessments error:', err);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
};
