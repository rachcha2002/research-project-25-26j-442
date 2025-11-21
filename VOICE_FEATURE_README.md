# Voice Chat Feature - PediTrack v2

This document describes the voice chat capabilities added to PediTrack v2.

## Overview

The voice chat feature allows users to have natural voice conversations with the AI assistant. The system:
1. Records user's voice input
2. Transcribes speech to text using OpenAI Whisper
3. Processes the text through the AI chat service
4. Converts the AI response to speech using OpenAI TTS
5. Plays the audio response back to the user

## Architecture

### Frontend (React Native)
- **VoiceScreen.tsx**: Main voice interface with recording and playback
- **voiceService.ts**: Service layer for voice API communication
- Uses `expo-av` for audio recording and playback
- Uses `expo-file-system` for temporary audio file storage

### Backend (Node.js Microservice)
- **voiceService.js**: Handles STT and TTS using OpenAI APIs
- **voiceController.js**: REST API endpoints for voice operations
- **voice.routes.js**: Route definitions with multer for file uploads

## API Endpoints

### POST /api/voice/message
Process a complete voice message (transcribe + AI response + TTS)

**Request:**
- Type: `multipart/form-data`
- Fields:
  - `audio`: Audio file (m4a, mp3, wav, etc.)
  - `conversationId`: (optional) Existing conversation ID
  - `voice`: (optional) TTS voice (alloy, echo, fable, onyx, nova, shimmer)

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "messageId": "uuid",
    "transcription": "What the user said",
    "responseText": "AI response text",
    "audioResponse": "base64_encoded_mp3"
  }
}
```

### POST /api/voice/transcribe
Transcribe audio to text only

**Request:**
- Type: `multipart/form-data`
- Fields:
  - `audio`: Audio file

**Response:**
```json
{
  "success": true,
  "data": {
    "transcription": "Transcribed text"
  }
}
```

### POST /api/voice/speak
Convert text to speech

**Request:**
```json
{
  "text": "Text to convert",
  "voice": "nova"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "audio": "base64_encoded_mp3"
  }
}
```

## Setup Instructions

### 1. Install Dependencies

**Frontend:**
```bash
cd peditrackv2
npx expo install expo-av expo-file-system
```

**Backend:**
```bash
cd services/peditrack-chat-service
npm install
```

### 2. Environment Configuration

Ensure your `.env` file in `services/peditrack-chat-service` has:
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
PORT=3001
```

### 3. Start the Services

**Backend:**
```bash
cd services/peditrack-chat-service
npm run dev
```

**Frontend:**
```bash
cd peditrackv2
npm start
```

## Usage

1. Open the app and navigate to the AI screen
2. Tap on "Voice" mode
3. Grant microphone permissions when prompted
4. Tap the microphone button to start recording
5. Speak your question
6. Tap the stop button when finished
7. Wait for the AI to process and respond
8. Listen to the audio response

## Features

- **Real-time Recording**: Visual feedback while recording
- **Transcription Display**: See what you said after recording
- **Audio Playback**: Hear the AI's response
- **Conversation Context**: Maintains conversation history
- **Error Handling**: Graceful error messages and recovery

## Technical Details

### Audio Formats Supported
- Input: m4a, mp3, wav, webm, ogg
- Output: mp3 (from OpenAI TTS)
- Max file size: 25MB (Whisper API limit)

### TTS Voices Available
- `alloy`: Neutral and balanced
- `echo`: Male voice
- `fable`: British accent
- `onyx`: Deep male voice
- `nova`: Female voice (default)
- `shimmer`: Soft female voice

### Permissions Required
- **iOS**: Microphone access
- **Android**: RECORD_AUDIO permission

## Troubleshooting

### "Failed to start recording"
- Check microphone permissions
- Ensure no other app is using the microphone

### "Failed to process your message"
- Verify the chat service is running on port 3001
- Check your network connection
- Ensure OPENAI_API_KEY is set correctly

### "Connection Error"
- Update the IP address in `voiceService.ts` to match your computer's IP
- For Android Emulator: use `10.0.2.2`
- For Physical Device: use your computer's local IP (e.g., `192.168.1.2`)

## Future Enhancements

- [ ] Streaming audio responses
- [ ] Voice activity detection (auto-stop recording)
- [ ] Multiple language support
- [ ] Voice customization settings
- [ ] Offline mode with local STT/TTS
- [ ] Voice command shortcuts

## Dependencies

### Frontend
- `expo-av`: ^14.0.0 - Audio recording and playback
- `expo-file-system`: ^17.0.0 - File system operations

### Backend
- `openai`: ^4.20.1 - OpenAI API client
- `multer`: ^1.4.5-lts.1 - File upload handling

## API Rate Limits

OpenAI API rate limits apply:
- Whisper: 50 requests per minute
- TTS: 50 requests per minute
- GPT: Depends on your plan

## Cost Considerations

- Whisper: $0.006 per minute of audio
- TTS: $15.00 per 1M characters
- GPT-3.5-turbo: $0.50 per 1M tokens

## Security Notes

- Audio files are temporarily stored and deleted after processing
- Conversations are stored in memory (not persisted)
- Ensure HTTPS in production
- Validate and sanitize all inputs
- Implement rate limiting for production use
