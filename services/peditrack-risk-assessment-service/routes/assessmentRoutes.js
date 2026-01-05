const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');

// POST risk assessment
router.post('/risk-score', assessmentController.createAssessment);

// GET all assessments
router.get('/assessments', assessmentController.getAssessments);

module.exports = router;
