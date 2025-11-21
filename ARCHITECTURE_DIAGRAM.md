# Chat Screen Feature Architecture

## UI Component Layout

```
┌─────────────────────────────────────────────────┐
│  [TopBar with Back Button & Profile]           │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  User Message (Right Aligned)            │  │
│  │  [Image if attached]                     │  │
│  │  "Message text here"                     │  │
│  │  🕐 12:30 PM                             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  🤖 Assistant (Left Aligned)             │  │
│  │  "AI response here..."                   │  │
│  │  🕐 12:31 PM                             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  🎤 [Voice Message]                      │  │
│  │  "Transcribed voice text"                │  │
│  │  🕐 12:32 PM                             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│  [Image Preview Area]                           │
│  ┌────────────┐                                 │
│  │  [Image]  ❌│ (removable preview)            │
│  └────────────┘                                 │
├─────────────────────────────────────────────────┤
│  Input Area:                                    │
│  [📷] [___Type message...__________] [▶️|🎤]   │
│  Image  Text Input Field        Send or Mic    │
└─────────────────────────────────────────────────┘
```

## Feature Flow Diagrams

### 1. Text + Image Flow

```
User Action               UI State                Backend Action
─────────────────────────────────────────────────────────────────
Tap [📷] button    →    Image picker opens
Select image       →    Preview shows          
                        Send button appears     
                        Placeholder: "Add caption..."
Type caption       →    Text entered
(optional)
Tap [▶️] button   →    Loading indicator      → POST /message-with-image
                        Message added to UI        (multipart/form-data)
                                               → Process image + text
                        Typing indicator...    → Generate AI response
                                               → Add to conversation history
                        AI response shown      ← Return response
```

### 2. Voice Message Flow

```
User Action               UI State                Backend Action
─────────────────────────────────────────────────────────────────
Input is empty     →    [🎤] button visible
Tap [🎤]          →    Recording starts
                        Button turns RED 🔴
                        Background highlight
Speak message      →    Recording in progress
Tap [🔴] again    →    Recording stops        → POST /voice/message
                        Processing...              (multipart/form-data)
                                               → Transcribe with Whisper
                        Message with 🎤 icon   → Get AI response
                        Shows transcription    → Add to conversation
                        Typing indicator...    
                        AI response shown      ← Return response
```

### 3. Button Logic Flow

```
┌─────────────────────────────────────────────────┐
│            Input Field State                    │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   Has Content?            Empty Input?
   (text OR image)
        │                       │
        ▼                       ▼
   Show [▶️] Send          Show [🎤] Mic
   Button (Blue)          Button (Blue/Red)
        │                       │
        │                       │
   ┌────┴────┐            ┌────┴─────┐
   ▼         ▼            ▼          ▼
  Text     Image      Not          Recording
  Only     Only    Recording        Active
           or Both                  (RED 🔴)
```

## Data Flow Architecture

### Frontend → Backend Communication

```
┌────────────────────────────────────────────────┐
│         React Native App (Frontend)            │
│                                                │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ ChatScreen   │  │  Services    │          │
│  │              │  │              │          │
│  │ • UI State   │→│ chatService  │          │
│  │ • Messages   │ │ voiceService │          │
│  │ • Recording  │ │              │          │
│  │ • Images     │←│ FormData     │          │
│  └──────────────┘  └──────────────┘          │
│                           │                   │
└───────────────────────────┼───────────────────┘
                            │
                     HTTP Requests
                  (REST API with JSON
                   or multipart/form-data)
                            │
                            ▼
┌────────────────────────────────────────────────┐
│       Node.js Backend (Chat Service)           │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  Routes  │→│Controllers│→│  Services   │ │
│  │          │ │           │ │             │ │
│  │ • chat   │ │ • chat    │ │ • llm       │ │
│  │ • voice  │ │ • voice   │ │ • voice     │ │
│  │ • multer │ │ • upload  │ │ • openai    │ │
│  └──────────┘  └──────────┘  └─────────────┘ │
│                      │                        │
│                      ▼                        │
│              ┌──────────────┐                 │
│              │Conversation  │                 │
│              │Store (Memory)│                 │
│              └──────────────┘                 │
│                      │                        │
└──────────────────────┼────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  OpenAI API     │
              │                 │
              │ • GPT-4         │
              │ • Whisper STT   │
              │ • TTS           │
              └─────────────────┘
```

## Message Types

### 1. Text Message Object
```typescript
{
    id: "uuid",
    text: "Hello, how are you?",
    sender: "user",
    timestamp: "12:30 PM",
    imageUri: undefined,
    isVoice: false
}
```

### 2. Image Message Object
```typescript
{
    id: "uuid",
    text: "[Image: Caption here]",
    sender: "user",
    timestamp: "12:31 PM",
    imageUri: "file:///path/to/image.jpg",
    isVoice: false
}
```

### 3. Voice Message Object
```typescript
{
    id: "uuid",
    text: "Transcribed speech text",
    sender: "user",
    timestamp: "12:32 PM",
    imageUri: undefined,
    isVoice: true
}
```

### 4. AI Response Object
```typescript
{
    id: "uuid",
    text: "AI assistant response",
    sender: "assistant",
    timestamp: "12:33 PM",
    imageUri: undefined,
    isVoice: false
}
```

## API Endpoints Summary

### Text Chat
```
POST /api/chat/message
Content-Type: application/json

Request:
{
    "message": "string",
    "conversationId": "uuid (optional)",
    "provider": "openai (default)"
}

Response:
{
    "success": true,
    "data": {
        "conversationId": "uuid",
        "message": {
            "id": "uuid",
            "role": "assistant",
            "content": "response text",
            "timestamp": "ISO date"
        },
        "provider": "openai"
    }
}
```

### Image Chat
```
POST /api/chat/message-with-image
Content-Type: multipart/form-data

Request:
- image: File (jpeg, png, gif, webp)
- message: String (optional)
- conversationId: String (optional)
- provider: String (optional)

Response: (same as text chat)
```

### Voice Chat
```
POST /api/voice/message
Content-Type: multipart/form-data

Request:
- audio: File (m4a, mp3, wav, etc.)
- conversationId: String (optional)
- voice: String (alloy, echo, fable, onyx, nova, shimmer)
- provider: String (optional)

Response:
{
    "success": true,
    "data": {
        "conversationId": "uuid",
        "messageId": "uuid",
        "transcription": "what user said",
        "responseText": "AI response",
        "audioResponse": "base64 encoded mp3"
    }
}
```

## State Management

### ChatScreen State Variables

```typescript
// Message history
const [messages, setMessages] = useState<Message[]>([]);

// Input state
const [inputText, setInputText] = useState('');

// Conversation tracking
const [conversationId, setConversationId] = useState<string>();

// Loading states
const [isTyping, setIsTyping] = useState(false);

// Voice recording state
const [isRecording, setIsRecording] = useState(false);
const [recording, setRecording] = useState<Audio.Recording | null>(null);

// Image state
const [selectedImage, setSelectedImage] = useState<string | null>(null);

// Scroll reference
const scrollViewRef = useRef<ScrollView>(null);
```

## Permission Requirements

### iOS & Android Permissions

```
┌────────────────────────────────────────┐
│         Required Permissions           │
├────────────────────────────────────────┤
│                                        │
│  🎤 Microphone Access                  │
│     → Voice recording                  │
│     → Requested on first use           │
│                                        │
│  📷 Photo Library Access               │
│     → Image selection                  │
│     → Requested on first use           │
│                                        │
│  🌐 Network Access                     │
│     → API communication                │
│     → Granted by default               │
│                                        │
└────────────────────────────────────────┘
```

## File Size Limits

```
┌────────────────────────────────────────┐
│         File Size Constraints          │
├────────────────────────────────────────┤
│                                        │
│  Images:        10 MB (backend limit)  │
│  Voice Audio:   25 MB (Whisper limit)  │
│  Text:          1000 chars (frontend)  │
│                                        │
└────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Try Network    │
│  Connection     │
└────┬───────┬────┘
     │       │
 Success   Fail
     │       │
     ▼       ▼
  Update   Show Alert
   UI      Add Error
           Message
           to Chat
```

## Future Enhancement Ideas

```
┌────────────────────────────────────────────┐
│         Potential Future Features          │
├────────────────────────────────────────────┤
│                                            │
│  1. 🖼️  GPT-4 Vision Integration           │
│     → Actual image analysis                │
│                                            │
│  2. 📸 Multiple Image Selection            │
│     → Send multiple images at once         │
│                                            │
│  3. 🔊 Voice Playback                      │
│     → Play back recorded voice             │
│                                            │
│  4. ✂️  Image Editing                       │
│     → Crop, rotate, annotate               │
│                                            │
│  5. 📎 File Attachments                    │
│     → PDFs, documents, etc.                │
│                                            │
│  6. 🗜️  Image Compression                  │
│     → Reduce file size before upload       │
│                                            │
│  7. 💾 Message History Persistence         │
│     → Save to local database               │
│                                            │
│  8. 🔍 Image Text Recognition (OCR)        │
│     → Extract text from images             │
│                                            │
└────────────────────────────────────────────┘
```

---

This architecture maintains clean separation of concerns, preserves existing functionality, and provides a solid foundation for future enhancements.
