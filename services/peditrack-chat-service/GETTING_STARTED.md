# 🚀 Getting Started Checklist

Follow this checklist to get your PediTrack Chat Service up and running!

## ☑️ Pre-requisites

- [ ] Node.js installed (v14 or higher)
  - Check: Run `node --version` in terminal
  - Download: https://nodejs.org/

- [ ] npm installed (comes with Node.js)
  - Check: Run `npm --version` in terminal

- [ ] Code editor installed (VS Code recommended)
  - Download: https://code.visualstudio.com/

## ☑️ Step 1: Get OpenAI API Key

- [ ] Go to https://platform.openai.com/api-keys
- [ ] Sign up or log in to your account
- [ ] Click "Create new secret key"
- [ ] Copy the API key (starts with `sk-...`)
- [ ] Save it somewhere safe (you'll need it in the next step)

**Note:** You may need to add credits to your OpenAI account to use the API.

## ☑️ Step 2: Install Dependencies

- [ ] Open terminal/command prompt
- [ ] Navigate to the service directory:
  ```bash
  cd services/peditrack-chat-service
  ```
- [ ] Install dependencies:
  ```bash
  npm install
  ```
- [ ] Wait for installation to complete (should see "added X packages")

## ☑️ Step 3: Configure Environment

- [ ] Copy `.env.example` to `.env`:
  - **Windows:** `copy .env.example .env`
  - **Mac/Linux:** `cp .env.example .env`

- [ ] Open `.env` file in your code editor

- [ ] Replace `your_openai_api_key_here` with your actual API key:
  ```env
  OPENAI_API_KEY=sk-your-actual-key-here
  ```

- [ ] (Optional) Adjust other settings if needed:
  - `PORT` - Change if 3001 is already in use
  - `OPENAI_MODEL` - Change model (gpt-3.5-turbo, gpt-4, etc.)
  - `MAX_TOKENS` - Adjust response length
  - `SYSTEM_PROMPT` - Customize AI behavior

- [ ] Save the `.env` file

## ☑️ Step 4: Start the Service

- [ ] In the terminal, run:
  ```bash
  npm run dev
  ```

- [ ] You should see:
  ```
  🚀 PediTrack Chat Service running on port 3001
  📝 Environment: development
  🤖 LLM Provider: OpenAI (gpt-3.5-turbo)
  
  ✅ Server is ready to accept requests!
  ```

- [ ] If you see this, the service is running! ✅

## ☑️ Step 5: Test the Service

### Option A: Using the Test Script (Recommended)

- [ ] Open a NEW terminal window (keep the service running in the first one)
- [ ] Navigate to the service directory:
  ```bash
  cd services/peditrack-chat-service
  ```
- [ ] Run the test script:
  ```bash
  node test.js
  ```
- [ ] All tests should pass ✅

### Option B: Manual Testing with cURL

- [ ] Test health check:
  ```bash
  curl http://localhost:3001/api/health
  ```
  Should return: `{"success":true,...}`

- [ ] Test sending a message:
  ```bash
  curl -X POST http://localhost:3001/api/chat/message \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Hello!\"}"
  ```
  Should return an AI response ✅

### Option C: Using a Browser

- [ ] Open browser and go to: http://localhost:3001/api/health
- [ ] You should see JSON response with `"success": true`

## ☑️ Step 6: Test with React Native App

- [ ] Keep the chat service running
- [ ] Open a NEW terminal
- [ ] Navigate to the React Native app:
  ```bash
  cd peditrackv2
  ```
- [ ] Start the React Native app:
  ```bash
  npm start
  ```
- [ ] Open the app in your emulator or device
- [ ] Navigate to the Chat screen
- [ ] Send a message
- [ ] You should receive an AI response! 🎉

## ☑️ Step 7: Verify Everything Works

- [ ] Chat service is running without errors
- [ ] Test script passes all tests
- [ ] React Native app can send messages
- [ ] AI responses are received in the app
- [ ] Messages are displayed correctly
- [ ] No error alerts in the app

## 🎉 Success!

If all checkboxes are checked, congratulations! Your PediTrack Chat Service is fully operational!

## 🔧 Troubleshooting

### ❌ Service won't start

**Problem:** Port 3001 already in use
- **Solution:** Change `PORT=3002` in `.env` file
- **Remember:** Update the port in `peditrackv2/src/services/chatService.ts` too

**Problem:** Module not found errors
- **Solution:** Run `npm install` again

**Problem:** Node version error
- **Solution:** Update Node.js to v14 or higher

### ❌ API Key Errors

**Problem:** "OpenAI API key not configured"
- **Solution:** Check that `.env` file exists and has the correct API key
- **Verify:** API key should start with `sk-`

**Problem:** "Invalid API key"
- **Solution:** Get a new API key from OpenAI
- **Check:** Make sure you copied the entire key

**Problem:** "Insufficient quota"
- **Solution:** Add credits to your OpenAI account

### ❌ Connection Errors from Mobile App

**Problem:** "Unable to connect to the chat service"
- **Solution 1:** Make sure the chat service is running
- **Solution 2:** Check the API URL in `chatService.ts`
- **Solution 3:** For physical devices, use your computer's IP instead of localhost

**Example for physical device:**
```typescript
// In peditrackv2/src/services/chatService.ts
const API_BASE_URL = 'http://192.168.1.100:3001/api';
```

**Find your IP:**
- **Windows:** Run `ipconfig` in terminal
- **Mac/Linux:** Run `ifconfig` or `ip addr`

### ❌ Test Script Fails

**Problem:** Tests fail with connection errors
- **Solution:** Make sure the service is running first (`npm run dev`)

**Problem:** Tests fail with API key errors
- **Solution:** Check your `.env` file has the correct API key

## 📚 Next Steps

Now that everything is working:

- [ ] Read `README.md` for detailed API documentation
- [ ] Check `DOCUMENTATION.md` for technical details
- [ ] Review `PROJECT_SUMMARY.md` for an overview
- [ ] Customize the `SYSTEM_PROMPT` in `.env` for your use case
- [ ] (Optional) Set up other LLM providers (Anthropic, Google, etc.)
- [ ] (Optional) Deploy to a cloud service for production use

## 🆘 Need Help?

1. Check the error message in the terminal
2. Review the documentation files
3. Make sure all prerequisites are met
4. Verify your API key is correct
5. Check that the service is running
6. Look for typos in configuration files

## 📝 Quick Reference

**Start Service:**
```bash
cd services/peditrack-chat-service
npm run dev
```

**Run Tests:**
```bash
cd services/peditrack-chat-service
node test.js
```

**Start React Native App:**
```bash
cd peditrackv2
npm start
```

**Service URL:** http://localhost:3001
**Health Check:** http://localhost:3001/api/health

---

**Good luck! 🚀**
