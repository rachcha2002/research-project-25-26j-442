const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');

// POST risk assessment
router.post('/risk-score', assessmentController.createAssessment);

// GET all assessments
router.get('/assessments', assessmentController.getAssessments);

// GET latest persisted assessment report (optional userId query)
router.get('/assessment-reports/latest', assessmentController.getLatestAssessmentReport);

// GET persisted assessment report by assessment_id
router.get('/assessment-reports/:assessmentId', assessmentController.getAssessmentReportById);

module.exports = router;
