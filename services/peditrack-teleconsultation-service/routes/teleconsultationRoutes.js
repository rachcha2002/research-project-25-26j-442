const express = require('express');
const router = express.Router();
const teleconsultationController = require('../controllers/teleconsultationController');
const teleconsultationQueueController = require('../controllers/teleconsultationQueueController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Patient requests teleconsultation
router.post('/request', teleconsultationController.createRequest);
// Doctor fetches next request
router.get('/next', teleconsultationController.getNextRequest);
// Doctor fetches full pending queue
router.get('/queue', teleconsultationController.getPendingQueue);
// Doctor fetches currently active consultation
router.get('/doctor/:doctorId/active', teleconsultationController.getDoctorActiveRequest);
// Doctor dashboard stats for today
router.get('/stats/today', teleconsultationController.getTodayStats);
// Patient recent teleconsultation requests
router.get('/my-requests', teleconsultationController.getMyRequests);
// Doctor accepts request (assigns LiveKit room)
router.patch('/:id/accept', teleconsultationController.acceptRequest);
// Doctor completes request
router.patch('/:id/complete', teleconsultationController.completeRequest);
// Patient cancels request
router.patch('/:id/cancel', teleconsultationController.cancelRequest);
// Get teleconsultation request by ID
router.get('/request/:id', teleconsultationQueueController.getRequestById);
// Get queue position for a request
router.get('/queue-position/:id', teleconsultationQueueController.getQueuePosition);
// Generate LiveKit video token
router.post('/video-token', teleconsultationController.generateVideoToken);

module.exports = router;
