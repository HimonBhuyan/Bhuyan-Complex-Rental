// Test script for notification API
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testing Notification API...\n');
  
  try {
    // Test health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const health = await healthResponse.json();
    console.log('✅ Health check:', health);
    
    // Test getting notifications (should be empty initially)
    console.log('\n2. Testing get notifications...');
    const getResponse = await fetch(`${API_BASE}/notifications`);
    const getResult = await getResponse.json();
    console.log('✅ Get notifications:', getResult);
    
    // Test adding a notification
    console.log('\n3. Testing add notification...');
    const newNotification = {
      type: 'common',
      title: 'API Test Notification',
      message: 'This is a test notification from the API test script.',
      category: 'info',
      priority: 'medium'
    };
    
    const addResponse = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newNotification)
    });
    const addResult = await addResponse.json();
    console.log('✅ Add notification:', addResult);
    
    // Test getting notifications again (should have 1 now)
    console.log('\n4. Testing get notifications again...');
    const getResponse2 = await fetch(`${API_BASE}/notifications`);
    const getResult2 = await getResponse2.json();
    console.log('✅ Get notifications after add:', getResult2);
    
    console.log('\n🎉 All API tests passed!');
    console.log('\n💡 You can now:');
    console.log('   1. Run: start-both.cmd (to start both servers)');
    console.log('   2. Open: http://localhost:3000 (for the app)');
    console.log('   3. Test cross-browser notifications!');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    console.log('\n💡 Make sure the notification server is running:');
    console.log('   node notification-server.js');
  }
}

testAPI();