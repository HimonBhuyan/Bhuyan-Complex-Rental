#!/usr/bin/env node

/**
 * Debug Configuration Script
 * Checks environment variables and API configuration
 */

console.log('🔍 Debug Configuration Check\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('  VITE_API_URL:', process.env.VITE_API_URL || 'undefined');
console.log('  VITE_WS_URL:', process.env.VITE_WS_URL || 'undefined');

// Check .env files
const fs = require('fs');
const path = require('path');

console.log('\n📁 Environment Files:');
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
for (const file of envFiles) {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  
  if (exists) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').filter(line => 
      line.trim() && !line.startsWith('#') && line.includes('=')
    );
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && key.includes('VITE_')) {
        console.log(`    ${key.trim()}=${value ? value.trim() : 'empty'}`);
      }
    });
  }
}

// Test API connection
console.log('\n🌐 Testing API Connection:');
const https = require('https');
const http = require('http');

const testUrl = 'https://bhuyan-complex-rental-2.onrender.com/health';
console.log(`  Testing: ${testUrl}`);

const client = testUrl.startsWith('https') ? https : http;
const request = client.get(testUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`  Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log('  Response:', json);
        console.log('  ✅ API is responding correctly');
      } catch (e) {
        console.log('  ❌ Invalid JSON response');
      }
    } else {
      console.log('  ❌ API returned error status');
    }
  });
});

request.on('error', (error) => {
  console.log(`  ❌ Connection failed: ${error.message}`);
});

request.setTimeout(5000, () => {
  console.log('  ❌ Connection timeout');
  request.destroy();
});

// Test WebSocket (quick test)
setTimeout(() => {
  console.log('\n🔗 Testing WebSocket:');
  const WebSocket = require('ws');
  const wsUrl = 'wss://bhuyan-complex-rental-2.onrender.com';
  console.log(`  Testing: ${wsUrl}`);
  
  const ws = new WebSocket(wsUrl);
  const timeout = setTimeout(() => {
    console.log('  ❌ WebSocket connection timeout');
    ws.terminate();
  }, 5000);
  
  ws.on('open', () => {
    clearTimeout(timeout);
    console.log('  ✅ WebSocket connected successfully');
    ws.close();
  });
  
  ws.on('error', (error) => {
    clearTimeout(timeout);
    console.log(`  ❌ WebSocket error: ${error.message}`);
  });
}, 2000);