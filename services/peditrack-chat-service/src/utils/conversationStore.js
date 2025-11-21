/**
 * In-memory conversation store
 * For production, consider using Redis or a database
 */
class ConversationStore {
    constructor() {
        this.conversations = new Map();
        this.maxConversations = 1000; // Limit to prevent memory issues
    }

    /**
     * Get conversation history
     */
    getHistory(conversationId) {
        return this.conversations.get(conversationId) || [];
    }

    /**
     * Add message to conversation
     */
    addMessage(conversationId, message) {
        if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, []);
        }

        const history = this.conversations.get(conversationId);
        history.push(message);

        // Cleanup old conversations if limit exceeded
        if (this.conversations.size > this.maxConversations) {
            const firstKey = this.conversations.keys().next().value;
            this.conversations.delete(firstKey);
        }

        return history;
    }

    /**
     * Clear conversation history
     */
    clearHistory(conversationId) {
        this.conversations.delete(conversationId);
    }

    /**
     * Get all conversation IDs
     */
    getAllConversationIds() {
        return Array.from(this.conversations.keys());
    }

    /**
     * Get conversation count
     */
    getConversationCount() {
        return this.conversations.size;
    }

    /**
     * Clear all conversations
     */
    clearAll() {
        this.conversations.clear();
    }
}

module.exports = new ConversationStore();
