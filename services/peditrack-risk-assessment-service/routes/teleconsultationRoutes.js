const express = require('express');
const router = express.Router();
const teleconsultationController = require('../controllers/teleconsultationController');
const teleconsultationQueueController = require('../controllers/teleconsultationQueueController');
const twilioController = require('../controllers/twilioController');

// Patient requests teleconsultation
router.post('/request', teleconsultationController.createRequest);
// Doctor fetches next request
router.get('/next', teleconsultationController.getNextRequest);
// Doctor accepts request (assigns Twilio room)
router.patch('/:id/accept', teleconsultationController.acceptRequest);
// Doctor completes request
router.patch('/:id/complete', teleconsultationController.completeRequest);
// Get teleconsultation request by ID
router.get('/request/:id', teleconsultationQueueController.getRequestById);
// Get queue position for a request
router.get('/queue-position/:id', teleconsultationQueueController.getQueuePosition);

module.exports = router;

// Twilio video token generation
router.post('/video-token', twilioController.generateToken);
