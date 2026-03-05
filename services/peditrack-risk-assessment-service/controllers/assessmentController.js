const Assessment = require('../models/Assessment');
const AssessmentReport = require('../models/AssessmentReport');
const { assessRisk } = require('../utils/riskScoring');

const toTitleRisk = (riskLevel) => {
  if (!riskLevel || typeof riskLevel !== 'string') return 'Low';
  const lower = riskLevel.toLowerCase();
  if (lower === 'high') return 'High';
  if (lower === 'medium') return 'Medium';
  return 'Low';
};

const buildSummary = (assessmentDoc) => {
  const reasons = Array.isArray(assessmentDoc.reasons) ? assessmentDoc.reasons : [];
  if (reasons.length > 0) {
    return reasons.join(', ');
  }

  const dangerSigns = Array.isArray(assessmentDoc.danger_signs) ? assessmentDoc.danger_signs : [];
  if (dangerSigns.length > 0) {
    return `Danger signs observed: ${dangerSigns.join(', ')}`;
  }

  const severeSymptoms = Array.isArray(assessmentDoc.symptoms)
    ? assessmentDoc.symptoms.filter((symptom) => symptom?.severity === 'severe').map((symptom) => symptom?.key).filter(Boolean)
    : [];

  if (severeSymptoms.length > 0) {
    return `Severe symptoms reported: ${severeSymptoms.join(', ')}`;
  }

  return 'Risk assessment completed based on submitted child symptoms and vitals.';
};

const buildAssessmentReportPayload = (assessmentDoc) => {
  const safeDoc = assessmentDoc?.toObject ? assessmentDoc.toObject() : assessmentDoc;

  return {
    assessment_id: safeDoc.assessment_id,
    userId: safeDoc.userId || null,
    child: {
      name: safeDoc.child?.name || null,
      age_months: safeDoc.child?.age_months ?? null,
      weight_kg: safeDoc.child?.weight_kg ?? null,
    },
    assessment: {
      date: safeDoc.createdAt ? new Date(safeDoc.createdAt).toISOString() : new Date().toISOString(),
      risk: toTitleRisk(safeDoc.risk_level),
      score: typeof safeDoc.risk_score === 'number' ? safeDoc.risk_score : 0,
      summary: buildSummary(safeDoc),
      dangerSigns: Array.isArray(safeDoc.danger_signs) ? safeDoc.danger_signs : [],
      symptoms: Array.isArray(safeDoc.symptoms)
        ? safeDoc.symptoms.map((symptom) => ({
            label: symptom?.key || 'Unknown',
            severity: symptom?.severity || 'unknown',
          }))
        : [],
      vitals: {
        temperature: safeDoc.vitals?.temperature_c ?? null,
        heartRate: safeDoc.vitals?.heart_rate_bpm ?? null,
        respRate: safeDoc.vitals?.respiratory_rate_bpm ?? null,
        spo2: safeDoc.vitals?.spo2_percent ?? null,
        avpu: safeDoc.vitals?.avpu || null,
        pain: safeDoc.vitals?.pain_score ?? null,
      },
      feeding: {
        feedingNormally: safeDoc.feeding?.feeding_normally || 'unknown',
        drinkingNormally: safeDoc.feeding?.drinking_normally || 'unknown',
        urineOutput: safeDoc.feeding?.urine_output_last_12h || 'unknown',
      },
      context: {
        chronicConditions: safeDoc.context?.chronic_conditions || '',
        medications: safeDoc.context?.medications || '',
        recentTravel: safeDoc.context?.recent_travel || '',
        exposures: safeDoc.context?.environmental_exposures || '',
        onset: safeDoc.context?.onset || '',
        trend: safeDoc.context?.trend || '',
      },
      reasons: Array.isArray(safeDoc.reasons) ? safeDoc.reasons : [],
      recommendations: Array.isArray(safeDoc.recommendations) ? safeDoc.recommendations : [],
    },
  };
};

// POST /api/risk-score
exports.createAssessment = async (req, res) => {
  try {
    const payload = req.body;
    const userIdFromToken = req.userId ? String(req.userId) : null;
    const userIdFromPayload = payload?.userId ? String(payload.userId) : null;
    const resolvedUserId = userIdFromToken || userIdFromPayload;
    // Calculate risk
    const result = assessRisk(payload);
    // Create assessment_id
    const assessment_id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    // Save to DB
    const assessmentDoc = new Assessment({
      ...payload,
      userId: resolvedUserId,
      ...result,
      assessment_id,
    });
    await assessmentDoc.save();

    const assessmentReportPayload = buildAssessmentReportPayload(assessmentDoc);
    await AssessmentReport.findOneAndUpdate(
      { assessment_id },
      assessmentReportPayload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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

// GET /api/assessment-reports/:assessmentId
exports.getAssessmentReportById = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    if (!assessmentId) {
      return res.status(400).json({ error: 'assessmentId is required' });
    }

    const existingReport = await AssessmentReport.findOne({ assessment_id: assessmentId }).lean();
    if (existingReport) {
      return res.json(existingReport);
    }

    const assessmentDoc = await Assessment.findOne({ assessment_id: assessmentId });
    if (!assessmentDoc) {
      return res.status(404).json({ error: 'Assessment report not found' });
    }

    const generatedPayload = buildAssessmentReportPayload(assessmentDoc);
    const savedReport = await AssessmentReport.findOneAndUpdate(
      { assessment_id: assessmentId },
      generatedPayload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json(savedReport);
  } catch (err) {
    console.error('Get assessment report error:', err);
    return res.status(500).json({ error: 'Failed to fetch assessment report' });
  }
};

// GET /api/assessment-reports/latest?userId=...
exports.getLatestAssessmentReport = async (req, res) => {
  try {
    const userId = req.query?.userId ? String(req.query.userId) : null;
    const query = userId ? { userId } : {};

    const latestReport = await AssessmentReport.findOne(query).sort({ createdAt: -1 }).lean();
    if (latestReport) {
      return res.json(latestReport);
    }

    const latestAssessment = await Assessment.findOne(query).sort({ createdAt: -1 });
    if (!latestAssessment) {
      return res.status(404).json({ error: 'No assessment report found' });
    }

    const generatedPayload = buildAssessmentReportPayload(latestAssessment);
    const savedReport = await AssessmentReport.findOneAndUpdate(
      { assessment_id: generatedPayload.assessment_id },
      generatedPayload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json(savedReport);
  } catch (err) {
    console.error('Get latest assessment report error:', err);
    return res.status(500).json({ error: 'Failed to fetch latest assessment report' });
  }
};
