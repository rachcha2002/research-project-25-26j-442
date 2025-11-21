const OpenAI = require('openai');
const axios = require('axios');

class LLMService {
    constructor() {
        // Initialize OpenAI client
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }

        this.systemPrompt = process.env.SYSTEM_PROMPT || 
            'You are a helpful AI assistant for PediTrack, a pediatric health tracking application. You provide helpful, accurate, and caring responses about child health and development.';
        
        this.maxTokens = parseInt(process.env.MAX_TOKENS) || 1000;
        this.temperature = parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7;
        this.maxHistory = parseInt(process.env.MAX_CONVERSATION_HISTORY) || 10;
    }

    /**
     * Generate response using specified LLM provider
     */
    async generateResponse(message, history = [], provider = 'openai') {
        switch (provider.toLowerCase()) {
            case 'openai':
                return await this.generateOpenAIResponse(message, history);
            case 'anthropic':
                return await this.generateAnthropicResponse(message, history);
            case 'google':
            case 'gemini':
                return await this.generateGeminiResponse(message, history);
            case 'huggingface':
                return await this.generateHuggingFaceResponse(message, history);
            default:
                throw new Error(`Unsupported LLM provider: ${provider}`);
        }
    }

    /**
     * Stream response using specified LLM provider
     */
    async streamResponse(message, history = [], provider = 'openai', onChunk) {
        switch (provider.toLowerCase()) {
            case 'openai':
                return await this.streamOpenAIResponse(message, history, onChunk);
            case 'anthropic':
                return await this.streamAnthropicResponse(message, history, onChunk);
            default:
                // Fallback to non-streaming for unsupported providers
                const response = await this.generateResponse(message, history, provider);
                onChunk(response);
                return response;
        }
    }

    /**
     * OpenAI GPT Response
     */
    async generateOpenAIResponse(message, history = []) {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const messages = this.buildMessageHistory(history, message);

            const completion = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: messages,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`OpenAI API Error: ${error.message}`);
        }
    }

    /**
     * OpenAI Streaming Response
     */
    async streamOpenAIResponse(message, history = [], onChunk) {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const messages = this.buildMessageHistory(history, message);

            const stream = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: messages,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    onChunk(content);
                }
            }
        } catch (error) {
            console.error('OpenAI Streaming Error:', error);
            throw new Error(`OpenAI Streaming Error: ${error.message}`);
        }
    }

    /**
     * Anthropic Claude Response
     */
    async generateAnthropicResponse(message, history = []) {
        if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
            throw new Error('Anthropic API key not configured');
        }

        try {
            const messages = this.buildAnthropicMessages(history, message);

            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
                    max_tokens: this.maxTokens,
                    messages: messages,
                    system: this.systemPrompt,
                    temperature: this.temperature
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.ANTHROPIC_API_KEY,
                        'anthropic-version': '2023-06-01'
                    }
                }
            );

            return response.data.content[0].text;
        } catch (error) {
            console.error('Anthropic API Error:', error.response?.data || error);
            throw new Error(`Anthropic API Error: ${error.message}`);
        }
    }

    /**
     * Anthropic Streaming Response
     */
    async streamAnthropicResponse(message, history = [], onChunk) {
        if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
            throw new Error('Anthropic API key not configured');
        }

        try {
            const messages = this.buildAnthropicMessages(history, message);

            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
                    max_tokens: this.maxTokens,
                    messages: messages,
                    system: this.systemPrompt,
                    temperature: this.temperature,
                    stream: true
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.ANTHROPIC_API_KEY,
                        'anthropic-version': '2023-06-01'
                    },
                    responseType: 'stream'
                }
            );

            return new Promise((resolve, reject) => {
                let fullText = '';
                response.data.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'content_block_delta' && data.delta?.text) {
                                fullText += data.delta.text;
                                onChunk(data.delta.text);
                            }
                        }
                    }
                });
                response.data.on('end', () => resolve(fullText));
                response.data.on('error', reject);
            });
        } catch (error) {
            console.error('Anthropic Streaming Error:', error.response?.data || error);
            throw new Error(`Anthropic Streaming Error: ${error.message}`);
        }
    }

    /**
     * Google Gemini Response
     */
    async generateGeminiResponse(message, history = []) {
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_api_key_here') {
            throw new Error('Google API key not configured');
        }

        try {
            const model = process.env.GEMINI_MODEL || 'gemini-pro';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

            const contents = this.buildGeminiMessages(history, message);

            const response = await axios.post(url, {
                contents: contents,
                generationConfig: {
                    temperature: this.temperature,
                    maxOutputTokens: this.maxTokens,
                }
            });

            return response.data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error.response?.data || error);
            throw new Error(`Gemini API Error: ${error.message}`);
        }
    }

    /**
     * Hugging Face Response
     */
    async generateHuggingFaceResponse(message, history = []) {
        if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'your_huggingface_api_key_here') {
            throw new Error('Hugging Face API key not configured');
        }

        try {
            // Using a default model, can be configured
            const model = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
            const url = `https://api-inference.huggingface.co/models/${model}`;

            const prompt = this.buildHuggingFacePrompt(history, message);

            const response = await axios.post(
                url,
                {
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: this.maxTokens,
                        temperature: this.temperature,
                        return_full_text: false
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data[0].generated_text;
        } catch (error) {
            console.error('Hugging Face API Error:', error.response?.data || error);
            throw new Error(`Hugging Face API Error: ${error.message}`);
        }
    }

    /**
     * Build message history for OpenAI format
     */
    buildMessageHistory(history, currentMessage) {
        const messages = [
            { role: 'system', content: this.systemPrompt }
        ];

        // Add recent history (limit to maxHistory)
        const recentHistory = history.slice(-this.maxHistory);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        }

        // Add current message
        messages.push({
            role: 'user',
            content: currentMessage
        });

        return messages;
    }

    /**
     * Build message history for Anthropic format
     */
    buildAnthropicMessages(history, currentMessage) {
        const messages = [];

        // Add recent history
        const recentHistory = history.slice(-this.maxHistory);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            });
        }

        // Add current message
        messages.push({
            role: 'user',
            content: currentMessage
        });

        return messages;
    }

    /**
     * Build message history for Gemini format
     */
    buildGeminiMessages(history, currentMessage) {
        const contents = [];

        // Add recent history
        const recentHistory = history.slice(-this.maxHistory);
        for (const msg of recentHistory) {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }

        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: currentMessage }]
        });

        return contents;
    }

    /**
     * Build prompt for Hugging Face format
     */
    buildHuggingFacePrompt(history, currentMessage) {
        let prompt = `${this.systemPrompt}\n\n`;

        // Add recent history
        const recentHistory = history.slice(-this.maxHistory);
        for (const msg of recentHistory) {
            const role = msg.role === 'assistant' ? 'Assistant' : 'User';
            prompt += `${role}: ${msg.content}\n`;
        }

        // Add current message
        prompt += `User: ${currentMessage}\nAssistant:`;

        return prompt;
    }
}

module.exports = new LLMService();
