const express = require('express');
const router = express.Router();
const multer = require('multer');
const assessmentController = require('../controllers/assessmentController');

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (allowed.includes(file.mimetype)) {
			cb(null, true);
			return;
		}
		cb(new Error('Invalid file type. Only jpeg, jpg, png and webp are supported.'));
	},
});

// POST risk assessment
router.post('/risk-score', assessmentController.createAssessment);

// POST skin classification (rash image)
router.post('/skin/classify', upload.single('image'), assessmentController.classifySkinImage);

// GET all assessments
router.get('/assessments', assessmentController.getAssessments);

// GET latest persisted assessment report (optional userId query)
router.get('/assessment-reports/latest', assessmentController.getLatestAssessmentReport);

// GET persisted assessment report by assessment_id
router.get('/assessment-reports/:assessmentId', assessmentController.getAssessmentReportById);

module.exports = router;
