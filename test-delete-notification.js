// Test script to verify notification deletion WebSocket broadcasting

const API_BASE = 'http://localhost:3001/api';

async function testNotificationDeletion() {
  console.log('🧪 Testing notification deletion with WebSocket broadcasting...\n');
  
  try {
    // Step 1: Get current notifications
    console.log('📋 Step 1: Getting current notifications...');
    let response = await fetch(`${API_BASE}/notifications`);
    let data = await response.json();
    console.log(`✅ Current notifications: ${data.notifications.length}`);
    
    if (data.notifications.length === 0) {
      console.log('⚠️ No notifications to test deletion with. Creating a test notification first...\n');
      
      // Create a test notification
      const testNotification = {
        type: 'common',
        title: 'Test Notification for Deletion',
        message: 'This notification will be deleted to test WebSocket broadcasting.',
        category: 'info',
        priority: 'medium',
        tenantId: null
      };
      
      response = await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testNotification)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created test notification: "${result.notification.title}"`);
        console.log(`📡 Notification broadcast to ${result.broadcastedTo} WebSocket clients\n`);
      }
      
      // Refresh the notifications list
      response = await fetch(`${API_BASE}/notifications`);
      data = await response.json();
    }
    
    // Step 2: Delete the first notification
    const firstNotification = data.notifications[0];
    if (firstNotification) {
      console.log(`🗑️ Step 2: Deleting notification "${firstNotification.title}"...`);
      console.log(`📄 Notification ID: ${firstNotification.id}`);
      
      response = await fetch(`${API_BASE}/notifications/${firstNotification.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Notification deleted successfully!`);
        console.log(`📡 Deletion broadcast to ${result.broadcastedTo} WebSocket clients`);
        console.log(`📊 Total notifications remaining: ${result.total}`);
        
        if (result.deletedNotification) {
          console.log(`🗑️ Deleted notification: "${result.deletedNotification.title}"`);
        }
      } else {
        console.error(`❌ Failed to delete notification: ${response.status} ${response.statusText}`);
      }
    } else {
      console.log('⚠️ No notifications found to delete');
    }
    
    // Step 3: Verify deletion
    console.log('\n📋 Step 3: Verifying deletion...');
    response = await fetch(`${API_BASE}/notifications`);
    data = await response.json();
    console.log(`✅ Current notifications after deletion: ${data.notifications.length}`);
    
    console.log('\n🏁 Test completed!');
    console.log('\n🔍 What should happen in connected clients:');
    console.log('  1. Real-time WebSocket clients should receive NOTIFICATION_DELETED event');
    console.log('  2. Client-side notifications list should update automatically');
    console.log('  3. Toast notification should show "Notification deleted: [title]"');
    console.log('  4. LocalStorage should be updated across all browser tabs');
    console.log('\nOpen browser console in admin and tenant dashboards to see the real-time updates!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotificationDeletion();