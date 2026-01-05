import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@peditrack_chat_history';

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: string;
    imageUri?: string;
    isVoice?: boolean;
}

export interface Conversation {
    id: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    preview: string;
}

export const chatStorageService = {
    /**
     * Save a conversation to storage
     */
    async saveConversation(conversation: Conversation): Promise<void> {
        try {
            console.log('💾 [Storage] Saving conversation:', conversation.id);
            console.log('   Messages:', conversation.messages.length);
            console.log('   Preview:', conversation.preview);

            const history = await this.getAllConversations();
            console.log('   Current history count:', history.length);

            // Check if conversation already exists
            const existingIndex = history.findIndex(c => c.id === conversation.id);

            if (existingIndex >= 0) {
                // Update existing conversation
                console.log('   Updating existing conversation at index:', existingIndex);
                history[existingIndex] = {
                    ...conversation,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Add new conversation to the beginning
                console.log('   Adding new conversation');
                history.unshift({
                    ...conversation,
                    createdAt: conversation.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            const jsonData = JSON.stringify(history);
            console.log('   Saving to AsyncStorage, size:', jsonData.length, 'bytes');
            await AsyncStorage.setItem(STORAGE_KEY, jsonData);
            console.log('✅ [Storage] Conversation saved successfully!');
        } catch (error) {
            console.error('❌ [Storage] Error saving conversation:', error);
            throw error;
        }
    },

    /**
     * Get all conversations from storage
     */
    async getAllConversations(): Promise<Conversation[]> {
        try {
            console.log('📖 [Storage] Loading conversations from AsyncStorage...');
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (!data) {
                console.log('   No data found in storage');
                return [];
            }
            console.log('   Data size:', data.length, 'bytes');
            const parsed = JSON.parse(data);
            console.log('   Parsed', parsed.length, 'conversations');
            return parsed;
        } catch (error) {
            console.error('❌ [Storage] Error loading conversations:', error);
            return [];
        }
    },

    /**
     * Get a specific conversation by ID
     */
    async getConversation(id: string): Promise<Conversation | null> {
        try {
            const history = await this.getAllConversations();
            return history.find(c => c.id === id) || null;
        } catch (error) {
            console.error('❌ Error loading conversation:', error);
            return null;
        }
    },

    /**
     * Delete a conversation
     */
    async deleteConversation(id: string): Promise<void> {
        try {
            const history = await this.getAllConversations();
            const filtered = history.filter(c => c.id !== id);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            console.log('✅ Conversation deleted:', id);
        } catch (error) {
            console.error('❌ Error deleting conversation:', error);
            throw error;
        }
    },

    /**
     * Clear all conversation history
     */
    async clearAllConversations(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            console.log('✅ All conversations cleared');
        } catch (error) {
            console.error('❌ Error clearing conversations:', error);
            throw error;
        }
    },

    /**
     * Generate a preview from messages
     */
    generatePreview(messages: ChatMessage[]): string {
        if (messages.length === 0) {
            return 'New conversation';
        }

        // Get first user message
        const firstUserMessage = messages.find(m => m.sender === 'user');
        if (firstUserMessage) {
            const text = firstUserMessage.text.replace(/\[Image.*?\]/g, '').trim();
            return text.substring(0, 60) + (text.length > 60 ? '...' : '');
        }

        return 'New conversation';
    }
};
