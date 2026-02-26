const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const conversationStore = require('../utils/conversationStore');
const { getRagService } = require('./rag.service');

/**
 * OPTIMIZED Gemini Live API Service
 * Fixed: System prompt, VAD settings, speech recognition
 */
class GeminiLiveService {
    constructor() {
        this.ragService = getRagService();
        this.activeSessions = new Map();
        this.GEMINI_LIVE_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
    }

    async createSession(conversationId, apiKey) {
        try {
            const sessionId = uuidv4();
            console.log(`🎙️  Creating session: ${sessionId}`);

            const systemInstruction = this._buildSystemInstruction();
            const ws = new WebSocket(`${this.GEMINI_LIVE_URL}?key=${apiKey}`);

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

                ws.on('open', () => {
                    clearTimeout(timeout);
                    console.log('✅ Connected');

                    ws.send(JSON.stringify({
                        setup: {
                            model: 'models/gemini-2.5-flash-native-audio-latest',
                            generation_config: {
                                response_modalities: ['AUDIO'],
                                speech_config: {
                                    voice_config: {
                                        prebuilt_voice_config: {
                                            voice_name: 'Aoede'
                                        }
                                    }
                                },
                                temperature: 0.7,
                                top_p: 0.9
                            },
                            realtime_input_config: {
                                automatic_activity_detection: {
                                    disabled: false
                                }
                            },
                            input_audio_transcription: {},
                            output_audio_transcription: {},
                            system_instruction: {
                                parts: [{ text: systemInstruction }]
                            }
                        }
                    }));

                    this.activeSessions.set(sessionId, {
                        ws,
                        conversationId,
                        createdAt: Date.now()
                    });

                    resolve(sessionId);
                });

                ws.on('error', (error) => {
                    clearTimeout(timeout);
                    console.error('❌ WS error:', error);
                    reject(error);
                });

                ws.on('close', (code, reason) => {
                    console.log(`🛑 Disconnected: ${code}`);
                });
            });

        } catch (error) {
            console.error('❌ Session creation failed:', error);
            throw error;
        }
    }

    async sendAudio(sessionId, audioData, sampleRate = 16000) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        try {
            session.ws.send(JSON.stringify({
                realtime_input: {
                    media_chunks: [{
                        mime_type: `audio/pcm;rate=${sampleRate}`,
                        data: Buffer.from(audioData).toString('base64')
                    }]
                }
            }));
        } catch (error) {
            console.error('❌ Send audio error:', error);
            throw error;
        }
    }

    onMessage(sessionId, callback) {
        const session = this.activeSessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        session.ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                
                if (msg.setupComplete) {
                    callback({ type: 'setup_complete' });
                }
                
                if (msg.serverContent) {
                    const content = msg.serverContent;
                    
                    if (content.modelTurn?.parts) {
                        for (const part of content.modelTurn.parts) {
                            if (part.inlineData?.mimeType?.includes('audio/pcm')) {
                                callback({ type: 'audio', data: part.inlineData.data });
                            }
                            if (part.text) {
                                callback({ type: 'text', text: part.text });
                            }
                        }
                    }
                    
                    if (content.input_transcription?.text) {
                        callback({ type: 'user_transcript', text: content.input_transcription.text });
                    }
                    
                    if (content.output_transcription?.text) {
                        callback({ type: 'ai_transcript', text: content.output_transcription.text });
                    }
                }

                if (msg.error) {
                    callback({ type: 'error', error: msg.error });
                }

            } catch (error) {
                callback({ type: 'error', error: error.message });
            }
        });
    }

    async endSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        session.ws.close();
        this.activeSessions.delete(sessionId);
    }

    /**
     * FIXED: Removed excessive "ENGLISH ONLY" warnings
     * Natural, concise prompt that doesn't confuse the AI
     */
    _buildSystemInstruction() {
        return `You are PediTrack AI, a helpful pediatric health assistant for Sri Lankan families.

You communicate in English through natural voice conversation. Listen carefully and respond warmly.

Guidelines:
- Speak naturally (2-3 sentences typically)
- Be warm and supportive
- Use clear, simple language
- Provide practical advice
- Prioritize child safety
- Reference Sri Lankan context (foods, climate, healthcare)
- Ask brief questions if unclear
- Recommend doctors for serious concerns

Wait for the parent to speak first.`;
    }

    getActiveSessionCount() {
        return this.activeSessions.size;
    }

    cleanupOldSessions(maxAge = 30 * 60 * 1000) {
        const now = Date.now();
        for (const [sid, session] of this.activeSessions.entries()) {
            if (now - session.createdAt > maxAge) {
                this.endSession(sid);
            }
        }
    }
}

let instance = null;

function getGeminiLiveService() {
    if (!instance) {
        instance = new GeminiLiveService();
        setInterval(() => instance.cleanupOldSessions(), 5 * 60 * 1000);
    }
    return instance;
}

module.exports = { GeminiLiveService, getGeminiLiveService };
