// For Android Emulator: use 10.0.2.2
// For Physical Device: use your computer's IP address (check with ipconfig)
// Current Wi-Fi IP: 192.168.1.3
const API_BASE_URL = 'http://192.168.1.3:3001/api';

/**
 * Chat Service for PediTrack v2
 * Handles communication with the chat microservice
 */

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface SendMessageResponse {
    success: boolean;
    conversationId: string;
    message: string;
    metadata: {
        model: string;
        ragUsed: boolean;
        usage?: any;
        timestamp: string;
    };
}

export interface ConversationHistory {
    success: boolean;
    conversationId: string;
    messages: ChatMessage[];
    count: number;
}

/**
 * Send a message to the AI chat service
 */
export const sendChatMessage = async (
    message: string,
    conversationId?: string,
    provider: string = 'openai'
): Promise<SendMessageResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                conversationId,
                provider,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

/**
 * Get conversation history
 */
export const getConversationHistory = async (
    conversationId: string
): Promise<ConversationHistory> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/chat/history/${conversationId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting conversation history:', error);
        throw error;
    }
};

/**
 * Clear conversation history
 */
export const clearConversationHistory = async (
    conversationId: string
): Promise<void> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/chat/history/${conversationId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error clearing conversation history:', error);
        throw error;
    }
};

/**
 * Send a message with an image attachment
 */
export const sendChatMessageWithImage = async (
    message: string,
    imageUri: string,
    conversationId?: string,
    provider: string = 'openai'
): Promise<SendMessageResponse> => {
    try {
        const formData = new FormData();

        // Add image file
        const imageFile = {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'image.jpg',
        } as any;

        formData.append('image', imageFile);
        formData.append('message', message);

        if (conversationId) {
            formData.append('conversationId', conversationId);
        }

        formData.append('provider', provider);

        const response = await fetch(`${API_BASE_URL}/chat/message-with-image`, {
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
        console.error('Error sending chat message with image:', error);
        throw error;
    }
};

/**
 * Check service health
 */
export const checkServiceHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Service health check failed:', error);
        return false;
    }
};

/**
 * Stream chat message (for real-time responses)
 * Note: This requires EventSource or similar SSE implementation
 */
export const streamChatMessage = async (
    message: string,
    conversationId: string | undefined,
    onChunk: (chunk: string) => void,
    onComplete: (conversationId: string, messageId: string) => void,
    onError: (error: Error) => void
): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                conversationId,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('Response body is not readable');
        }

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.slice(6));

                    if (data.error) {
                        onError(new Error(data.error));
                        return;
                    }

                    if (data.done) {
                        onComplete(data.conversationId, data.messageId);
                        return;
                    }

                    if (data.chunk) {
                        onChunk(data.chunk);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error streaming chat message:', error);
        onError(error as Error);
    }
};