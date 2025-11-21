# PediTrack Chat Service - Setup Guide

## Quick Start Guide

Follow these steps to get the chat service up and running:

### Step 1: Install Dependencies

Navigate to the chat service directory and install dependencies:

```bash
cd services/peditrack-chat-service
npm install
```

### Step 2: Configure Environment Variables

1. The `.env.example` file has been copied to `.env` for you
2. **IMPORTANT**: Replace `your_openai_api_key_here` with your actual OpenAI API key

Edit the `.env` file:
```bash
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

To get an OpenAI API key:
- Go to https://platform.openai.com/api-keys
- Sign up or log in
- Create a new API key
- Copy and paste it into your `.env` file

### Step 3: Start the Service

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

You should see:
```
🚀 PediTrack Chat Service running on port 3001
📝 Environment: development
🤖 LLM Provider: OpenAI (gpt-3.5-turbo)

✅ Server is ready to accept requests!
```

### Step 4: Test the Service

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3001/api/health
```

You should get a response like:
```json
{
  "success": true,
  "message": "PediTrack Chat Service is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 1.234
}
```

### Step 5: Test Chat Functionality

Test sending a message:

```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me with my child health question?"}'
```

### Step 6: Run the React Native App

In a separate terminal, navigate to the React Native app and start it:

```bash
cd peditrackv2
npm start
```

Then navigate to the chat screen in the app and start chatting!

## Troubleshooting

### Port Already in Use
If port 3001 is already in use, change the `PORT` in `.env`:
```env
PORT=3002
```

Don't forget to update the API URL in the React Native app:
`peditrackv2/src/services/chatService.ts` - change `http://localhost:3001` to your new port.

### API Key Errors
- Make sure you've replaced the placeholder with your actual API key
- Verify your OpenAI account has credits
- Check that the API key is valid and not expired

### Connection Errors from Mobile App
- If testing on a physical device, replace `localhost` with your computer's IP address
- Make sure both the service and the mobile app are on the same network
- Update `ALLOWED_ORIGINS` in `.env` to include your device's URL

Example for physical device:
```typescript
// In chatService.ts
const API_BASE_URL = 'http://192.168.1.100:3001/api';
```

And in `.env`:
```env
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081
```

## Using Different LLM Providers

### Anthropic Claude
1. Get API key from https://console.anthropic.com/
2. Add to `.env`:
```env
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_MODEL=claude-3-opus-20240229
```
3. In your app, send messages with `provider: 'anthropic'`

### Google Gemini
1. Get API key from https://makersuite.google.com/app/apikey
2. Add to `.env`:
```env
GOOGLE_API_KEY=your_google_key
GEMINI_MODEL=gemini-pro
```
3. In your app, send messages with `provider: 'google'`

### Hugging Face
1. Get API key from https://huggingface.co/settings/tokens
2. Add to `.env`:
```env
HUGGINGFACE_API_KEY=your_huggingface_key
```
3. In your app, send messages with `provider: 'huggingface'`

## Next Steps

1. **Customize the System Prompt**: Edit `SYSTEM_PROMPT` in `.env` to customize the AI's behavior
2. **Add Authentication**: Implement user authentication for production use
3. **Database Integration**: Replace in-memory storage with a database
4. **Deploy**: Deploy the service to a cloud provider (AWS, Google Cloud, Azure, etc.)

## Support

For issues or questions:
1. Check the main README.md for detailed documentation
2. Review the API endpoints documentation
3. Check the console logs for error messages
