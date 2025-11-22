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
            if (useRAG) {
                console.log('🔍 Using RAG for context enhancement...');
                const ragResult = await this.ragService.retrieveDocuments(
                    userMessage.content,
                    ragTopK,
                    ragThreshold
                );

                if (ragResult.success && ragResult.context) {
                    systemPrompt = this._enhanceSystemPromptWithRAG(systemPrompt, ragResult.context);
                    console.log(`✅ Enhanced prompt with ${ragResult.count} documents`);
                } else {
                    console.log('⚠️  No RAG context available, using base prompt');
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
                ragUsed: useRAG
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
        return process.env.SYSTEM_PROMPT || `You are PediTrack AI, a helpful and knowledgeable pediatric health assistant. 
You provide accurate, evidence-based information about child health, development, and parenting.

Guidelines:
- Always prioritize child safety and well-being
- Provide clear, actionable advice
- Recommend consulting healthcare professionals for serious concerns
- Be empathetic and supportive to parents
- Use simple, easy-to-understand language
- If you're unsure, acknowledge limitations and suggest professional consultation

Remember: You are an assistant, not a replacement for professional medical advice.`;
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
