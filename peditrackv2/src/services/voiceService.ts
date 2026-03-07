// Using Railway hosted backend
// @deprecated This service is deprecated. Use geminiLiveVoiceService.ts instead.

import { API_CONFIG } from '../config/config';

/**
 * @deprecated This service is deprecated. Use geminiLiveVoiceService.ts for real-time voice conversations.
 * 
 * DEPRECATION NOTICE: This file uses the old HTTP-based voice pipeline (OpenAI Whisper/TTS).
 * Please migrate to geminiLiveVoiceService.ts for:
 * - Real-time bidirectional audio streaming
 * - Lower latency (<1s vs 3-5s)
 * - Natural interruptions
 * - Better voice quality
 */

const API_BASE_URL = API_CONFIG.CHAT_SERVICE_URL;


import * as FileSystem from 'expo-file-system/legacy';

/**
 * Voice Service for PediTrack v2
 * Handles voice-based communication with the chat microservice
 */

export interface VoiceMessageResponse {
    success: boolean;
    data: {
        conversationId: string;
        messageId: string;
        transcription: string;
        responseText: string;
        audioResponse: string; // base64 encoded audio
    };
}

export interface TranscriptionResponse {
    success: boolean;
    data: {
        transcription: string;
    };
}

export interface TextToSpeechResponse {
    success: boolean;
    data: {
        audio: string; // base64 encoded audio
    };
}

/**
 * Send a voice message to the AI chat service
 * @param audioUri - URI of the recorded audio file
 * @param conversationId - Optional conversation ID
 * @param voice - TTS voice (alloy, echo, fable, onyx, nova, shimmer)
 */
export const sendVoiceMessage = async (
    audioUri: string,
    conversationId?: string,
    voice: string = 'nova'
): Promise<VoiceMessageResponse> => {
    try {
        const formData = new FormData();

        // Add audio file
        const audioFile = {
            uri: audioUri,
            type: 'audio/m4a',
            name: 'voice_message.m4a',
        } as any;

        formData.append('audio', audioFile);

        if (conversationId) {
            formData.append('conversationId', conversationId);
        }

        formData.append('voice', voice);

        const response = await fetch(`${API_BASE_URL}/voice/message`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending voice message:', error);
        throw error;
    }
};

/**
 * Transcribe audio to text only
 * @param audioUri - URI of the recorded audio file
 */
export const transcribeAudio = async (
    audioUri: string
): Promise<TranscriptionResponse> => {
    try {
        const formData = new FormData();

        const audioFile = {
            uri: audioUri,
            type: 'audio/m4a',
            name: 'audio.m4a',
        } as any;

        formData.append('audio', audioFile);

        const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        throw error;
    }
};

/**
 * Convert text to speech
 * @param text - Text to convert
 * @param voice - TTS voice (alloy, echo, fable, onyx, nova, shimmer)
 */
export const textToSpeech = async (
    text: string,
    voice: string = 'nova'
): Promise<TextToSpeechResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/voice/speak`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                voice,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error converting text to speech:', error);
        throw error;
    }
};

/**
 * Save base64 audio to file and return URI
 * @param base64Audio - Base64 encoded audio
 * @param filename - Filename to save as
 */
export const saveBase64Audio = async (
    base64Audio: string,
    filename: string = 'response.mp3'
): Promise<string> => {
    try {
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
            encoding: FileSystem.EncodingType.Base64,
        });

        return fileUri;
    } catch (error) {
        console.error('Error saving audio file:', error);
        throw error;
    }
};
