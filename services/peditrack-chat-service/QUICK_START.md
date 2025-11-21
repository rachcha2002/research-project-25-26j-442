# 🚀 Quick Start Guide - PediTrack Chat Service

## ⚡ Fast Track (5 Minutes)

### Step 1: Get OpenAI API Key
1. Go to: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy it (starts with `sk-`)

### Step 2: Setup Environment
```powershell
# Navigate to service directory
cd d:\research-project-25-26j-442\services\peditrack-chat-service

# Create .env file
Copy-Item .env.example .env

# Edit .env and add your API key:
# OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 3: Start the Service
```bash
npm run dev
```

Expected output:
```
🚀 PediTrack Chat Service running on port 3001
✅ Server is ready to accept requests!
```

### Step 4: Test It (New Terminal)
```bash
node test.js
```

Expected: All tests pass ✅

### Step 5: Start React Native App (New Terminal)
```bash
cd d:\research-project-25-26j-442\peditrackv2
npm start
```

### Step 6: Chat!
- Open app
- Go to Chat screen
- Send a message
- Get AI response! 🎉

---

## 📝 All Commands in Order

```powershell
# Terminal 1: Backend Service
cd d:\research-project-25-26j-442\services\peditrack-chat-service
Copy-Item .env.example .env
# Edit .env with your API key
npm run dev

# Terminal 2: Test (optional)
cd d:\research-project-25-26j-442\services\peditrack-chat-service
node test.js

# Terminal 3: React Native App
cd d:\research-project-25-26j-442\peditrackv2
npm start
# Press 'w' for web, 'a' for Android, 'i' for iOS
```

---

## 🔧 Troubleshooting

### "Module not found"
```bash
npm install
```

### "Port 3001 already in use"
Edit `.env` and change:
```env
PORT=3002
```

### "Invalid API key"
- Check your OpenAI API key is correct
- Make sure it starts with `sk-`
- Verify you have credits in your OpenAI account

### "Connection refused" from mobile app
- Make sure backend is running (`npm run dev`)
- Check the terminal shows "Server is ready"

---

## ✅ Success Checklist

- [ ] OpenAI API key obtained
- [ ] `.env` file created with API key
- [ ] Backend service running (Terminal 1)
- [ ] Tests pass (Terminal 2)
- [ ] React Native app running (Terminal 3)
- [ ] Can send messages and receive AI responses

---

## 🆘 Need Help?

Check these files:
- `GETTING_STARTED.md` - Detailed checklist
- `SETUP.md` - Setup instructions
- `CONNECTION_VERIFICATION.md` - Connection details
- `DOCUMENTATION.md` - Full technical docs

---

**That's it! You're ready to chat with AI! 🚀**
