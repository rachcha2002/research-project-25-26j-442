# PediTrack Chat Service - Complete Documentation

## 🎯 Overview

This microservice provides AI-powered chat functionality for the PediTrack v2 mobile application. It supports multiple LLM providers and offers both standard and streaming responses.

## 📁 Project Structure

```
services/peditrack-chat-service/
├── src/
│   ├── controllers/
│   │   └── chat.controller.js          # Handles chat requests, validation, and responses
│   ├── routes/
│   │   ├── chat.routes.js              # Chat API endpoints
│   │   └── health.routes.js            # Health check endpoints
│   ├── services/
│   │   └── llm.service.js              # LLM provider integrations (OpenAI, Anthropic, etc.)
│   ├── utils/
│   │   └── conversationStore.js        # In-memory conversation storage
│   └── server.js                       # Express app configuration and startup
├── .env.example                        # Environment variables template
├── .env                                # Your actual environment variables (git-ignored)
├── .gitignore                          # Files to ignore in git
├── package.json                        # Node.js dependencies and scripts
├── README.md                           # Main documentation
├── SETUP.md                            # Setup instructions
├── DOCUMENTATION.md                    # This file
└── test.js                             # Test script for API endpoints
```

## 🔧 Architecture

### Request Flow

```
Mobile App (React Native)
    ↓
chatService.ts (API Client)
    ↓
Express Server (server.js)
    ↓
Routes (chat.routes.js)
    ↓
Controller (chat.controller.js)
    ↓
LLM Service (llm.service.js)
    ↓
External LLM API (OpenAI, Anthropic, etc.)
    ↓
Response back through the chain
```

### Components

#### 1. Server (server.js)
- Express.js application setup
- Middleware configuration (CORS, Helmet, Morgan, Body Parser)
- Route registration
- Error handling
- Server startup

#### 2. Routes
- **health.routes.js**: Health check and status endpoints
- **chat.routes.js**: Chat message endpoints (send, stream, history)

#### 3. Controllers
- **chat.controller.js**: 
  - Request validation
  - Conversation management
  - Response formatting
  - Error handling

#### 4. Services
- **llm.service.js**:
  - Multi-provider support (OpenAI, Anthropic, Google, Hugging Face)
  - Message formatting for each provider
  - Streaming support
  - Response generation

#### 5. Utils
- **conversationStore.js**:
  - In-memory conversation storage
  - Message history management
  - Conversation cleanup

## 🔌 API Reference

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "PediTrack Chat Service is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

#### 2. Detailed Status
```http
GET /health/status
```

**Response:**
```json
{
  "success": true,
  "service": "PediTrack Chat Service",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "llmProviders": {
    "openai": {
      "configured": true,
      "model": "gpt-3.5-turbo"
    },
    "anthropic": {
      "configured": false,
      "model": "claude-3-opus-20240229"
    },
    "google": {
      "configured": false,
      "model": "gemini-pro"
    }
  }
}
```

#### 3. Send Message
```http
POST /chat/message
Content-Type: application/json

{
  "message": "Your message here",
  "conversationId": "optional-uuid",
  "userId": "optional-user-id",
  "provider": "openai"
}
```

**Request Fields:**
- `message` (required): The user's message
- `conversationId` (optional): UUID of existing conversation
- `userId` (optional): User identifier
- `provider` (optional): LLM provider (default: "openai")

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid-v4",
    "message": {
      "id": "uuid-v4",
      "role": "assistant",
      "content": "AI response here...",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "provider": "openai"
  }
}
```

#### 4. Stream Message
```http
POST /chat/stream
Content-Type: application/json

{
  "message": "Your message here",
  "conversationId": "optional-uuid",
  "provider": "openai"
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"chunk":"Hello","done":false}

data: {"chunk":" there!","done":false}

data: {"chunk":"","done":true,"conversationId":"uuid","messageId":"uuid"}
```

#### 5. Get Conversation History
```http
GET /chat/history/:conversationId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid-v4",
    "messages": [
      {
        "id": "uuid-v4",
        "role": "user",
        "content": "User message",
        "timestamp": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "uuid-v4",
        "role": "assistant",
        "content": "AI response",
        "timestamp": "2024-01-01T00:00:01.000Z"
      }
    ],
    "count": 2
  }
}
```

#### 6. Clear Conversation History
```http
DELETE /chat/history/:conversationId
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation history cleared successfully",
  "data": {
    "conversationId": "uuid-v4"
  }
}
```

## 🤖 LLM Providers

### OpenAI
**Models:** gpt-4-turbo-preview, gpt-4, gpt-3.5-turbo  
**Streaming:** ✅ Yes  
**Setup:**
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
```

### Anthropic Claude
**Models:** claude-3-opus-20240229, claude-3-sonnet-20240229  
**Streaming:** ✅ Yes  
**Setup:**
```env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229
```

### Google Gemini
**Models:** gemini-pro, gemini-pro-vision  
**Streaming:** ❌ No (falls back to standard)  
**Setup:**
```env
GOOGLE_API_KEY=...
GEMINI_MODEL=gemini-pro
```

### Hugging Face
**Models:** Various open-source models  
**Streaming:** ❌ No (falls back to standard)  
**Setup:**
```env
HUGGINGFACE_API_KEY=hf_...
```

## 🔐 Security Features

1. **Helmet.js**: Security headers
2. **CORS**: Configurable origin restrictions
3. **Input Validation**: Request validation in controllers
4. **Error Handling**: Sanitized error messages
5. **Environment Variables**: Sensitive data in .env

## 📱 React Native Integration

### Setup

1. The chat service file is already created at:
   `peditrackv2/src/services/chatService.ts`

2. The ChatScreen has been updated to use the real API:
   `peditrackv2/src/screens/ConversationalAI/ChatScreen.tsx`

### Usage Example

```typescript
import { sendChatMessage } from '@/services/chatService';

// Send a message
const response = await sendChatMessage(
  'Hello, I have a question',
  conversationId,  // optional
  'openai'         // provider
);

// Use the response
console.log(response.data.message.content);
```

### Configuration

Update the API URL in `chatService.ts` if needed:

```typescript
// For localhost (emulator/web)
const API_BASE_URL = 'http://localhost:3001/api';

// For physical device (replace with your computer's IP)
const API_BASE_URL = 'http://192.168.1.100:3001/api';
```

## 🧪 Testing

### Run Test Suite

```bash
# Make sure the service is running first
npm run dev

# In another terminal
node test.js
```

### Manual Testing with cURL

```bash
# Health check
curl http://localhost:3001/api/health

# Send message
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# Get history
curl http://localhost:3001/api/chat/history/YOUR_CONVERSATION_ID
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production

1. **Set environment to production:**
```env
NODE_ENV=production
```

2. **Use a process manager (PM2):**
```bash
npm install -g pm2
pm2 start src/server.js --name peditrack-chat
pm2 save
pm2 startup
```

3. **Or use Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/server.js"]
```

### Cloud Deployment Options

1. **Heroku**
2. **AWS (EC2, ECS, Lambda)**
3. **Google Cloud (Cloud Run, App Engine)**
4. **Azure (App Service)**
5. **DigitalOcean (App Platform)**
6. **Railway**
7. **Render**

## 📊 Monitoring & Logging

### Current Logging
- Morgan for HTTP request logging
- Console logs for errors and important events

### Production Recommendations
1. **Winston** or **Bunyan** for structured logging
2. **Sentry** for error tracking
3. **Prometheus** + **Grafana** for metrics
4. **ELK Stack** for log aggregation

## 🔄 Future Enhancements

### Recommended Improvements

1. **Database Integration**
   - Replace in-memory storage with MongoDB/PostgreSQL
   - Persistent conversation history
   - User management

2. **Authentication & Authorization**
   - JWT tokens
   - User-specific conversations
   - Rate limiting per user

3. **Caching**
   - Redis for frequently asked questions
   - Response caching

4. **Advanced Features**
   - Multi-language support
   - Voice input/output
   - Image analysis (for providers that support it)
   - Context-aware responses based on user data

5. **Analytics**
   - Conversation analytics
   - User engagement metrics
   - Popular questions tracking

6. **Testing**
   - Unit tests (Jest)
   - Integration tests
   - Load testing

## 🐛 Troubleshooting

### Common Issues

#### 1. Service won't start
- Check if port 3001 is in use
- Verify Node.js version (14+)
- Run `npm install` again

#### 2. API key errors
- Verify .env file exists and has correct key
- Check API key validity
- Ensure sufficient credits/quota

#### 3. CORS errors
- Add your app URL to ALLOWED_ORIGINS
- Check CORS configuration in server.js

#### 4. Connection refused from mobile app
- Use computer's IP instead of localhost
- Ensure both on same network
- Check firewall settings

#### 5. Slow responses
- Check API provider status
- Reduce MAX_TOKENS
- Consider using gpt-3.5-turbo instead of gpt-4

## 📝 Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| PORT | number | 3001 | Server port |
| NODE_ENV | string | development | Environment |
| OPENAI_API_KEY | string | - | OpenAI API key |
| OPENAI_MODEL | string | gpt-3.5-turbo | OpenAI model |
| ANTHROPIC_API_KEY | string | - | Anthropic API key |
| ANTHROPIC_MODEL | string | claude-3-opus-20240229 | Anthropic model |
| GOOGLE_API_KEY | string | - | Google API key |
| GEMINI_MODEL | string | gemini-pro | Gemini model |
| HUGGINGFACE_API_KEY | string | - | Hugging Face API key |
| ALLOWED_ORIGINS | string | * | CORS allowed origins |
| MAX_CONVERSATION_HISTORY | number | 10 | Max messages in context |
| DEFAULT_TEMPERATURE | number | 0.7 | AI creativity (0-1) |
| MAX_TOKENS | number | 1000 | Max response length |
| SYSTEM_PROMPT | string | See .env.example | AI system instructions |

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 📄 License

ISC

## 👥 Contributing

This is a project-specific microservice. For contributions or issues, please contact the project maintainers.
