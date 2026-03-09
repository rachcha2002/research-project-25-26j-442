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

            // Build a seed query from recent history to bootstrap RAG context.
            // Only use if there is meaningful prior history (returning user).
            let ragContext = '';
            const recentUserMessages = history
                .filter(m => m.role === 'user')
                .slice(-2)
                .map(m => m.content.trim())
                .filter(t => t.length > 10);

            if (recentUserMessages.length > 0) {
                const seedQuery = recentUserMessages.join(' ');
                try {
                    const ragResult = await this.ragService.retrieveForVoice(seedQuery);
                    if (ragResult.success && ragResult.count > 0) {
                        ragContext = ragResult.context;
                        console.log(`✅ Session seeded with RAG context (${ragResult.count} docs)`);
                    }
                } catch (error) {
                    console.warn('⚠️  RAG unavailable for session seed:', error.message);
                }
            }

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
            // If a fresh RAG context was prepared from the previous transcript, inject it
            // ONCE before the new audio bytes start arriving so Gemini picks it up
            if (session.ragContext) {
                await this.injectRAGContextForNextTurn(sessionId);
            }

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
                        const userText = content.input_transcription.text;
                        console.log('🗣️  User said:', userText);

                        // Fire async RAG refresh — context will be ready for the NEXT turn
                        this.refreshRAGContext(sessionId, userText);

                        callback({
                            type: 'user_transcript',
                            text: userText
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
     * Fire-and-forget RAG refresh triggered by a user transcript.
     *
     * Gemini Live cannot retroactively inject context into the CURRENT turn —
     * the model has already started generating audio. Instead, we fetch new
     * RAG context and store it on the session so it is included in the
     * system_instruction of the NEXT turn (via updateSessionContext).
     *
     * Call this as soon as you receive a 'user_transcript' event.
     *
     * @param {string} sessionId
     * @param {string} transcript  — ASR text of what the user just said
     */
    async refreshRAGContext(sessionId, transcript) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !transcript || transcript.trim().length < 10) return;

        // Run async — do NOT await on the hot path
        this.ragService.retrieveForVoice(transcript).then(ragResult => {
            if (ragResult.success && ragResult.count > 0) {
                session.ragContext = ragResult.context;
                console.log(`🔄 RAG context refreshed for session ${sessionId} (${ragResult.count} docs)`);
            }
        }).catch(() => { /* ignore — voice must never block */ });
    }

    /**
     * Inject the current session's latest RAG context as a hidden system
     * message at the start of the next conversational turn.
     *
     * Call this BEFORE sending the user's next audio/text turn.
     * If no new RAG context is available the call is a no-op.
     *
     * @param {string} sessionId
     */
    async injectRAGContextForNextTurn(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.ragContext) return;

        try {
            const contextMessage = {
                client_content: {
                    turns: [{
                        role: 'user',
                        parts: [{ text: `[Medical context for your next answer — do not read aloud]:\n${session.ragContext}` }]
                    }],
                    turn_complete: false   // Don't trigger a response — just add context
                }
            };
            session.ws.send(JSON.stringify(contextMessage));
            session.ragContext = '';   // Consume it — don't re-inject on every turn
            console.log(`💉 RAG context injected for next turn in session ${sessionId}`);
        } catch (error) {
            console.warn('⚠️  Failed to inject RAG context:', error.message);
        }
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

       let instruction = `You are PediTrack AI, a caring child health assistant. You talk like a warm, supportive friend.

You communicate in ${chosen.name} through voice conversation.
${chosen.directive}

STRICT RULES:
1) Only answer questions about child health, development, parenting, and family wellness. Politely decline anything else.
2) NEVER say "Sri Lanka" or "Sri Lankan". You are a local app, the user knows where they live.
3) Keep replies to 2-3 short sentences. Be conversational and natural. No lists.
4) If it sounds serious, just recommend they see a doctor soon.

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
