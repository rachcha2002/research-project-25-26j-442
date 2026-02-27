const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/voice/chat
 * Process voice input and return text + audio response
 */
router.post('/chat', upload.single('audio'), async (req, res) => {
    let tempFilePath = null;
    
    try {
        console.log('🎤 Voice chat request received');
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No audio file provided'
            });
        }

        tempFilePath = req.file.path;
        console.log('📁 Audio file saved:', tempFilePath);

        // Initialize Gemini
        const apiKey = process.env.GOOGLE_API_KEY?.replace(/['"]/g, '').trim();
        if (!apiKey) {
            throw new Error('Google API key not configured');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const fileManager = new GoogleAIFileManager(apiKey);

        // Upload audio file to Gemini
        console.log('📤 Uploading audio to Gemini...');
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: req.file.mimetype || 'audio/webm',
            displayName: `voice-${uuidv4()}`
        });

        console.log('✅ Audio uploaded:', uploadResult.file.uri);

        // Process with Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResult.file.mimeType,
                    fileUri: uploadResult.file.uri
                }
            },
            {
                text: `You are PediTrack AI Voice Assistant. Listen to this voice message and respond naturally and helpfully. Keep your response concise (2-3 sentences). Provide medical advice for pediatric health questions in Sri Lankan context.`
            }
        ]);

        const responseText = result.response.text();
        console.log('✅ Gemini response:', responseText);

        // Clean up temp file
        await fs.unlink(tempFilePath);

        // Return response
        res.json({
            success: true,
            text: responseText,
            // For now, client will use text-to-speech
            // Later we can add Gemini's native audio response
        });

    } catch (error) {
        console.error('❌ Voice chat error:', error);
        
        // Clean up temp file on error
        if (tempFilePath) {
            try {
                await fs.unlink(tempFilePath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
