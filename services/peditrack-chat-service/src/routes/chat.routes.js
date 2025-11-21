const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Send a message and get AI response
router.post('/message', chatController.sendMessage);

// Get conversation history
router.get('/history/:conversationId', chatController.getHistory);

// Clear conversation history
router.delete('/history/:conversationId', chatController.clearHistory);

// Stream chat response (for real-time streaming)
router.post('/stream', chatController.streamMessage);

module.exports = router;
