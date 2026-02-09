const { getGeminiLiveService } = require('../services/geminiLive.service');
const { v4: uuidv4 } = require('uuid');

console.log('🎙️  Gemini Live routes module loaded');

/**
 * Register Gemini Live WebSocket routes
 * This function should be called with the Express app that has WebSocket support
 */
function registerGeminiLiveRoutes(app) {
    console.log('🎙️  Registering Gemini Live WebSocket route');

    /**
     * WebSocket endpoint for Gemini Live voice streaming
     * WS /ws/live?conversationId=xxx
     */
    app.ws('/ws/live', async (ws, req) => {
        console.log('🎙️  ===== NEW WEBSOCKET CONNECTION =====');
        console.log('🎙️  Client IP:', req.ip);
        console.log('🎙️  Query params:', req.query);
        
        let sessionId = null;
        const geminiLiveService = getGeminiLiveService();
        const conversationId = req.query.conversationId || uuidv4();

        console.log(`🎙️  Conversation ID: ${conversationId}`);

        try {
            // Get API key from environment
            const apiKey = process.env.GOOGLE_API_KEY?.replace(/['"]/g, '').trim();
            if (!apiKey) {
                ws.send(JSON.stringify({
                    type: 'error',
                    error: 'Google API key not configured'
                }));
                ws.close();
                return;
            }

            // Create Gemini Live session
            sessionId = await geminiLiveService.createSession(conversationId, apiKey);

            // Send session created confirmation
            ws.send(JSON.stringify({
                type: 'session_created',
                sessionId,
                conversationId
            }));

            // Set up Gemini message handler
            geminiLiveService.onMessage(sessionId, (message) => {
                // Forward Gemini messages to client
                ws.send(JSON.stringify(message));
            });

            // Handle messages from client
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());

                    switch (message.type) {
                        case 'audio':
                            // Client sending audio chunk
                            if (message.data) {
                                const audioBuffer = Buffer.from(message.data, 'base64');
                                await geminiLiveService.sendAudio(sessionId, audioBuffer, message.sampleRate || 16000);
                            }
                            break;

                        case 'text':
                            // Client sending text message
                            if (message.text) {
                                await geminiLiveService.sendText(sessionId, message.text);
                            }
                            break;

                        case 'interrupt':
                            // Client wants to interrupt AI
                            await geminiLiveService.interrupt(sessionId);
                            break;

                        default:
                            console.warn('Unknown message type:', message.type);
                    }
                } catch (error) {
                    console.error('❌ Error handling client message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });

            // Handle client disconnect
            ws.on('close', () => {
                console.log(`🛑 Client disconnected from session: ${sessionId}`);
                if (sessionId) {
                    geminiLiveService.endSession(sessionId);
                }
            });

            // Handle errors
            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                if (sessionId) {
                    geminiLiveService.endSession(sessionId);
                }
            });

        } catch (error) {
            console.error('❌ Failed to create Gemini Live session:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
            ws.close();
        }
    });

    /**
     * GET /api/voice/live/status
     * Get status of Gemini Live service
     */
    app.get('/api/voice/live/status', (req, res) => {
        const geminiLiveService = getGeminiLiveService();
        res.json({
            success: true,
            activeSessions: geminiLiveService.getActiveSessionCount(),
            status: 'operational'
        });
    });
}

module.exports = registerGeminiLiveRoutes;
