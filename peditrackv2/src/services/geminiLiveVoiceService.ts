// Gemini Live Voice Service - Real-time WebSocket Audio Streaming
// Using Railway hosted backend

import { API_CONFIG } from '../config/config';

const WS_BASE_URL = API_CONFIG.CHAT_SERVICE_WS_URL;

/**
 * Gemini Live Voice Service
 * Handles real-time bidirectional audio streaming with Gemini Live API
 */

export interface GeminiLiveMessage {
    type: 'session_created' | 'setup_complete' | 'audio' | 'text' | 'turn_complete' | 'error';
    sessionId?: string;
    conversationId?: string;
    data?: string; // base64 audio
    text?: string;
    error?: string;
}

class GeminiLiveVoiceService {
    private ws: WebSocket | null = null;
    private sessionId: string | null = null;
    private conversationId: string | null = null;
    private onAudioCallback: ((audioData: string) => void) | null = null;
    private onTextCallback: ((text: string) => void) | null = null;
    private onErrorCallback: ((error: string) => void) | null = null;
    private onSetupCompleteCallback: (() => void) | null = null;

    /**
     * Connect to Gemini Live WebSocket
     */
    async connect(conversationId?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const url = conversationId
                    ? `${WS_BASE_URL}/live?conversationId=${conversationId}`
                    : `${WS_BASE_URL}/live`;

                console.log('🎙️  Connecting to Gemini Live:', url);

                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    console.log('✅ Connected to Gemini Live');
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: GeminiLiveMessage = JSON.parse(event.data);
                        this.handleMessage(message);

                        // Resolve on session created
                        if (message.type === 'session_created') {
                            this.sessionId = message.sessionId || null;
                            this.conversationId = message.conversationId || null;
                            resolve();
                        }
                    } catch (error) {
                        console.error('❌ Error parsing message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    if (this.onErrorCallback) {
                        this.onErrorCallback('WebSocket connection error');
                    }
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('🛑 Disconnected from Gemini Live');
                    this.ws = null;
                    this.sessionId = null;
                };

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (!this.sessionId) {
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);

            } catch (error) {
                console.error('❌ Connection error:', error);
                reject(error);
            }
        });
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(message: GeminiLiveMessage): void {
        switch (message.type) {
            case 'session_created':
                console.log('✅ Session created:', message.sessionId);
                break;

            case 'setup_complete':
                console.log('✅ Gemini Live setup complete');
                if (this.onSetupCompleteCallback) {
                    this.onSetupCompleteCallback();
                }
                break;

            case 'audio':
                if (message.data && this.onAudioCallback) {
                    this.onAudioCallback(message.data);
                }
                break;

            case 'text':
                if (message.text && this.onTextCallback) {
                    this.onTextCallback(message.text);
                }
                break;

            case 'turn_complete':
                console.log('✅ AI turn complete');
                break;

            case 'error':
                console.error('❌ Gemini Live error:', message.error);
                if (this.onErrorCallback) {
                    this.onErrorCallback(message.error || 'Unknown error');
                }
                break;
        }
    }

    /**
     * Send audio chunk to Gemini Live
     */
    sendAudio(audioData: string): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('❌ WebSocket not connected');
            return;
        }

        const message = {
            type: 'audio',
            data: audioData
        };

        this.ws.send(JSON.stringify(message));
    }

    /**
     * Send text message to Gemini Live
     */
    sendText(text: string): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('❌ WebSocket not connected');
            return;
        }

        const message = {
            type: 'text',
            text: text
        };

        this.ws.send(JSON.stringify(message));
    }

    /**
     * Interrupt the current AI response
     */
    interrupt(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const message = {
            type: 'interrupt'
        };

        this.ws.send(JSON.stringify(message));
        console.log('⏸️  Interrupted AI response');
    }

    /**
     * Disconnect from Gemini Live
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.sessionId = null;
            this.conversationId = null;
        }
    }

    /**
     * Set callback for incoming audio
     */
    onAudio(callback: (audioData: string) => void): void {
        this.onAudioCallback = callback;
    }

    /**
     * Set callback for incoming text
     */
    onText(callback: (text: string) => void): void {
        this.onTextCallback = callback;
    }

    /**
     * Set callback for errors
     */
    onError(callback: (error: string) => void): void {
        this.onErrorCallback = callback;
    }

    /**
     * Set callback for setup complete
     */
    onSetupComplete(callback: () => void): void {
        this.onSetupCompleteCallback = callback;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Get current conversation ID
     */
    getConversationId(): string | null {
        return this.conversationId;
    }
}

// Export singleton instance
export const geminiLiveService = new GeminiLiveVoiceService();
