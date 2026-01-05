# 🚀 Quick Start - Image Upload Feature

## ✅ What Was Fixed

1. **Backend**: Added vision AI support using OpenAI's gpt-4o-mini (cheapest model)
2. **Frontend**: Fixed image upload to properly call the vision API
3. **Integration**: Connected chat screen to backend image processing

## 📋 Setup Checklist

### 1. Configure Backend Environment
```bash
cd services/peditrack-chat-service
```

Edit `.env` file (or create from `.env.example`):
```bash
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_VISION_MODEL=gpt-4o-mini
LLM_PROVIDER=openai
PORT=3001
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Backend Service
```bash
npm start
```

You should see:
```
🚀 PediTrack Chat Service running on port 3001
🤖 LLM Provider: OpenAI (gpt-3.5-turbo)
✅ Server is ready to accept requests!
```

### 4. Test Backend (Optional)
```bash
node test-image-upload.js
```

### 5. Update Frontend IP (if needed)
Edit `peditrackv2/src/services/chatService.ts`:
```typescript
const API_BASE_URL = 'http://YOUR_IP:3001/api';
```

### 6. Run Mobile App
```bash
cd ../../peditrackv2
npm start
```

## 🎯 How to Use

### From Mobile App:
1. Open chat screen
2. Tap **image icon** 📷
3. Select image from gallery
4. (Optional) Add text caption
5. Tap **send** ✈️
6. AI analyzes image and responds!

### Example Prompts:
- "What is this rash?"
- "Is this normal for a 2-year-old?"
- "What symptoms do you see?"
- (No text - just image analysis)

## 💰 Cost Information

**Model**: gpt-4o-mini
- **Input**: $0.15 per 1M tokens (~$0.0002 per image)
- **Output**: $0.60 per 1M tokens
- **Average cost per image**: ~$0.001 - $0.005

**Much cheaper than**:
- gpt-4o: ~17x more expensive
- gpt-4-turbo: ~67x more expensive

## 🧪 Testing

### Quick Test (Backend):
```bash
cd services/peditrack-chat-service
node test-image-upload.js
```

### Manual Test (API):
```bash
curl -X POST http://localhost:3001/api/chat/message-with-image \
  -F "image=@test.jpg" \
  -F "message=What is this?"
```

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Image file is required" | Check image picker permissions |
| "Vision API Error" | Verify OPENAI_API_KEY in .env |
| "Connection Error" | Check backend is running on correct IP |
| High costs | Using gpt-4o-mini? Check .env |
| FormData error | Don't manually set Content-Type |

## 📁 Key Files Changed

**Backend**:
- `src/services/llm.service.js` - Vision API integration
- `src/controllers/chat.controller.js` - Image upload handling
- `.env.example` - Configuration template

**Frontend**:
- `src/services/chatService.ts` - API client
- `src/screens/ConversationalAI/ChatScreen.tsx` - UI

**Documentation**:
- `IMAGE_UPLOAD_GUIDE.md` - Full documentation
- `CHANGES_SUMMARY.md` - Detailed changes
- `test-image-upload.js` - Test script

## 🎓 Learn More

- Full guide: `IMAGE_UPLOAD_GUIDE.md`
- Changes: `CHANGES_SUMMARY.md`
- OpenAI Vision: https://platform.openai.com/docs/guides/vision

## ⚡ Quick Commands

```bash
# Start backend
cd services/peditrack-chat-service && npm start

# Test backend
cd services/peditrack-chat-service && node test-image-upload.js

# Start frontend
cd peditrackv2 && npm start

# Check backend health
curl http://localhost:3001/api/health
```

## ✨ Features

- ✅ Image upload with text prompts
- ✅ Image-only analysis (no text needed)
- ✅ Conversation context maintained
- ✅ Multiple image formats (JPEG, PNG, GIF, WebP)
- ✅ Cost-optimized (gpt-4o-mini)
- ✅ Error handling
- ✅ Mobile-friendly UI

## 🎉 You're Ready!

Everything is set up and ready to use. Just:
1. Add your OpenAI API key to `.env`
2. Start the backend service
3. Test from the mobile app

Happy coding! 🚀
