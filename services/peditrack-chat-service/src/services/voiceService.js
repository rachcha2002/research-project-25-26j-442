const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Voice Service for handling speech-to-text and text-to-speech
 */
class VoiceService {
    /**
     * Convert audio to text using OpenAI Whisper
     * @param {Buffer} audioBuffer - Audio file buffer
     * @param {string} filename - Original filename
     * @returns {Promise<string>} - Transcribed text
     */
    async speechToText(audioBuffer, filename) {
        try {
            // Create a temporary file from the buffer
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempFilePath = path.join(tempDir, filename);
            fs.writeFileSync(tempFilePath, audioBuffer);

            // Create a readable stream for OpenAI
            const audioFile = fs.createReadStream(tempFilePath);

            // Transcribe using Whisper
            const transcription = await openai.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-1',
                language: 'en', // Can be made dynamic
                response_format: 'json'
            });

            // Clean up temp file
            fs.unlinkSync(tempFilePath);

            return transcription.text;
        } catch (error) {
            console.error('Speech-to-text error:', error);
            throw new Error(`Failed to transcribe audio: ${error.message}`);
        }
    }

    /**
     * Convert text to speech using OpenAI TTS
     * @param {string} text - Text to convert
     * @param {string} voice - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
     * @returns {Promise<Buffer>} - Audio buffer
     */
    async textToSpeech(text, voice = 'nova') {
        try {
            const mp3 = await openai.audio.speech.create({
                model: 'tts-1',
                voice: voice,
                input: text,
                response_format: 'mp3',
                speed: 1.0
            });

            // Convert the response to a buffer
            const buffer = Buffer.from(await mp3.arrayBuffer());
            return buffer;
        } catch (error) {
            console.error('Text-to-speech error:', error);
            throw new Error(`Failed to generate speech: ${error.message}`);
        }
    }
}

module.exports = new VoiceService();
