const voiceService = require('../services/voiceService');
const llmService = require('../services/llm.service');
const conversationStore = require('../utils/conversationStore');
const { v4: uuidv4 } = require('uuid');

/**
 * Voice Controller
 * Handles voice-based chat interactions
 */
class VoiceController {
    /**
     * Process voice message
     * Transcribes audio, gets AI response, and returns both text and audio
     */
    async processVoiceMessage(req, res) {
        try {
            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'No audio file provided' }
                });
            }

            const { conversationId, voice = 'nova', provider = 'openai' } = req.body;
            const audioBuffer = req.file.buffer;
            const filename = req.file.originalname;

            console.log(`Processing voice message: ${filename}, conversation: ${conversationId || 'new'}`);

            // Generate or use existing conversation ID
            const convId = conversationId || uuidv4();

            // Step 1: Transcribe audio to text
            const transcribedText = await voiceService.speechToText(audioBuffer, filename);
            console.log('Transcribed text:', transcribedText);

            // Get conversation history
            const history = conversationStore.getHistory(convId);

            // Add user message to history
            const userMessage = {
                id: uuidv4(),
                role: 'user',
                content: transcribedText,
                timestamp: new Date().toISOString()
            };
            conversationStore.addMessage(convId, userMessage);

            // Step 2: Get AI response using LLM service
            const aiResponseText = await llmService.generateResponse(
                transcribedText,
                history,
                provider
            );
            console.log('AI response:', aiResponseText);

            // Add AI response to history
            const assistantMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: aiResponseText,
                timestamp: new Date().toISOString()
            };
            conversationStore.addMessage(convId, assistantMessage);

            // Step 3: Convert AI response to speech
            const audioResponse = await voiceService.textToSpeech(aiResponseText, voice);

            // Return response with audio as base64
            res.json({
                success: true,
                data: {
                    conversationId: convId,
                    messageId: assistantMessage.id,
                    transcription: transcribedText,
                    responseText: aiResponseText,
                    audioResponse: audioResponse.toString('base64')
                }
            });
        } catch (error) {
            console.error('Voice processing error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: error.message || 'Failed to process voice message'
                }
            });
        }
    }

    /**
     * Transcribe audio only (no AI response)
     */
    async transcribeAudio(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'No audio file provided' }
                });
            }

            const audioBuffer = req.file.buffer;
            const filename = req.file.originalname;

            const transcription = await voiceService.speechToText(audioBuffer, filename);

            res.json({
                success: true,
                data: {
                    transcription
                }
            });
        } catch (error) {
            console.error('Transcription error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: error.message || 'Failed to transcribe audio'
                }
            });
        }
    }

    /**
     * Convert text to speech
     */
    async textToSpeech(req, res) {
        try {
            const { text, voice = 'nova' } = req.body;

            if (!text) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'No text provided' }
                });
            }

            const audioBuffer = await voiceService.textToSpeech(text, voice);

            res.json({
                success: true,
                data: {
                    audio: audioBuffer.toString('base64')
                }
            });
        } catch (error) {
            console.error('TTS error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: error.message || 'Failed to generate speech'
                }
            });
        }
    }
}

module.exports = new VoiceController();
