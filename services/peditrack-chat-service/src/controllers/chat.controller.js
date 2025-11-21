const llmService = require('../services/llm.service');
const conversationStore = require('../utils/conversationStore');
const { v4: uuidv4 } = require('uuid');

class ChatController {
    /**
     * Send a message and get AI response
     */
    async sendMessage(req, res, next) {
        try {
            const { message, conversationId, userId, provider = 'openai' } = req.body;

            // Validation
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Message is required and must be a non-empty string'
                    }
                });
            }

            // Generate or use existing conversation ID
            const convId = conversationId || uuidv4();

            // Get conversation history
            const history = conversationStore.getHistory(convId);

            // Add user message to history
            const userMessage = {
                id: uuidv4(),
                role: 'user',
                content: message.trim(),
                timestamp: new Date().toISOString()
            };
            conversationStore.addMessage(convId, userMessage);

            // Get AI response
            const aiResponse = await llmService.generateResponse(
                message.trim(),
                history,
                provider
            );

            // Add AI response to history
            const assistantMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date().toISOString()
            };
            conversationStore.addMessage(convId, assistantMessage);

            // Return response
            res.status(200).json({
                success: true,
                data: {
                    conversationId: convId,
                    message: assistantMessage,
                    provider: provider
                }
            });

        } catch (error) {
            console.error('Error in sendMessage:', error);
            next(error);
        }
    }

    /**
     * Stream message response (for real-time streaming)
     */
    async streamMessage(req, res, next) {
        try {
            const { message, conversationId, userId, provider = 'openai' } = req.body;

            // Validation
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Message is required and must be a non-empty string'
                    }
                });
            }

            // Generate or use existing conversation ID
            const convId = conversationId || uuidv4();

            // Get conversation history
            const history = conversationStore.getHistory(convId);

            // Add user message to history
            const userMessage = {
                id: uuidv4(),
                role: 'user',
                content: message.trim(),
                timestamp: new Date().toISOString()
            };
            conversationStore.addMessage(convId, userMessage);

            // Set up SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Stream the response
            let fullResponse = '';
            await llmService.streamResponse(
                message.trim(),
                history,
                provider,
                (chunk) => {
                    fullResponse += chunk;
                    res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
                }
            );

            // Add complete response to history
            const assistantMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date().toISOString()
            };
            conversationStore.addMessage(convId, assistantMessage);

            // Send completion event
            res.write(`data: ${JSON.stringify({ 
                chunk: '', 
                done: true, 
                conversationId: convId,
                messageId: assistantMessage.id 
            })}\n\n`);
            res.end();

        } catch (error) {
            console.error('Error in streamMessage:', error);
            res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
            res.end();
        }
    }

    /**
     * Get conversation history
     */
    async getHistory(req, res, next) {
        try {
            const { conversationId } = req.params;

            if (!conversationId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Conversation ID is required'
                    }
                });
            }

            const history = conversationStore.getHistory(conversationId);

            res.status(200).json({
                success: true,
                data: {
                    conversationId,
                    messages: history,
                    count: history.length
                }
            });

        } catch (error) {
            console.error('Error in getHistory:', error);
            next(error);
        }
    }

    /**
     * Clear conversation history
     */
    async clearHistory(req, res, next) {
        try {
            const { conversationId } = req.params;

            if (!conversationId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Conversation ID is required'
                    }
                });
            }

            conversationStore.clearHistory(conversationId);

            res.status(200).json({
                success: true,
                message: 'Conversation history cleared successfully',
                data: {
                    conversationId
                }
            });

        } catch (error) {
            console.error('Error in clearHistory:', error);
            next(error);
        }
    }
}

module.exports = new ChatController();
