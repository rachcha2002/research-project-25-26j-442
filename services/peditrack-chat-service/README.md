# PediTrack Chat Service

AI-powered chat microservice for PediTrack v2 application. This service provides integration with multiple LLM providers including OpenAI, Anthropic Claude, Google Gemini, and Hugging Face.

## Features

- 🤖 **Multiple LLM Providers**: Support for OpenAI, Anthropic, Google Gemini, and Hugging Face
- 💬 **Real-time Chat**: Send messages and receive AI responses
- 🔄 **Streaming Support**: Real-time streaming responses for better UX
- 📝 **Conversation History**: Maintain conversation context
- 🔒 **Secure**: CORS protection, helmet security headers
- 🚀 **RESTful API**: Clean and well-documented API endpoints
- ⚡ **Fast & Lightweight**: Built with Express.js

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- API key for at least one LLM provider (OpenAI, Anthropic, Google, or Hugging Face)

## Installation

1. Navigate to the service directory:
```bash
cd services/peditrack-chat-service
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your API keys:
```env
# Required
PORT=3001
OPENAI_API_KEY=your_actual_openai_api_key

# Optional - for other providers
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
HUGGINGFACE_API_KEY=your_huggingface_key
```

## Running the Service

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The service will start on `http://localhost:3001` (or the port specified in your `.env` file).

## API Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "PediTrack Chat Service is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### Detailed Status
```http
GET /api/health/status
```

### Send Message
```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "Hello, I have a question about my child's health",
  "conversationId": "optional-conversation-id",
  "userId": "optional-user-id",
  "provider": "openai"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid-v4-conversation-id",
    "message": {
      "id": "uuid-v4-message-id",
      "role": "assistant",
      "content": "I'd be happy to help you with your child's health question...",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "provider": "openai"
  }
}
```

### Stream Message (Server-Sent Events)
```http
POST /api/chat/stream
Content-Type: application/json

{
  "message": "Tell me about child nutrition",
  "conversationId": "optional-conversation-id",
  "provider": "openai"
}
```

**Response:** Server-Sent Events stream
```
data: {"chunk":"I'd","done":false}

data: {"chunk":" be","done":false}

data: {"chunk":" happy","done":false}

...

data: {"chunk":"","done":true,"conversationId":"uuid","messageId":"uuid"}
```

### Get Conversation History
```http
GET /api/chat/history/:conversationId
```

### Clear Conversation History
```http
DELETE /api/chat/history/:conversationId
```

## Supported LLM Providers

### OpenAI (Default)
- Models: `gpt-4-turbo-preview`, `gpt-4`, `gpt-3.5-turbo`
- Supports streaming: ✅

### Anthropic Claude
- Models: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`
- Supports streaming: ✅

### Google Gemini
- Models: `gemini-pro`, `gemini-pro-vision`
- Supports streaming: ❌ (falls back to regular response)

### Hugging Face
- Models: Various open-source models
- Supports streaming: ❌ (falls back to regular response)

## Integration with React Native App

### Example Usage in React Native

```typescript
// services/chatService.ts
const API_URL = 'http://localhost:3001/api';

export const sendChatMessage = async (
  message: string,
  conversationId?: string
) => {
  try {
    const response = await fetch(`${API_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationId,
        provider: 'openai'
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  }
};
```

### Update ChatScreen.tsx

Replace the mock `handleSend` function with actual API calls:

```typescript
const handleSend = async () => {
  if (inputText.trim()) {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: 'Just Now',
    };
    setMessages([...messages, newMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(inputText, conversationId);
      
      const aiMessage: Message = {
        id: response.data.message.id,
        text: response.data.message.content,
        sender: 'assistant',
        timestamp: new Date(response.data.message.timestamp).toLocaleTimeString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setConversationId(response.data.conversationId);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      // Handle error appropriately
    } finally {
      setIsTyping(false);
    }
  }
};
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3001 | No |
| `NODE_ENV` | Environment | development | No |
| `OPENAI_API_KEY` | OpenAI API key | - | Yes* |
| `OPENAI_MODEL` | OpenAI model | gpt-3.5-turbo | No |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | No |
| `GOOGLE_API_KEY` | Google API key | - | No |
| `HUGGINGFACE_API_KEY` | Hugging Face API key | - | No |
| `ALLOWED_ORIGINS` | CORS origins | * | No |
| `MAX_CONVERSATION_HISTORY` | Max messages in history | 10 | No |
| `DEFAULT_TEMPERATURE` | AI temperature | 0.7 | No |
| `MAX_TOKENS` | Max response tokens | 1000 | No |
| `SYSTEM_PROMPT` | AI system prompt | See .env.example | No |

*At least one LLM provider API key is required

## Project Structure

```
peditrack-chat-service/
├── src/
│   ├── controllers/
│   │   └── chat.controller.js      # Request handlers
│   ├── routes/
│   │   ├── chat.routes.js          # Chat endpoints
│   │   └── health.routes.js        # Health check endpoints
│   ├── services/
│   │   └── llm.service.js          # LLM provider integrations
│   ├── utils/
│   │   └── conversationStore.js    # In-memory conversation storage
│   └── server.js                   # Express app setup
├── .env.example                    # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Production Considerations

1. **Database Integration**: Replace in-memory `conversationStore` with a database (MongoDB, PostgreSQL, Redis)
2. **Authentication**: Add user authentication and authorization
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Logging**: Add proper logging (Winston, Bunyan)
5. **Monitoring**: Add monitoring and alerting (Prometheus, Grafana)
6. **Caching**: Implement caching for frequently asked questions
7. **Load Balancing**: Use load balancer for horizontal scaling
8. **Error Handling**: Enhance error handling and user feedback

## Troubleshooting

### Service won't start
- Check if port 3001 is already in use
- Verify Node.js version (14.x or higher)
- Ensure all dependencies are installed

### API key errors
- Verify your API key is correctly set in `.env`
- Check if the API key has sufficient credits/quota
- Ensure the API key has the correct permissions

### CORS errors
- Add your React Native app's URL to `ALLOWED_ORIGINS` in `.env`
- For development, you can use `*` to allow all origins

## License

ISC

## Support

For issues and questions, please create an issue in the project repository.
