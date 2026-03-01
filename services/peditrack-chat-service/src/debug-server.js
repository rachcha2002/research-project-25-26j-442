const express = require('express');
const expressWs = require('express-ws');
const path = require('path');
const cors = require('cors');

const app = express();
const wsInstance = expressWs(app);
const PORT = 3005;

// Extremely permissive CORS
app.use(cors({ origin: true, credentials: true }));

// Clear HSTS
app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=0');
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

console.log('🐞 STARTING DEBUG SERVER...');

// Simple echo WebSocket
app.ws('/ws/echo', (ws, req) => {
    console.log('🔌 Debug WS connected!');
    ws.send(JSON.stringify({ type: 'text', text: 'Connected to DEBUG server' }));
    
    ws.on('message', (msg) => {
        console.log('📩 Received:', msg);
        ws.send(JSON.stringify({ type: 'text', text: 'Echo: ' + msg }));
    });
    
    ws.on('close', () => console.log('❌ Debug WS closed'));
});

// Gemini Live route (simplified)
app.ws('/ws/live', (ws, req) => {
    console.log('🎙️ === DEBUG LIVE CONNECTION ===');
    console.log('IP:', req.ip);
    
    ws.send(JSON.stringify({ type: 'session_created', sessionId: 'debug-session' }));
    
    ws.on('message', (msg) => {
        // Just log and acknowledge
        console.log('🎤 Got audio/message');
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ==========================================
    🐞 DEBUG SERVER RUNNING ON PORT ${PORT}
    ==========================================
    1. Open: http://192.168.1.2:${PORT}/live-test.html
    2. Try connecting
    ==========================================
    `);
});
