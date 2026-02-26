const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
require('dotenv').config();

const chatRoutes = require('./routes/chat.routes');
const healthRoutes = require('./routes/health.routes');
const voiceRoutes = require('./routes/voice.routes');
const geminiLiveRoutes = require('./routes/geminiLive.routes');
const voiceChatRoutes = require('./routes/voiceChat.routes');

const app = express();

// Enable WebSocket support and get instance
const wsInstance = expressWs(app);

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "ws:", "wss:", "https://generativelanguage.googleapis.com"],
            mediaSrc: ["'self'", "blob:", "data:"],
        }
    }
})); // Security headers
app.use(morgan('dev')); // Logging
app.use(cors({
    origin: true, // Reflect request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (voice chat interface)
const path = require('path');
const https = require('https'); // For model listing
app.use(express.static(path.join(__dirname, '../public')));

// Root route - Service status
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>PediTrack Chat Service</title></head>
            <body style="font-family: system-ui; padding: 20px;">
                <h1>PediTrack Chat Service is Running 🚀</h1>
                <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
                <h3>Available Interfaces:</h3>
                <ul>
                    <li><a href="/voice-chat.html">Voice Chat Interface</a></li>
                    <li><a href="/simple-test.html">Connectivity Test</a></li>
                    <li><a href="/debug/models">Check Supported Models</a> (NEW)</li>
                </ul>
                <h3>API Endpoints:</h3>
                <ul>
                    <li>GET /api/health</li>
                    <li>WS /ws/live (Gemini Live)</li>
                </ul>
            </body>
        </html>
    `);
});

// DEBUG: List available Gemini models
app.get('/debug/models', (req, res) => {
    const apiKey = process.env.GOOGLE_API_KEY?.replace(/['"]/g, '').trim();
    if (!apiKey) return res.status(500).json({ error: 'No API Key found' });

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    https.get(url, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.error) return res.status(400).json(json);

                // Filter for models that support 'bidiGenerateContent'
                const liveModels = (json.models || []).filter(m => 
                    m.supportedGenerationMethods && 
                    m.supportedGenerationMethods.includes('bidiGenerateContent')
                ).map(m => m.name);

                res.json({
                    success: true,
                    count: liveModels.length,
                    live_supported_models: liveModels,
                    all_models: json.models?.map(m => m.name) // fallback to see what IS available
                });
            } catch (e) {
                res.status(500).json({ error: e.message, raw: data });
            }
        });
    }).on('error', (e) => {
        res.status(500).json({ error: e.message });
    });
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/voice', voiceChatRoutes); // HTTP-based voice chat

// Gemini Live WebSocket routes - call as function to register on app
geminiLiveRoutes(app);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found'
        }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PediTrack Chat Service running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 LLM Provider: ${process.env.LLM_PROVIDER || 'openai'}`);
    console.log(`🌐 Network: http://192.168.1.2:${PORT}/api`);
    console.log(`📱 For Android Emulator: http://10.0.2.2:${PORT}/api`);
    console.log(`🎙️  Gemini Live WebSocket: ws://localhost:${PORT}/api/voice/live`);
    console.log(`\n✅ Server is ready to accept requests!`);
});

module.exports = app;
