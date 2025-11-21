# Testing Guide for Chat Features

## Prerequisites
1. Ensure the chat service is running:
   ```bash
   cd services/peditrack-chat-service
   npm run dev
   ```

2. Verify your OpenAI API key is set in `.env`:
   ```
   OPENAI_API_KEY=your-key-here
   ```

3. Update the API URL in the React Native app if needed:
   - File: `peditrackv2/src/services/chatService.ts`
   - File: `peditrackv2/src/services/voiceService.ts`
   - Change IP address to match your development machine

## Test Scenarios

### ✅ Test 1: Text-Only Message (Existing Feature)
**Steps:**
1. Open the Chat screen
2. Type "Hello, how are you?"
3. Tap the **Send button** (blue arrow)
4. ✓ Message appears in chat
5. ✓ AI responds with text
6. ✓ Typing indicator shows during response

**Expected Result:** Normal text chat works as before

---

### ✅ Test 2: Image Without Caption
**Steps:**
1. Tap the **image icon** (left side)
2. Select an image from gallery
3. ✓ Image preview appears at bottom
4. ✓ Placeholder changes to "Add a caption (optional)..."
5. Do NOT type any text
6. Tap **Send button**
7. ✓ Message shows with image
8. ✓ Text shows "[Image attached]"
9. ✓ AI responds acknowledging the image

**Expected Result:** Image sent successfully, AI acknowledges image

---

### ✅ Test 3: Image With Caption
**Steps:**
1. Tap **image icon**
2. Select an image
3. Type caption: "What do you think of this?"
4. ✓ Preview shows image
5. ✓ Send button is visible
6. Tap **Send button**
7. ✓ Message shows image + caption
8. ✓ Text shows "[Image: What do you think of this?]"
9. ✓ AI responds appropriately

**Expected Result:** Image and text sent together

---

### ✅ Test 4: Remove Image Before Sending
**Steps:**
1. Tap **image icon**
2. Select an image
3. ✓ Preview appears
4. Tap the **X button** on preview
5. ✓ Image is removed
6. ✓ Placeholder returns to "Type a message..."
7. ✓ Mic button reappears (if no text)

**Expected Result:** Image can be removed before sending

---

### ✅ Test 5: Voice Message
**Steps:**
1. Ensure input field is EMPTY
2. ✓ Microphone button is visible (blue)
3. Tap **microphone button**
4. ✓ Button turns RED
5. ✓ Background changes to indicate recording
6. Speak: "This is a voice test message"
7. Tap **microphone button** again to stop
8. ✓ Recording stops
9. ✓ Message appears with mic icon
10. ✓ Text shows transcription
11. ✓ AI responds to transcribed text

**Expected Result:** Voice recorded, transcribed, and sent

---

### ✅ Test 6: UI Button Switching
**Steps:**
1. Start with empty input
2. ✓ Mic button visible
3. Type "Hello"
4. ✓ Send button appears (mic disappears)
5. Delete text
6. ✓ Mic button returns
7. Tap image icon
8. Select image
9. ✓ Send button visible (even with empty text)
10. Remove image
11. ✓ Mic button returns

**Expected Result:** Smart switching between send and mic buttons

---

### ✅ Test 7: Image Icon Highlight
**Steps:**
1. Tap image icon
2. Select an image
3. ✓ Image icon changes to highlighted color (blue)
4. Remove image
5. ✓ Image icon returns to inactive color (gray)

**Expected Result:** Visual feedback on image selection

---

### ✅ Test 8: Conversation History
**Steps:**
1. Send a text message: "Remember this: blue sky"
2. ✓ AI responds
3. Send an image with caption: "Related to what I said"
4. ✓ AI responds
5. Send voice message: "Do you remember what I said?"
6. ✓ AI response should reference earlier messages

**Expected Result:** Conversation context is maintained across message types

---

### ✅ Test 9: Multiple Messages in Sequence
**Steps:**
1. Send text: "Hello"
2. Wait for response
3. Send image (no caption)
4. Wait for response  
5. Send voice: "Thank you"
6. Wait for response
7. Send text + image together
8. ✓ All messages display correctly
9. ✓ All responses are appropriate

**Expected Result:** Mixed message types work seamlessly

---

### ✅ Test 10: Error Handling
**Steps:**
1. Stop the backend service
2. Try to send a text message
3. ✓ Error alert appears
4. ✓ Error message added to chat
5. Restart backend
6. Send message again
7. ✓ Works normally

**Expected Result:** Graceful error handling and recovery

---

## Common Issues & Solutions

### Issue: "Connection Error" alert
**Solution:** 
- Check backend is running: `npm run dev`
- Verify IP address in `chatService.ts` and `voiceService.ts`
- Check firewall isn't blocking port 3001

### Issue: Voice recording doesn't work
**Solution:**
- Grant microphone permission when prompted
- Check `expo-av` is installed: `npx expo install expo-av`
- Verify audio permissions in app settings

### Issue: Image picker doesn't open
**Solution:**
- Grant photo library permission when prompted
- Check `expo-image-picker` is installed
- Verify gallery permissions in app settings

### Issue: Image too large error
**Solution:**
- Backend has 10MB limit for images
- Try selecting a smaller image
- Future enhancement: Add image compression

### Issue: Send button doesn't appear
**Solution:**
- Make sure either text OR image is present
- Check input field has actual text (not just whitespace)
- Try reloading the app

### Issue: Voice transcription fails
**Solution:**
- Check OpenAI API key is valid
- Verify internet connection
- Try shorter voice messages (under 1 minute)
- Check audio quality (not too quiet)

## API Testing (Optional)

### Test with cURL - Image Upload

```bash
# Test image upload endpoint
curl -X POST http://localhost:3001/api/chat/message-with-image \
  -F "image=@/path/to/test-image.jpg" \
  -F "message=What is in this image?" \
  -F "provider=openai"
```

### Test with cURL - Text Message

```bash
# Test text message endpoint
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, this is a test",
    "provider": "openai"
  }'
```

### Test with cURL - Voice Message

```bash
# Test voice message endpoint
curl -X POST http://localhost:3001/api/voice/message \
  -F "audio=@/path/to/test-audio.m4a" \
  -F "voice=nova" \
  -F "provider=openai"
```

## Performance Checklist

- [ ] Messages send within 2-3 seconds
- [ ] Voice transcription completes within 5 seconds
- [ ] Image uploads complete within 3 seconds
- [ ] UI remains responsive during operations
- [ ] No memory leaks after multiple messages
- [ ] Scrolling is smooth with images
- [ ] Keyboard behavior is correct

## Acceptance Criteria

✅ All 10 test scenarios pass  
✅ No existing functionality is broken  
✅ UI is intuitive and responsive  
✅ Error messages are clear and helpful  
✅ Conversation history is maintained  
✅ Permissions are requested properly  
✅ Loading states are visible  
✅ Backend validates inputs correctly  

## Next Steps

After testing is complete:
1. Document any bugs found
2. Test on both iOS and Android
3. Test on physical devices (not just emulator)
4. Test with poor network conditions
5. Test with different image formats
6. Test with very long voice recordings
7. Consider adding analytics/logging
8. Plan for future enhancements

---

**Happy Testing! 🎉**
