/**
 * Test script for PediTrack Chat Service
 * Run this to verify the service is working correctly
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function testHealthCheck() {
    log('\n📋 Testing Health Check...', colors.cyan);
    try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        if (response.data.success) {
            log('✅ Health check passed!', colors.green);
            log(`   Uptime: ${response.data.uptime.toFixed(2)}s`);
            return true;
        }
        return false;
    } catch (error) {
        log('❌ Health check failed!', colors.red);
        log(`   Error: ${error.message}`, colors.red);
        return false;
    }
}

async function testDetailedStatus() {
    log('\n📊 Testing Detailed Status...', colors.cyan);
    try {
        const response = await axios.get(`${API_BASE_URL}/health/status`);
        if (response.data.success) {
            log('✅ Status check passed!', colors.green);
            log(`   Service: ${response.data.service}`);
            log(`   Version: ${response.data.version}`);
            log(`   Environment: ${response.data.environment}`);
            
            const providers = response.data.llmProviders;
            log('\n   LLM Providers:');
            log(`   - OpenAI: ${providers.openai.configured ? '✅ Configured' : '❌ Not configured'} (${providers.openai.model})`);
            log(`   - Anthropic: ${providers.anthropic.configured ? '✅ Configured' : '❌ Not configured'} (${providers.anthropic.model})`);
            log(`   - Google: ${providers.google.configured ? '✅ Configured' : '❌ Not configured'} (${providers.google.model})`);
            
            return true;
        }
        return false;
    } catch (error) {
        log('❌ Status check failed!', colors.red);
        log(`   Error: ${error.message}`, colors.red);
        return false;
    }
}

async function testSendMessage() {
    log('\n💬 Testing Send Message...', colors.cyan);
    try {
        const response = await axios.post(`${API_BASE_URL}/chat/message`, {
            message: 'Hello! Can you tell me about healthy eating for children?',
            provider: 'openai'
        });
        
        if (response.data.success) {
            log('✅ Message sent successfully!', colors.green);
            log(`   Conversation ID: ${response.data.data.conversationId}`);
            log(`   Message ID: ${response.data.data.message.id}`);
            log(`   Provider: ${response.data.data.provider}`);
            log(`\n   AI Response:`, colors.blue);
            log(`   "${response.data.data.message.content.substring(0, 150)}..."`, colors.blue);
            
            return response.data.data.conversationId;
        }
        return null;
    } catch (error) {
        log('❌ Send message failed!', colors.red);
        if (error.response?.data) {
            log(`   Error: ${error.response.data.error?.message || error.message}`, colors.red);
        } else {
            log(`   Error: ${error.message}`, colors.red);
        }
        
        if (error.message.includes('ECONNREFUSED')) {
            log('\n⚠️  Make sure the service is running!', colors.yellow);
            log('   Run: npm run dev', colors.yellow);
        }
        
        return null;
    }
}

async function testGetHistory(conversationId) {
    if (!conversationId) {
        log('\n⏭️  Skipping history test (no conversation ID)', colors.yellow);
        return false;
    }

    log('\n📜 Testing Get History...', colors.cyan);
    try {
        const response = await axios.get(`${API_BASE_URL}/chat/history/${conversationId}`);
        
        if (response.data.success) {
            log('✅ History retrieved successfully!', colors.green);
            log(`   Message count: ${response.data.data.count}`);
            return true;
        }
        return false;
    } catch (error) {
        log('❌ Get history failed!', colors.red);
        log(`   Error: ${error.message}`, colors.red);
        return false;
    }
}

async function testClearHistory(conversationId) {
    if (!conversationId) {
        log('\n⏭️  Skipping clear history test (no conversation ID)', colors.yellow);
        return false;
    }

    log('\n🗑️  Testing Clear History...', colors.cyan);
    try {
        const response = await axios.delete(`${API_BASE_URL}/chat/history/${conversationId}`);
        
        if (response.data.success) {
            log('✅ History cleared successfully!', colors.green);
            return true;
        }
        return false;
    } catch (error) {
        log('❌ Clear history failed!', colors.red);
        log(`   Error: ${error.message}`, colors.red);
        return false;
    }
}

async function runAllTests() {
    log('\n' + '='.repeat(60), colors.cyan);
    log('🧪 PediTrack Chat Service - Test Suite', colors.cyan);
    log('='.repeat(60), colors.cyan);

    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    // Test 1: Health Check
    results.total++;
    if (await testHealthCheck()) {
        results.passed++;
    } else {
        results.failed++;
        log('\n⚠️  Service might not be running. Stopping tests.', colors.yellow);
        printResults(results);
        return;
    }

    // Test 2: Detailed Status
    results.total++;
    if (await testDetailedStatus()) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 3: Send Message
    results.total++;
    const conversationId = await testSendMessage();
    if (conversationId) {
        results.passed++;
    } else {
        results.failed++;
        log('\n⚠️  Cannot continue with conversation tests.', colors.yellow);
        printResults(results);
        return;
    }

    // Test 4: Get History
    results.total++;
    if (await testGetHistory(conversationId)) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 5: Clear History
    results.total++;
    if (await testClearHistory(conversationId)) {
        results.passed++;
    } else {
        results.failed++;
    }

    printResults(results);
}

function printResults(results) {
    log('\n' + '='.repeat(60), colors.cyan);
    log('📊 Test Results', colors.cyan);
    log('='.repeat(60), colors.cyan);
    log(`Total Tests: ${results.total}`);
    log(`Passed: ${results.passed}`, colors.green);
    log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.green);
    
    if (results.failed === 0) {
        log('\n🎉 All tests passed!', colors.green);
        log('\n✅ Your chat service is working correctly!', colors.green);
        log('   You can now integrate it with your React Native app.', colors.green);
    } else {
        log('\n⚠️  Some tests failed. Please check the errors above.', colors.yellow);
    }
    
    log('\n' + '='.repeat(60), colors.cyan);
}

// Run tests
runAllTests().catch(error => {
    log('\n❌ Test suite failed with error:', colors.red);
    log(error.message, colors.red);
    process.exit(1);
});
