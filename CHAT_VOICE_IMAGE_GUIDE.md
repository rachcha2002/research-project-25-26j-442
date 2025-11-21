# Chat Voice & Image Feature Guide

## Overview
This guide explains how to add voice messaging and image upload capabilities to the ChatScreen.

## Features to Add

### 1. Voice Messages
- **Tap and hold** the microphone button to record
- **Release** to send the voice message
- Voice messages are transcribed and sent to the AI
- AI response is shown as text in the chat

### 2. Image Upload
- **Tap** the image button to select a photo from gallery
- Selected image is shown as a preview
- Send image with optional text caption
- AI receives text description of the image

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd peditrackv2
npx expo install expo-image-picker  # ✅ Already installed
```

### Step 2: Update ChatScreen.tsx

Add these imports:
```typescript
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { sendVoiceMessage } from '@/services/voiceService';
import { Image } from 'react-native';
```

Add to Message interface:
```typescript
interface Message {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: string;
    imageUri?: string;      // NEW
    isVoice?: boolean;      // NEW
}
```

Add state variables:
```typescript
const [recording, setRecording] = useState<Audio.Recording | null>(null);
const [isRecording, setIsRecording] = useState(false);
const [selectedImage, setSelectedImage] = useState<string | null>(null);
```

### Step 3: Add Handler Functions

**Voice Recording:**
```typescript
const handleVoicePress = async () => {
    if (isRecording) {
        // Stop and send
        await recording?.stopAndUnloadAsync();
        const uri = recording?.getURI();
        if (uri) {
            const response = await sendVoiceMessage(uri, conversationId);
            // Add transcribed message to chat
        }
    } else {
        // Start recording
        const { recording: newRecording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
        setIsRecording(true);
    }
};
```

**Image Picker:**
```typescript
const handleImagePress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
    });
    
    if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
    }
};
```

### Step 4: Update UI

**Update microphone button:**
```tsx
<TouchableOpacity 
    style={styles.iconButton}
    onPress={handleVoicePress}
>
    <Ionicons 
        name={isRecording ? "stop-circle" : "mic-outline"} 
        size={28} 
        color={isRecording ? "#EF4444" : Colors.primary.DEFAULT} 
    />
</TouchableOpacity>
```

**Update image button:**
```tsx
<TouchableOpacity 
    style={styles.iconButton}
    onPress={handleImagePress}
>
    <Ionicons name="image-outline" size={28} color={Colors.inactive} />
</TouchableOpacity>
```

**Show images in messages:**
```tsx
{message.imageUri && (
    <Image 
        source={{ uri: message.imageUri }} 
        style={{ width: 200, height: 150, borderRadius: 12, marginBottom: 8 }}
    />
)}
```

**Show voice indicator:**
```tsx
<Text style={styles.userMessageText}>
    {message.isVoice && '🎤 '}
    {message.text}
</Text>
```

## Usage

### Send Voice Message:
1. Tap the microphone button
2. Speak your message
3. Tap the stop button
4. Message is transcribed and sent automatically

### Send Image:
1. Tap the image button
2. Select a photo from your gallery
3. Optionally type a caption
4. Tap send

## Notes

- Voice messages require microphone permissions
- Images require photo library permissions
- Permissions are requested automatically on first use
- Voice messages are transcribed using OpenAI Whisper
- Image analysis can be added later with GPT-4 Vision API

## Future Enhancements

- [ ] Camera integration for taking photos
- [ ] Image analysis with GPT-4 Vision
- [ ] Voice playback of AI responses
- [ ] Multiple image upload
- [ ] Voice activity detection
- [ ] Emoji picker integration
