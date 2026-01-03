const { ChatOpenAI } = require('@langchain/openai');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatAnthropic } = require('@langchain/anthropic');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');
const { getRagService } = require('./rag.service');

/**
 * Multi-Provider LLM Service using LangChain
 * Supports: OpenAI, Google Gemini, Anthropic Claude
 */
class MultiProviderLLMService {
    constructor() {
        this.ragService = getRagService();
        this.useRAG = process.env.USE_RAG === 'true';
        this.provider = process.env.LLM_PROVIDER || 'openai'; // openai, google, anthropic
        this.model = null;
        this.initializeModel();
    }

    /**
     * Initialize the LLM model based on provider
     */
    initializeModel() {
        console.log(`🤖 Initializing LLM Provider: ${this.provider}`);

        switch (this.provider.toLowerCase()) {
            case 'openai':
                this.model = new ChatOpenAI({
                    modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                    temperature: parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
                    maxTokens: parseInt(process.env.MAX_TOKENS) || 1000,
                    openAIApiKey: process.env.OPENAI_API_KEY,
                });
                console.log(`✅ OpenAI initialized: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}`);
                break;

            case 'google':
            case 'gemini':
                this.model = new ChatGoogleGenerativeAI({
                    modelName: process.env.GOOGLE_MODEL || 'gemini-pro',
                    temperature: parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
                    maxOutputTokens: parseInt(process.env.MAX_TOKENS) || 1000,
                    apiKey: process.env.GOOGLE_API_KEY,
                });
                console.log(`✅ Google Gemini initialized: ${process.env.GOOGLE_MODEL || 'gemini-pro'}`);
                break;

            case 'anthropic':
            case 'claude':
                this.model = new ChatAnthropic({
                    modelName: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
                    temperature: parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
                    maxTokens: parseInt(process.env.MAX_TOKENS) || 1000,
                    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
                });
                console.log(`✅ Anthropic Claude initialized: ${process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'}`);
                break;

            default:
                console.warn(`⚠️  Unknown provider: ${this.provider}, defaulting to OpenAI`);
                this.provider = 'openai';
                this.model = new ChatOpenAI({
                    modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                    temperature: 0.7,
                    maxTokens: 1000,
                    openAIApiKey: process.env.OPENAI_API_KEY,
                });
                break;
        }
    }

    /**
     * Convert conversation messages to LangChain format
     */
    convertToLangChainMessages(messages, systemPrompt) {
        const langchainMessages = [new SystemMessage(systemPrompt)];

        for (const msg of messages) {
            if (msg.role === 'user') {
                langchainMessages.push(new HumanMessage(msg.content));
            } else if (msg.role === 'assistant') {
                langchainMessages.push(new AIMessage(msg.content));
            }
        }

        return langchainMessages;
    }

    /**
     * Generate a chat completion with RAG context
     */
    async generateResponse(messages, options = {}) {
        try {
            const {
                useRAG = this.useRAG,
                ragTopK = 5,
                ragThreshold = 0.0,
                temperature,
                maxTokens
            } = options;

            // Get the latest user message
            const userMessage = messages[messages.length - 1];
            if (!userMessage || userMessage.role !== 'user') {
                throw new Error('Last message must be from user');
            }

            let systemPrompt = this._getSystemPrompt();

            // Retrieve relevant context from RAG if enabled
            let ragUsed = false;
            if (useRAG) {
                try {
                    console.log('🔍 Using RAG for context enhancement...');
                    const ragResult = await this.ragService.retrieveDocuments(
                        userMessage.content,
                        ragTopK,
                        ragThreshold
                    );

                    if (ragResult.success && ragResult.context) {
                        systemPrompt = this._enhanceSystemPromptWithRAG(systemPrompt, ragResult.context);
                        console.log(`✅ Enhanced prompt with ${ragResult.count} documents`);
                        ragUsed = true;
                    } else {
                        console.log('⚠️  No RAG context available, using base prompt');
                    }
                } catch (error) {
                    console.warn('⚠️  RAG service error, continuing without RAG:', error.message);
                    // Continue without RAG context
                }
            }

            // Convert to LangChain messages
            const langchainMessages = this.convertToLangChainMessages(messages, systemPrompt);

            // Override temperature/maxTokens if provided
            if (temperature !== undefined) {
                this.model.temperature = temperature;
            }
            if (maxTokens !== undefined) {
                this.model.maxTokens = maxTokens;
            }

            // Call LLM
            console.log(`🤖 Calling ${this.provider} (${this.model.modelName})...`);
            const response = await this.model.invoke(langchainMessages);

            console.log('✅ LLM response received');

            return {
                success: true,
                response: response.content,
                provider: this.provider,
                model: this.model.modelName,
                ragUsed: ragUsed
            };

        } catch (error) {
            console.error('❌ LLM Service Error:', error.message);
            throw error;
        }
    }

    /**
     * Generate a streaming chat completion with RAG context
     */
    async *generateStreamingResponse(messages, options = {}) {
        try {
            const {
                useRAG = this.useRAG,
                ragTopK = 5,
                ragThreshold = 0.0
            } = options;

            const userMessage = messages[messages.length - 1];
            if (!userMessage || userMessage.role !== 'user') {
                throw new Error('Last message must be from user');
            }

            let systemPrompt = this._getSystemPrompt();

            // Retrieve RAG context if enabled
            if (useRAG) {
                try {
                    console.log('🔍 Using RAG for streaming response...');
                    const ragResult = await this.ragService.retrieveDocuments(
                        userMessage.content,
                        ragTopK,
                        ragThreshold
                    );

                    if (ragResult.success && ragResult.context) {
                        systemPrompt = this._enhanceSystemPromptWithRAG(systemPrompt, ragResult.context);
                        console.log(`✅ Enhanced prompt with ${ragResult.count} documents`);
                    }
                } catch (error) {
                    console.warn('⚠️  RAG service error in streaming, continuing without RAG:', error.message);
                    // Continue without RAG context
                }
            }

            // Convert to LangChain messages
            const langchainMessages = this.convertToLangChainMessages(messages, systemPrompt);

            // Stream from LLM
            console.log(`📡 Streaming from ${this.provider}...`);
            const stream = await this.model.stream(langchainMessages);

            for await (const chunk of stream) {
                if (chunk.content) {
                    yield chunk.content;
                }
            }

        } catch (error) {
            console.error('❌ Streaming Error:', error.message);
            throw error;
        }
    }

    /**
     * Get base system prompt for PediTrack
     */
    _getSystemPrompt() {
        return process.env.SYSTEM_PROMPT || `You are PediTrack AI, a helpful and knowledgeable pediatric health assistant specifically designed for Sri Lankan families. 
You provide accurate, evidence-based information about child health, development, and parenting in the Sri Lankan context.

Guidelines:
- Always prioritize child safety and well-being
- Provide advice considering Sri Lankan culture, climate, and healthcare system
- Reference local resources (government hospitals, MOH clinics, Grama Niladhari offices when relevant)
- Use familiar Sri Lankan examples and context (local foods like kola kanda, rice-based diets, traditional practices)
- Be aware of tropical health concerns common in Sri Lanka
- Recommend consulting local healthcare professionals (pediatricians, MOH doctors, PHI officers)
- Be empathetic and supportive to Sri Lankan parents and their cultural practices
- Use simple, easy-to-understand language suitable for Sri Lankan English speakers
- Consider local economic factors and affordable healthcare options
- If discussing traditional practices, balance cultural respect with medical safety

Remember: You are an assistant familiar with Sri Lankan pediatric healthcare, not a replacement for professional medical advice. Always encourage consultation with local healthcare providers when needed.`;
    }

    /**
     * Enhance system prompt with RAG context
     */
    _enhanceSystemPromptWithRAG(basePrompt, ragContext) {
        return `${basePrompt}

RELEVANT KNOWLEDGE BASE CONTEXT:
${ragContext}

Use the above context to provide more accurate and specific answers. If the context is relevant to the user's question, incorporate it into your response. If not relevant, rely on your general knowledge.`;
    }

    /**
     * Get vision-specific system prompt for image analysis
     */
    _getVisionSystemPrompt() {
        return `You are PediTrack AI with Vision Capabilities, a helpful and knowledgeable pediatric health assistant specifically designed for Sri Lankan families. 
You can SEE and ANALYZE images that users share with you. When an image is provided, carefully examine it and provide detailed, helpful observations.

Your capabilities include:
- Analyzing photos of rashes, skin conditions, and physical symptoms
- Identifying potential health concerns from visual information
- Providing context-aware advice based on what you see in images
- Describing what you observe in medical terms when appropriate

Guidelines:
- ALWAYS acknowledge that you can see the image when one is provided
- Describe what you observe in the image clearly and specifically
- Provide advice considering Sri Lankan culture, climate, and healthcare system
- Reference local resources (government hospitals, MOH clinics) when relevant
- Use familiar Sri Lankan examples and context
- Be aware of tropical health concerns common in Sri Lanka
- Recommend consulting local healthcare professionals (pediatricians, MOH doctors, PHI officers)
- Be empathetic and supportive to Sri Lankan parents
- Use simple, easy-to-understand language suitable for Sri Lankan English speakers
- Consider local economic factors and affordable healthcare options
- Always prioritize child safety and well-being

When analyzing images:
- Describe what you see (color, size, location, pattern, etc.)
- Provide possible explanations for what you observe
- Suggest appropriate next steps or when to seek medical care
- Be cautious and avoid definitive diagnoses - always recommend professional evaluation for concerning symptoms

Remember: You CAN see and analyze images. You are an assistant familiar with Sri Lankan pediatric healthcare with vision capabilities, not a replacement for professional medical advice. Always encourage consultation with local healthcare providers when needed.`;
    }

    /**
     * Switch LLM provider dynamically
     */
    switchProvider(provider) {
        console.log(`🔄 Switching LLM provider from ${this.provider} to ${provider}`);
        this.provider = provider;
        this.initializeModel();
    }

    /**
     * Get current provider info
     */
    getProviderInfo() {
        return {
            provider: this.provider,
            model: this.model.modelName,
            temperature: this.model.temperature,
            maxTokens: this.model.maxTokens || this.model.maxOutputTokens,
            ragEnabled: this.useRAG
        };
    }

    /**
     * Check if RAG service is available
     */
    async isRAGAvailable() {
        const health = await this.ragService.healthCheck();
        return health.available;
    }

    /**
     * Generate a chat completion with image input
     * Uses OpenAI's vision capabilities
     */
    async generateResponseWithImage(messages, imageBuffer, imageMimeType, options = {}) {
        try {
            const { temperature, maxTokens } = options;

            // Only OpenAI supports vision in our current setup
            // For other providers, we'll need to switch temporarily or throw an error
            if (this.provider !== 'openai') {
                console.warn(`⚠️  Vision not supported for ${this.provider}, switching to OpenAI temporarily`);
            }

            // Convert image buffer to base64
            const base64Image = imageBuffer.toString('base64');
            const imageUrl = `data:${imageMimeType};base64,${base64Image}`;

            // Get the latest user message
            const userMessage = messages[messages.length - 1];
            if (!userMessage || userMessage.role !== 'user') {
                throw new Error('Last message must be from user');
            }

            // Build vision-specific system prompt
            const systemPrompt = this._getVisionSystemPrompt();

            // Prepare messages for OpenAI vision API
            const visionMessages = [
                {
                    role: 'system',
                    content: systemPrompt
                }
            ];

            // Add conversation history (text only)
            for (let i = 0; i < messages.length - 1; i++) {
                const msg = messages[i];
                visionMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            }

            // Add the latest message with image
            visionMessages.push({
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: userMessage.content || 'Please analyze this image and provide relevant information.'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl,
                            detail: 'auto' // Can be 'low', 'high', or 'auto'
                        }
                    }
                ]
            });

            // Use OpenAI directly for vision (not through LangChain as it has limited vision support)
            const OpenAI = require('openai');
            
            // Clean API key (remove quotes if present)
            const apiKey = process.env.OPENAI_API_KEY?.replace(/['"]/g, '').trim();
            
            if (!apiKey) {
                throw new Error('OPENAI_API_KEY is not set in environment variables');
            }
            
            const openai = new OpenAI({
                apiKey: apiKey
            });

            const visionModel = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';
            console.log(`🖼️  Calling OpenAI Vision API with model: ${visionModel}...`);
            
            const response = await openai.chat.completions.create({
                model: visionModel,
                messages: visionMessages,
                temperature: temperature || 0.7,
                max_tokens: maxTokens || 1000
            });

            console.log('✅ Vision API response received');
            console.log(`   Model used: ${response.model}`);
            console.log(`   Tokens used: ${response.usage?.total_tokens || 'N/A'}`);

            return {
                success: true,
                response: response.choices[0].message.content,
                provider: 'openai',
                model: response.model,
                usage: response.usage
            };

        } catch (error) {
            console.error('❌ Vision API Error:', error.message);
            if (error.response) {
                console.error('   API Response:', error.response.data);
            }
            if (error.message.includes('model')) {
                console.error('   💡 Make sure OPENAI_VISION_MODEL is set to a vision-capable model (gpt-4o-mini, gpt-4o, gpt-4-turbo)');
            }
            throw error;
        }
    }
}

// Singleton instance
let llmServiceInstance = null;

function getLLMService() {
    if (!llmServiceInstance) {
        llmServiceInstance = new MultiProviderLLMService();
    }
    return llmServiceInstance;
}

module.exports = { MultiProviderLLMService, getLLMService };
