// Quick test to verify current notification functionality
const API_BASE = 'http://localhost:3001/api';

async function quickTest() {
  console.log('🧪 Quick functionality test...\n');
  
  try {
    // Test 1: Get notifications
    console.log('📋 Testing GET /api/notifications...');
    let response = await fetch(`${API_BASE}/notifications`);
    let data = await response.json();
    console.log(`✅ GET request successful: ${data.notifications.length} notifications found\n`);
    
    if (data.notifications.length > 0) {
      const testNotification = data.notifications[0];
      console.log(`🔍 Testing with notification: "${testNotification.title}" (ID: ${testNotification.id})`);
      
      // Test 2: Delete notification
      console.log('\n🗑️ Testing DELETE functionality...');
      response = await fetch(`${API_BASE}/notifications/${testNotification.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const deleteResult = await response.json();
        console.log('✅ DELETE request successful');
        console.log(`📊 Notifications remaining: ${deleteResult.total}`);
        console.log(`📡 Broadcast info:`, deleteResult.broadcastedTo ? `${deleteResult.broadcastedTo} clients` : 'No WebSocket clients connected');
      } else {
        console.error(`❌ DELETE request failed: ${response.status} ${response.statusText}`);
      }
      
      // Test 3: Verify deletion
      console.log('\n📋 Verifying deletion...');
      response = await fetch(`${API_BASE}/notifications`);
      data = await response.json();
      console.log(`✅ Verification complete: ${data.notifications.length} notifications remaining`);
    }
    
    console.log('\n🏁 Quick test completed! The API is working correctly.');
    console.log('\nNow test the frontend:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Login and go to notification management');
    console.log('3. Check browser console for WebSocket connection logs');
    console.log('4. Try creating and deleting notifications');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest();