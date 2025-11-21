const express = require('express');
const multer = require('multer');
const voiceController = require('../controllers/voiceController');

const router = express.Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper API limit)
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files
        const allowedMimes = [
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/m4a',
            'audio/mp4',
            'audio/webm',
            'audio/ogg'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'));
        }
    }
});

/**
 * POST /api/voice/message
 * Process a voice message: transcribe, get AI response, return audio
 * 
 * Body (multipart/form-data):
 * - audio: Audio file
 * - conversationId: (optional) Conversation ID
 * - voice: (optional) TTS voice (alloy, echo, fable, onyx, nova, shimmer)
 */
router.post('/message', upload.single('audio'), voiceController.processVoiceMessage);

/**
 * POST /api/voice/transcribe
 * Transcribe audio to text only
 * 
 * Body (multipart/form-data):
 * - audio: Audio file
 */
router.post('/transcribe', upload.single('audio'), voiceController.transcribeAudio);

/**
 * POST /api/voice/speak
 * Convert text to speech
 * 
 * Body (JSON):
 * - text: Text to convert
 * - voice: (optional) TTS voice (alloy, echo, fable, onyx, nova, shimmer)
 */
router.post('/speak', voiceController.textToSpeech);

module.exports = router;
