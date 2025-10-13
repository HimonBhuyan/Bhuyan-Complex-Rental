// Browser debugging helper for real-time notifications
// Copy and paste this in the browser console to debug the notification system

console.log('🔧 Notification System Debugger');
console.log('================================\n');

// Check if RealTimeNotificationContext debug info is available
if (window.realTimeNotificationDebug) {
  const debug = window.realTimeNotificationDebug;
  console.log('✅ RealTimeNotificationContext is active');
  console.log(`📊 Notifications count: ${debug.notifications.length}`);
  console.log(`🔔 Unread count: ${debug.unreadCount}`);
  console.log(`🔗 Connection status: ${debug.connectionStatus}`);
  console.log(`⏳ Loading: ${debug.loading}`);
  console.log(`🌐 WebSocket URL: ${debug.wsUrl}`);
  console.log(`📡 API URL: ${debug.apiUrl}\n`);
  
  if (debug.notifications.length > 0) {
    console.log('📋 Current notifications:');
    debug.notifications.forEach((n, i) => {
      console.log(`  ${i + 1}. "${n.title}" (Type: ${n.type}, ID: ${n.id})`);
    });
  } else {
    console.log('📋 No notifications found');
  }
} else {
  console.log('❌ RealTimeNotificationContext debug info not found');
  console.log('This might indicate the context is not properly initialized');
}

// Check localStorage
console.log('\n💾 LocalStorage Check:');
try {
  const stored = localStorage.getItem('notifications');
  if (stored) {
    const notifications = JSON.parse(stored);
    console.log(`✅ LocalStorage has ${notifications.length} notifications`);
  } else {
    console.log('❌ No notifications in localStorage');
  }
} catch (error) {
  console.log('❌ Error reading from localStorage:', error.message);
}

// Test API connection
console.log('\n📞 Testing API connection...');
fetch('http://localhost:3001/api/notifications')
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(`HTTP ${response.status}`);
  })
  .then(data => {
    console.log(`✅ API working: ${data.notifications.length} notifications`);
  })
  .catch(error => {
    console.log('❌ API connection failed:', error.message);
  });

// Test WebSocket connection
console.log('\n🔗 Testing WebSocket connection...');
const testWs = new WebSocket('ws://localhost:3001');
testWs.onopen = () => {
  console.log('✅ WebSocket connection successful');
  testWs.close();
};
testWs.onerror = (error) => {
  console.log('❌ WebSocket connection failed:', error);
};
testWs.onclose = (event) => {
  console.log(`🔌 WebSocket closed: ${event.code} ${event.reason}`);
};

console.log('\n🎯 Next Steps:');
console.log('1. If API is working but WebSocket fails, check if notification-server.js is running');
console.log('2. If notifications count is 0 but API has data, there might be a loading issue');
console.log('3. Check browser network tab for any failed requests');
console.log('4. Look for error messages in the console');
console.log('\n📝 Helper functions available:');
console.log('- testCreateNotification() - Create a test notification');
console.log('- testDeleteFirstNotification() - Delete the first notification');
console.log('- refreshNotifications() - Refresh the notification list');

// Helper functions
window.testCreateNotification = async () => {
  console.log('🚀 Creating test notification...');
  try {
    const response = await fetch('http://localhost:3001/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'common',
        title: 'Browser Console Test',
        message: 'This notification was created from the browser console for testing.',
        category: 'info',
        priority: 'medium'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test notification created:', result.notification.title);
      console.log(`📡 Broadcast to ${result.broadcastedTo || 0} clients`);
    } else {
      console.log('❌ Failed to create notification:', response.status);
    }
  } catch (error) {
    console.log('❌ Error creating notification:', error.message);
  }
};

window.testDeleteFirstNotification = async () => {
  console.log('🗑️ Deleting first notification...');
  try {
    const response = await fetch('http://localhost:3001/api/notifications');
    const data = await response.json();
    
    if (data.notifications.length > 0) {
      const firstId = data.notifications[0].id;
      const deleteResponse = await fetch(`http://localhost:3001/api/notifications/${firstId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        const result = await deleteResponse.json();
        console.log('✅ First notification deleted');
        console.log(`📡 Broadcast to ${result.broadcastedTo || 0} clients`);
      } else {
        console.log('❌ Failed to delete notification:', deleteResponse.status);
      }
    } else {
      console.log('⚠️ No notifications to delete');
    }
  } catch (error) {
    console.log('❌ Error deleting notification:', error.message);
  }
};

window.refreshNotifications = () => {
  console.log('🔄 Refreshing notifications...');
  window.location.reload();
};
