const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'PediTrack Chat Service is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Detailed status endpoint
router.get('/status', (req, res) => {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';
    const hasGoogleKey = !!process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your_google_api_key_here';

    res.status(200).json({
        success: true,
        service: 'PediTrack Chat Service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        llmProviders: {
            openai: {
                configured: hasOpenAIKey,
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
            },
            anthropic: {
                configured: hasAnthropicKey,
                model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229'
            },
            google: {
                configured: hasGoogleKey,
                model: process.env.GEMINI_MODEL || 'gemini-pro'
            }
        }
    });
});

module.exports = router;
