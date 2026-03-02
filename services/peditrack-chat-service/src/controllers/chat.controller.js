const { getLLMService } = require('../services/llm.service');
const conversationStore = require('../utils/conversationStore');
const { v4: uuidv4 } = require('uuid');

/**
 * Send a message and get AI response
 */
async function sendMessage(req, res) {
    try {
        const { message, conversationId, userId, useRAG, language } = req.body;

        // Validation
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Generate conversation ID if not provided
        const convId = conversationId || uuidv4();
        const user = userId || 'anonymous';

        console.log(`💬 New message in conversation ${convId}: "${message.substring(0, 50)}..."`);

        // Get conversation history
        const history = conversationStore.getConversation(convId) || [];

        // Add user message to history
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };
        history.push(userMessage);

        // Prepare messages for LLM (without timestamps)
        const messages = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Get LLM service and generate response
        const llmService = getLLMService();
        const maxTokens = (language && language !== 'en') ? 2000 : 800;
        const result = await llmService.generateResponse(messages, {
            useRAG: useRAG !== undefined ? useRAG : true, // Default to using RAG
            temperature: 0.7,
            maxTokens: maxTokens,
            language: language || 'en'
        });

        // Add assistant response to history
        const assistantMessage = {
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toISOString(),
            model: result.model,
            ragUsed: result.ragUsed
        };
        history.push(assistantMessage);

        // Save conversation
        conversationStore.saveConversation(convId, history);

        // Return response
        res.json({
            success: true,
            conversationId: convId,
            message: result.response,
            metadata: {
                model: result.model,
                ragUsed: result.ragUsed,
                usage: result.usage,
                timestamp: assistantMessage.timestamp
            }
        });

    } catch (error) {
        console.error('❌ Send message error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process message'
        });
    }
}

/**
 * Send a message with image attachment
 */
async function sendMessageWithImage(req, res) {
    try {
        const { message, conversationId, userId } = req.body;
        const imageFile = req.file;

        console.log('📥 Received image upload request');
        console.log('   Message:', message || '(none)');
        console.log('   Image file:', imageFile ? `${imageFile.originalname} (${imageFile.size} bytes, ${imageFile.mimetype})` : 'MISSING');

        // Validation - at least image is required
        if (!imageFile) {
            console.error('❌ No image file in request');
            return res.status(400).json({
                success: false,
                error: 'Image file is required'
            });
        }

        const convId = conversationId || uuidv4();
        const user = userId || 'anonymous';

        console.log(`🖼️  Processing image in conversation ${convId}`);

        // Get conversation history
        const history = conversationStore.getConversation(convId) || [];

        // Add user message to history
        const userMessage = {
            role: 'user',
            content: message || 'Please analyze this image and provide relevant information.',
            hasImage: true,
            timestamp: new Date().toISOString()
        };
        history.push(userMessage);

        // Prepare messages for LLM
        const messages = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        console.log('🤖 Calling vision API...');
        
        // Get LLM service and generate response with image
        const llmService = getLLMService();
        const result = await llmService.generateResponseWithImage(
            messages,
            imageFile.buffer,
            imageFile.mimetype,
            {
                temperature: 0.7,
                maxTokens: 1000
            }
        );

        // Add assistant response to history
        const assistantMessage = {
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toISOString(),
            model: result.model
        };
        history.push(assistantMessage);

        // Save conversation
        conversationStore.saveConversation(convId, history);

        // Return response
        res.json({
            success: true,
            conversationId: convId,
            message: result.response,
            metadata: {
                model: result.model,
                hasImage: true,
                usage: result.usage,
                timestamp: assistantMessage.timestamp
            }
        });

    } catch (error) {
        console.error('❌ Send message with image error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process message with image'
        });
    }
}

/**
 * Stream chat response in real-time
 */
async function streamMessage(req, res) {
    try {
        const { message, conversationId, userId, useRAG, language } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        const convId = conversationId || uuidv4();
        console.log(`📡 Streaming message in conversation ${convId}`);

        // Set headers for SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Get conversation history
        const history = conversationStore.getConversation(convId) || [];

        // Add user message
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };
        history.push(userMessage);

        // Prepare messages for LLM
        const messages = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Stream response
        const llmService = getLLMService();
        let fullResponse = '';

        const streamMaxTokens = (language && language !== 'en') ? 2000 : 800;
        for await (const chunk of llmService.generateStreamingResponse(messages, {
            useRAG: useRAG !== undefined ? useRAG : true,
            temperature: 0.7,
            maxTokens: streamMaxTokens,
            language: language || 'en'
        })) {
            fullResponse += chunk;
            
            // Send chunk to client
            res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        }

        // Add complete response to history
        const assistantMessage = {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString()
        };
        history.push(assistantMessage);

        // Save conversation
        conversationStore.saveConversation(convId, history);

        // Send completion signal
        res.write(`data: ${JSON.stringify({ 
            chunk: '', 
            done: true, 
            conversationId: convId,
            fullResponse 
        })}\n\n`);
        
        res.end();

    } catch (error) {
        console.error('❌ Stream message error:', error);
        res.write(`data: ${JSON.stringify({ 
            error: error.message,
            done: true 
        })}\n\n`);
        res.end();
    }
}

/**
 * Get conversation history
 */
async function getHistory(req, res) {
    try {
        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({
                success: false,
                error: 'Conversation ID is required'
            });
        }

        const history = conversationStore.getConversation(conversationId);

        if (!history) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        res.json({
            success: true,
            conversationId,
            messages: history,
            count: history.length
        });

    } catch (error) {
        console.error('❌ Get history error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get conversation history'
        });
    }
}

/**
 * Clear conversation history
 */
async function clearHistory(req, res) {
    try {
        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({
                success: false,
                error: 'Conversation ID is required'
            });
        }

        conversationStore.clearConversation(conversationId);

        res.json({
            success: true,
            message: 'Conversation history cleared',
            conversationId
        });

    } catch (error) {
        console.error('❌ Clear history error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear conversation history'
        });
    }
}

module.exports = {
    sendMessage,
    sendMessageWithImage,
    streamMessage,
    getHistory,
    clearHistory
};
