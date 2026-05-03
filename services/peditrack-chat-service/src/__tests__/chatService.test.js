// ── Mock heavy LLM providers — prevents real API calls ───────────────────────
jest.mock('@langchain/openai', () => ({
    ChatOpenAI: jest.fn().mockImplementation(() => ({
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        invoke: jest.fn().mockResolvedValue({ content: 'AI response about child health' }),
        stream: jest.fn()
    }))
}));

jest.mock('@langchain/google-genai', () => ({
    ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        modelName: 'gemini-pro',
        model: 'gemini-pro',
        temperature: 0.7,
        maxOutputTokens: 1000,
        invoke: jest.fn().mockResolvedValue({ content: 'Gemini child health response' }),
        stream: jest.fn()
    }))
}));

jest.mock('@langchain/anthropic', () => ({
    ChatAnthropic: jest.fn().mockImplementation(() => ({
        modelName: 'claude-3-sonnet-20240229',
        temperature: 0.7,
        maxTokens: 1000,
        invoke: jest.fn().mockResolvedValue({ content: 'Claude child health response' }),
        stream: jest.fn()
    }))
}));

// ── Mock RAG service — prevents HTTP calls to the RAG backend ────────────────
jest.mock('../services/rag.service', () => ({
    getRagService: jest.fn().mockReturnValue({
        retrieveDocuments: jest.fn().mockResolvedValue({
            success: true,
            documents: [{ source: 'CDC', score: 0.85, text: 'Child growth guidelines' }],
            context: 'Child growth context data from CDC guidelines',
            count: 1
        }),
        healthCheck: jest.fn().mockResolvedValue({ available: true })
    })
}));
// ─────────────────────────────────────────────────────────────────────────────

const { MultiProviderLLMService } = require('../services/llm.service');

describe('MultiProviderLLMService', () => {
    let service;

    beforeEach(() => {
        process.env.LLM_PROVIDER = 'openai';
        process.env.OPENAI_API_KEY = 'test-api-key-not-real';
        process.env.USE_RAG = 'false';
        service = new MultiProviderLLMService();
    });

    test('_isMedicalQuery returns false for short conversational messages under 15 chars', () => {
        expect(service._isMedicalQuery('ok')).toBe(false);
        expect(service._isMedicalQuery('thanks!')).toBe(false);
        expect(service._isMedicalQuery('yes')).toBe(false);
        expect(service._isMedicalQuery('got it')).toBe(false);
    });

    test('_isMedicalQuery returns true for substantive medical queries over 15 chars', () => {
        expect(service._isMedicalQuery('What are normal fever temperatures for toddlers?')).toBe(true);
        expect(service._isMedicalQuery('My baby has a rash on the neck area')).toBe(true);
        expect(service._isMedicalQuery('How much vitamin D should a 1-year-old get?')).toBe(true);
    });

    test('_buildRagQuery concatenates last two user turns to enrich follow-up questions', () => {
        const messages = [
            { role: 'user', content: 'What is a normal weight for a 6-month-old baby?' },
            { role: 'assistant', content: 'Around 7 to 8 kg is typical for that age.' },
            { role: 'user', content: 'What about for newborns?' }
        ];
        const query = service._buildRagQuery(messages);
        expect(query).toContain('6-month-old baby');
        expect(query).toContain('newborns');
    });

    test('_buildRagQuery returns the single user message when conversation has only one turn', () => {
        const messages = [{ role: 'user', content: 'What vitamins does a toddler need daily?' }];
        const query = service._buildRagQuery(messages);
        expect(query).toBe('What vitamins does a toddler need daily?');
    });

    test('convertToLangChainMessages preserves message count and content in correct order', () => {
        const messages = [
            { role: 'user', content: 'What vitamins are good for toddlers?' },
            { role: 'assistant', content: 'Vitamin D and iron are very important.' },
            { role: 'user', content: 'How much vitamin D per day?' }
        ];
        const result = service.convertToLangChainMessages(messages, 'You are PediTrack AI.');
        expect(result).toHaveLength(4); // 1 system + 3 conversation messages
        expect(result[0].content).toBe('You are PediTrack AI.');
        expect(result[1].content).toBe('What vitamins are good for toddlers?');
        expect(result[2].content).toBe('Vitamin D and iron are very important.');
        expect(result[3].content).toBe('How much vitamin D per day?');
    });

    test('_getSystemPrompt includes Sinhala-only directive when language code is si', () => {
        const prompt = service._getSystemPrompt('si');
        expect(prompt).toContain('Sinhala');
        expect(prompt).toContain('සිංහල');
        expect(prompt).toContain('NEVER switch to English');
    });

    test('_enhanceSystemPromptWithRAG injects knowledge base context block into base prompt', () => {
        const base = 'You are PediTrack AI, a caring child health assistant.';
        const context = 'CDC growth charts indicate median weight at 6 months is 7.3 kg for boys.';
        const enhanced = service._enhanceSystemPromptWithRAG(base, context);
        expect(enhanced).toContain(base);
        expect(enhanced).toContain('KNOWLEDGE BASE CONTEXT');
        expect(enhanced).toContain(context);
        expect(enhanced).toContain('[LOCAL]');
    });

    test('generateResponse returns success with LLM content and correct provider when RAG is off', async () => {
        const messages = [{ role: 'user', content: 'What is a healthy diet for a 2-year-old child?' }];
        const result = await service.generateResponse(messages, { useRAG: false });
        expect(result.success).toBe(true);
        expect(typeof result.response).toBe('string');
        expect(result.response.length).toBeGreaterThan(0);
        expect(result.provider).toBe('openai');
        expect(result.ragUsed).toBe(false);
    });
});
