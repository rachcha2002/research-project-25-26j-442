const express = require('express');
const multer = require('multer');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Configure multer for image uploads (store in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept image files
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files are allowed.'));
        }
    }
});

// Send a message and get AI response
router.post('/message', chatController.sendMessage);

// Send a message with image attachment
router.post('/message-with-image', upload.single('image'), chatController.sendMessageWithImage);

// Get conversation history
router.get('/history/:conversationId', chatController.getHistory);

// Clear conversation history
router.delete('/history/:conversationId', chatController.clearHistory);

// Stream chat response (for real-time streaming)
router.post('/stream', chatController.streamMessage);

// RAG comparison endpoints
router.post('/with-rag', chatController.sendMessageWithRag);
router.post('/without-rag', chatController.sendMessageWithoutRag);

module.exports = router;
