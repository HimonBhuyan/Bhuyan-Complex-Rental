#!/usr/bin/env node

/**
 * WebSocket Connection Test for Render Backend
 * Tests WebSocket connectivity to the live backend
 */

const WebSocket = require('ws');

const WS_URL = 'wss://bhuyan-complex-rental-2.onrender.com';

console.log('🧪 Testing WebSocket Connection to Render Backend');
console.log('📡 Connecting to:', WS_URL);
console.log('⏱️  Timeout: 10 seconds\n');

const ws = new WebSocket(WS_URL);
let isConnected = false;

// Set timeout
const timeout = setTimeout(() => {
  if (!isConnected) {
    console.log('❌ CONNECTION TIMEOUT: WebSocket failed to connect within 10 seconds');
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check if backend is running: https://bhuyan-complex-rental-2.onrender.com/health');
    console.log('2. Verify WebSocket server is enabled on backend');
    console.log('3. Check Render logs for WebSocket errors');
    ws.terminate();
    process.exit(1);
  }
}, 10000);

ws.on('open', () => {
  isConnected = true;
  clearTimeout(timeout);
  console.log('✅ WebSocket Connected Successfully!');
  console.log('🔗 URL:', WS_URL);
  console.log('📡 Ready State:', ws.readyState);
  
  // Test sending a message
  console.log('\n📤 Testing message sending...');
  ws.send(JSON.stringify({ type: 'GET_NOTIFICATIONS' }));
  
  // Close after test
  setTimeout(() => {
    console.log('\n🔌 Closing connection...');
    ws.close();
  }, 2000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📨 Received Message:', message.type);
    
    if (message.type === 'INITIAL_NOTIFICATIONS') {
      console.log('📋 Notifications Count:', message.notifications?.length || 0);
      console.log('✅ WebSocket communication working!');
    }
  } catch (error) {
    console.log('📨 Received Raw Data:', data.toString());
  }
});

ws.on('close', (code, reason) => {
  clearTimeout(timeout);
  console.log('🔌 WebSocket Closed');
  console.log('📊 Close Code:', code);
  console.log('📝 Reason:', reason.toString() || 'Normal closure');
  
  if (isConnected) {
    console.log('\n🎉 TEST PASSED: WebSocket connection is working!');
    console.log('\n✅ Your frontend should connect successfully to:');
    console.log('   API URL: https://bhuyan-complex-rental-2.onrender.com/api');
    console.log('   WebSocket URL:', WS_URL);
  }
  
  process.exit(0);
});

ws.on('error', (error) => {
  clearTimeout(timeout);
  console.log('❌ WebSocket Error:', error.message);
  console.log('\n🔍 Common Issues:');
  console.log('1. Backend not running - check Render dashboard');
  console.log('2. CORS issues - check backend CORS configuration');
  console.log('3. SSL/TLS issues - ensure using wss:// not ws://');
  console.log('4. Render service sleeping - make a HTTP request first');
  
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Test interrupted');
  if (ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  process.exit(0);
});