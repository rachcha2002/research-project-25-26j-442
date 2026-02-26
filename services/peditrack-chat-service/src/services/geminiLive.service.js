const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const conversationStore = require('../utils/conversationStore');
const { getRagService } = require('./rag.service');

/**
 * Gemini Live API Service
 * Handles real-time bidirectional audio streaming with Gemini
 * https://ai.google.dev/api/multimodal-live
 */
class GeminiLiveService {
    constructor() {
        this.ragService = getRagService();
        this.activeSessions = new Map(); // sessionId -> session data
        this.GEMINI_LIVE_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
    }

    /**
     * Create a new Gemini Live session
     */
    async createSession(conversationId, apiKey, language = 'en') {
        try {
            const sessionId = uuidv4();
            console.log(`🎙️  Creating Gemini Live session: ${sessionId}`);

            // Get conversation history for context
            const history = conversationStore.getHistory(conversationId) || [];
            
            // Try to get RAG context from the last user message if available
            let ragContext = '';
            /* DISABLE RAG TEMPORARILY TO FIX HALLUCINATIONS
            if (history.length > 0) {
                const lastUserMessage = [...history].reverse().find(msg => msg.role === 'user');
                if (lastUserMessage) {
                    try {
                        const ragResult = await this.ragService.retrieveDocuments(
                            lastUserMessage.content,
                            3,
                            0.0
                        );
                        if (ragResult.success && ragResult.context) {
                            ragContext = ragResult.context;
                            console.log('✅ Enhanced session with RAG context');
                        }
                    } catch (error) {
                        console.warn('⚠️  RAG unavailable for session context:', error.message);
                    }
                }
            }
            */

            // Build system instruction with RAG context
            const systemInstruction = this._buildSystemInstruction(ragContext, language);

            // Connect to Gemini Live API
            const ws = new WebSocket(`${this.GEMINI_LIVE_URL}?key=${apiKey}`);

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 10000);

                ws.on('open', () => {
                    clearTimeout(timeout);
                    console.log('✅ Connected to Gemini Live API');

                    const setupMessage = {
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
                                }
                            },
                            // Enable Voice Activity Detection
                            realtime_input_config: {
                                automatic_activity_detection: {
                                    disabled: false,
                                    prefix_padding_ms: 180,
                                    silence_duration_ms: 450
                                }
                            },
                            // Enable transcription for debugging
                            input_audio_transcription: {},
                            output_audio_transcription: {},
                            system_instruction: {
                                parts: [{ text: systemInstruction }]
                            }
                        }
                    };

                    ws.send(JSON.stringify(setupMessage));

                    // Store session
                    this.activeSessions.set(sessionId, {
                        ws,
                        conversationId,
                        createdAt: Date.now(),
                        ragContext,
                        language
                    });

                    resolve(sessionId);
                });

                ws.on('error', (error) => {
                    clearTimeout(timeout);
                    console.error('❌ Gemini Live WebSocket error:', error);
                    reject(error);
                });

                ws.on('close', (code, reason) => {
                    console.log(`🛑 Gemini Live API disconnected: ${code} - ${reason.toString()}`);
                });
            });

        } catch (error) {
            console.error('❌ Failed to create Gemini Live session:', error);
            throw error;
        }
    }

    /**
     * Send audio chunk to Gemini Live
     */
    async sendAudio(sessionId, audioData, sampleRate = 16000) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        try {
            // Convert audio buffer to base64
            const base64Audio = Buffer.from(audioData).toString('base64');

            const message = {
                realtime_input: {
                    media_chunks: [
                        {
                            mime_type: `audio/pcm;rate=${sampleRate}`,
                            data: base64Audio
                        }
                    ]
                }
            };

            session.ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('❌ Error sending audio:', error);
            throw error;
        }
    }

    /**
     * Notify Gemini that current audio stream has paused/ended
     * Helps flush buffered speech and improves final-word transcription quality.
     */
    async sendAudioStreamEnd(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        try {
            session.ws.send(JSON.stringify({
                realtime_input: {
                    audio_stream_end: true
                }
            }));
        } catch (error) {
            console.error('❌ Error sending audio_stream_end:', error);
            throw error;
        }
    }

    /**
     * Send text message to Gemini Live (for context or queries)
     */
    async sendText(sessionId, text) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        try {
            const message = {
                client_content: {
                    turns: [
                        {
                            role: 'user',
                            parts: [{ text }]
                        }
                    ],
                    turn_complete: true
                }
            };

            session.ws.send(JSON.stringify(message));

            // Store in conversation history
            conversationStore.addMessage(session.conversationId, {
                id: uuidv4(),
                role: 'user',
                content: text,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Error sending text:', error);
            throw error;
        }
    }

    /**
     * Set up message handler for a session
     */
    onMessage(sessionId, callback) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        session.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📩 Received from Gemini:', JSON.stringify(message).substring(0, 200) + '...');
                
                // Handle different message types
                if (message.setupComplete) {
                    console.log('✅ Gemini Live setup complete');
                    callback({ type: 'setup_complete' });
                }
                
                if (message.serverContent) {
                    const content = message.serverContent;
                    
                    // Handle audio response
                    if (content.modelTurn?.parts) {
                        for (const part of content.modelTurn.parts) {
                            console.log('📦 Part MIME:', part.inlineData?.mimeType);
                            
                            if (part.inlineData?.mimeType && part.inlineData.mimeType.includes('audio/pcm')) {
                                callback({
                                    type: 'audio',
                                    data: part.inlineData.data
                                });
                            } else if (part.inlineData) {
                                console.log('⚠️ Unknown MIME type:', part.inlineData.mimeType);
                            }
                            
                            if (part.text) {
                                callback({
                                    type: 'text',
                                    text: part.text
                                });
                                
                                // Store assistant response in history
                                conversationStore.addMessage(session.conversationId, {
                                    id: uuidv4(),
                                    role: 'assistant',
                                    content: part.text,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        }
                    }
                    
                    // Handle turn completion
                    if (content.turnComplete) {
                        callback({ type: 'turn_complete' });
                    }

                    // Handle interruption signal (clear any queued playback on clients)
                    if (content.interrupted === true) {
                        callback({ type: 'interrupted' });
                    }
                    
                    // Handle user input transcription (what the user said)
                    if (content.input_transcription?.text) {
                        console.log('🗣️  User said:', content.input_transcription.text);
                        callback({
                            type: 'user_transcript',
                            text: content.input_transcription.text
                        });
                    }
                    
                    // Handle model output transcription (what AI said - text version)
                    if (content.output_transcription?.text) {
                        console.log('🤖 AI said:', content.output_transcription.text);
                        callback({
                            type: 'ai_transcript',
                            text: content.output_transcription.text
                        });
                    }
                }

                // Handle errors
                if (message.error) {
                    console.error('❌ Gemini Live error:', message.error);
                    callback({
                        type: 'error',
                        error: message.error
                    });
                }

            } catch (error) {
                console.error('❌ Error processing message:', error);
                callback({
                    type: 'error',
                    error: error.message
                });
            }
        });
    }

    /**
     * Interrupt the current AI response
     */
    async interrupt(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        try {
            const message = {
                client_content: {
                    turn_complete: true
                }
            };

            session.ws.send(JSON.stringify(message));
            console.log('⏸️  Interrupted AI response');
        } catch (error) {
            console.error('❌ Error interrupting:', error);
            throw error;
        }
    }

    /**
     * End a Gemini Live session
     */
    async endSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return; // Already ended
        }

        try {
            console.log(`🛑 Ending Gemini Live session: ${sessionId}`);
            session.ws.close();
            this.activeSessions.delete(sessionId);
        } catch (error) {
            console.error('❌ Error ending session:', error);
        }
    }

    /**
     * OPTIMIZED: Natural, concise system instruction
     * Removed excessive repetitive warnings that confuse the AI
     */
    _buildSystemInstruction(ragContext = '', language = 'en') {
        const languageRules = {
            en: {
                name: 'English',
                directive: 'Respond only in English.'
            },
            ta: {
                name: 'Tamil',
                directive: 'Respond only in Tamil (தமிழ்). If the user speaks another language, ask them in Tamil to continue in Tamil.'
            },
            si: {
                name: 'Sinhala',
                directive: 'Respond only in Sinhala (සිංහල). If the user speaks another language, ask them in Sinhala to continue in Sinhala.'
            }
        };

        const chosen = languageRules[language] || languageRules.en;

       let instruction = `You are PediTrack AI, a helpful pediatric health assistant for Sri Lankan families.

You communicate in ${chosen.name} through natural voice conversation. Listen carefully and respond warmly.
${chosen.directive}

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

        if (ragContext) {
            instruction += `\n\nRELEVANT MEDICAL KNOWLEDGE:\n${ragContext}\n\nUse this information to provide accurate, evidence-based answers when relevant.`;
        }

        return instruction;
    }

    /**
     * Get active session count
     */
    getActiveSessionCount() {
        return this.activeSessions.size;
    }

    /**
     * Clean up old sessions (called periodically)
     */
    cleanupOldSessions(maxAgeMs = 30 * 60 * 1000) { // 30 minutes default
        const now = Date.now();
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (now - session.createdAt > maxAgeMs) {
                console.log(`🧹 Cleaning up old session: ${sessionId}`);
                this.endSession(sessionId);
            }
        }
    }
}

// Singleton instance
let geminiLiveServiceInstance = null;

function getGeminiLiveService() {
    if (!geminiLiveServiceInstance) {
        geminiLiveServiceInstance = new GeminiLiveService();
        
        // Cleanup old sessions every 5 minutes
        setInterval(() => {
            geminiLiveServiceInstance.cleanupOldSessions();
        }, 5 * 60 * 1000);
    }
    return geminiLiveServiceInstance;
}

module.exports = { GeminiLiveService, getGeminiLiveService };
