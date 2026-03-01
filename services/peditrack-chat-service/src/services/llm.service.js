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
                    model: process.env.GOOGLE_MODEL || 'gemini-pro',
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
                maxTokens,
                language = 'en'
            } = options;

            // Get the latest user message
            const userMessage = messages[messages.length - 1];
            if (!userMessage || userMessage.role !== 'user') {
                throw new Error('Last message must be from user');
            }

            let systemPrompt = this._getSystemPrompt(language);

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
                // Google Gemini uses maxOutputTokens, others use maxTokens
                if (this.provider === 'google' || this.provider === 'gemini') {
                    this.model.maxOutputTokens = maxTokens;
                } else {
                    this.model.maxTokens = maxTokens;
                }
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
                ragThreshold = 0.0,
                language = 'en'
            } = options;

            const userMessage = messages[messages.length - 1];
            if (!userMessage || userMessage.role !== 'user') {
                throw new Error('Last message must be from user');
            }

            let systemPrompt = this._getSystemPrompt(language);

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
    _getSystemPrompt(language = 'en') {
        const base = process.env.SYSTEM_PROMPT || `You are PediTrack AI, a caring child health assistant built into the PediTrack app. You talk like a knowledgeable, supportive friend — not a textbook.

STRICT RULES:
1) Only answer questions about child health, development, parenting, maternal health, and family wellness. For anything else, say sorry and redirect to child health topics.
2) NEVER use the words "Sri Lanka" or "Sri Lankan" in your responses. You are a local app — the user knows where they live. Do not mention the country name at all.
3) Be smart about response length. Simple questions get 1-2 sentences. If something needs more detail, go ahead and explain properly — but still write in natural conversational sentences. NEVER use bullet points, numbered lists, or headers. Just talk like a friend.
4) If the situation sounds serious, simply recommend they see their pediatrician or visit the nearest hospital soon.`;

        const langDirective = this._getLanguageDirective(language);
        return langDirective ? `${base}\n\n${langDirective}` : base;
    }

    /**
     * Get language directive for system prompt
     */
    _getLanguageDirective(language) {
        const directives = {
            en: '',
            si: 'CRITICAL LANGUAGE RULE: You MUST respond ONLY in Sinhala (සිංහල) for this ENTIRE conversation. Every single word of your response must be in Sinhala script. Even if the user types in English or any other language, you MUST still reply in Sinhala only. NEVER switch to English. This is non-negotiable.',
            ta: 'CRITICAL LANGUAGE RULE: You MUST respond ONLY in Tamil (தமிழ்) for this ENTIRE conversation. Every single word of your response must be in Tamil script. Even if the user types in English or any other language, you MUST still reply in Tamil only. NEVER switch to English. This is non-negotiable.'
        };
        return directives[language] || '';
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
        return `You are PediTrack AI with Vision, a friendly child health assistant that can see and analyze images.

STRICT RULES:
1) Only analyze images related to child health (rashes, skin conditions, injuries, growth concerns). Decline anything else politely.
2) NEVER use the words "Sri Lanka" or "Sri Lankan". You are a local app.
3) Keep responses to 3-5 short sentences. Describe what you see, a possible cause, and what to do next. No bullet points or headers — just talk naturally.
4) Never give definitive diagnoses. If it looks concerning, recommend seeing a doctor soon.`;
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
     * Supports both Gemini (native multimodal) and OpenAI vision
     */
    async generateResponseWithImage(messages, imageBuffer, imageMimeType, options = {}) {
        try {
            const { temperature, maxTokens } = options;

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

            // Use Gemini for vision (native multimodal support)
            if (this.provider === 'google' || this.provider === 'gemini') {
                console.log(`🖼️  Using Gemini multimodal vision...`);

                // Prepare messages with image for Gemini
                const geminiMessages = [new SystemMessage(systemPrompt)];

                // Add conversation history (text only)
                for (let i = 0; i < messages.length - 1; i++) {
                    const msg = messages[i];
                    if (msg.role === 'user') {
                        geminiMessages.push(new HumanMessage(msg.content));
                    } else if (msg.role === 'assistant') {
                        geminiMessages.push(new AIMessage(msg.content));
                    }
                }

                // Add the latest message with image using LangChain's format
                geminiMessages.push(new HumanMessage({
                    content: [
                        {
                            type: 'text',
                            text: userMessage.content || 'Please analyze this image and provide relevant information.'
                        },
                        {
                            type: 'image_url',
                            image_url: imageUrl
                        }
                    ]
                }));

                // Use Gemini vision model
                const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
                const visionModel = new ChatGoogleGenerativeAI({
                    modelName: process.env.GOOGLE_VISION_MODEL || 'gemini-1.5-flash',
                    temperature: temperature || 0.7,
                    maxOutputTokens: maxTokens || 1000,
                    apiKey: process.env.GOOGLE_API_KEY,
                });

                console.log(`   Model: ${visionModel.modelName}`);
                const response = await visionModel.invoke(geminiMessages);

                console.log('✅ Gemini vision response received');

                return {
                    success: true,
                    response: response.content,
                    provider: 'google',
                    model: visionModel.modelName
                };
            }

            // Fallback to OpenAI for vision if not using Gemini
            console.log(`🖼️  Using OpenAI Vision API (fallback)...`);

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
                            detail: 'auto'
                        }
                    }
                ]
            });

            // Use OpenAI directly for vision
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
            console.log(`   Model: ${visionModel}`);
            
            const response = await openai.chat.completions.create({
                model: visionModel,
                messages: visionMessages,
                temperature: temperature || 0.7,
                max_tokens: maxTokens || 1000
            });

            console.log('✅ OpenAI vision response received');
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
