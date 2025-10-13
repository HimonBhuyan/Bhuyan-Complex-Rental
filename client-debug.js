// CLIENT SIDE DIAGNOSTIC - Run this in client browser console

console.log('🕵️ CLIENT-SIDE NOTIFICATION DIAGNOSTIC');
console.log('=====================================');

// 1. Check WebSocket debug info
if (window.realTimeNotificationDebug) {
    const debug = window.realTimeNotificationDebug;
    console.log('✅ WebSocket Context Found:');
    console.log('  - Connection Status:', debug.connectionStatus);
    console.log('  - Total Notifications:', debug.notifications.length);
    console.log('  - Unread Count:', debug.unreadCount);
    
    console.log('\n📋 All Notifications in Context:');
    debug.notifications.forEach((notif, index) => {
        console.log(`${index + 1}. "${notif.title}" (type: "${notif.type}", tenantId: ${notif.tenantId})`);
    });
} else {
    console.log('❌ WebSocket Context NOT FOUND');
}

// 2. Check localStorage
const stored = localStorage.getItem('notifications');
if (stored) {
    const notifications = JSON.parse(stored);
    console.log(`\n💾 LocalStorage: ${notifications.length} notifications`);
    notifications.forEach((notif, index) => {
        console.log(`${index + 1}. "${notif.title}" (type: "${notif.type}", tenantId: ${notif.tenantId})`);
    });
} else {
    console.log('\n❌ No notifications in localStorage');
}

// 3. Try to find current user ID
console.log('\n👤 USER DETECTION:');
console.log('Please check React DevTools or look for user info in console');
console.log('Expected user IDs: 1 (john.doe), 2 (jane.smith), 3 (mike.wilson)');

// 4. Manual filtering test for each possible user
[1, 2, 3].forEach(testUserId => {
    if (window.realTimeNotificationDebug) {
        const notifications = window.realTimeNotificationDebug.notifications;
        const filtered = notifications.filter(notification => {
            const isCommon = notification.type === 'common';
            const isPersonal = notification.type === 'personal' && (
                notification.tenantId === testUserId || 
                notification.tenantId == testUserId
            );
            return isCommon || isPersonal;
        });
        
        console.log(`\n🧪 Manual test for User ID ${testUserId}: ${filtered.length} notifications`);
        filtered.forEach(n => console.log(`  - ${n.title}`));
    }
});

// 5. Check if there's a React rendering issue
console.log('\n🖥️ UI DIAGNOSTIC:');
const notificationPanel = document.querySelector('.notifications-content');
if (notificationPanel) {
    console.log('✅ Notification panel found in DOM');
    console.log('  - Child elements:', notificationPanel.children.length);
    console.log('  - Content:', notificationPanel.innerHTML.substring(0, 200) + '...');
} else {
    console.log('❌ Notification panel NOT found in DOM');
}

console.log('\n🎯 SUMMARY:');
console.log('If you see notifications in Context/localStorage but not in UI,');
console.log('the issue is in React filtering or rendering.');
console.log('If you see no notifications in Context, the WebSocket isn\'t receiving data.');