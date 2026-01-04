/**
 * Test script for image upload functionality
 * Run with: node test-image-upload.js
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testImageUpload() {
    console.log('🧪 Testing Image Upload Functionality\n');

    // Test 1: Health Check
    console.log('1️⃣  Testing health endpoint...');
    try {
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ Health check passed:', healthResponse.data);
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        console.log('⚠️  Make sure the server is running on port 3001');
        return;
    }

    // Test 2: Text-only message
    console.log('\n2️⃣  Testing text-only message...');
    try {
        const textResponse = await axios.post(`${API_BASE_URL}/chat/message`, {
            message: 'Hello, this is a test message',
            provider: 'openai'
        });
        console.log('✅ Text message sent successfully');
        console.log('   Response:', textResponse.data.message.substring(0, 100) + '...');
        console.log('   Conversation ID:', textResponse.data.conversationId);
    } catch (error) {
        console.error('❌ Text message failed:', error.response?.data || error.message);
    }

    // Test 3: Image upload (requires a test image)
    console.log('\n3️⃣  Testing image upload...');
    
    // Check if test image exists
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (!fs.existsSync(testImagePath)) {
        console.log('⚠️  No test image found at:', testImagePath);
        console.log('   To test image upload:');
        console.log('   1. Place a test image named "test-image.jpg" in the service directory');
        console.log('   2. Run this script again');
        console.log('\n   Skipping image upload test...');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('image', fs.createReadStream(testImagePath));
        formData.append('message', 'What do you see in this image?');
        formData.append('provider', 'openai');

        const imageResponse = await axios.post(
            `${API_BASE_URL}/chat/message-with-image`,
            formData,
            {
                headers: formData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        console.log('✅ Image upload successful');
        console.log('   Response:', imageResponse.data.message.substring(0, 150) + '...');
        console.log('   Model used:', imageResponse.data.metadata.model);
        console.log('   Tokens used:', imageResponse.data.metadata.usage?.total_tokens || 'N/A');
    } catch (error) {
        console.error('❌ Image upload failed:', error.response?.data || error.message);
        
        if (error.response?.status === 500) {
            console.log('\n   Possible causes:');
            console.log('   - OPENAI_API_KEY not set in .env');
            console.log('   - OPENAI_VISION_MODEL not configured');
            console.log('   - Invalid API key');
            console.log('   - OpenAI API is down');
        }
    }

    console.log('\n✨ Test completed!\n');
}

// Run tests
testImageUpload().catch(console.error);
