// QUICK DEBUG - Run this in the browser console on the tenant dashboard

console.log('🚀 QUICK NOTIFICATION DEBUG START');
console.log('=====================================');

// 1. Check if RealTimeNotificationContext is available
if (window.realTimeNotificationDebug) {
    const debug = window.realTimeNotificationDebug;
    console.log('✅ RealTimeNotificationContext found');
    console.log('Connection Status:', debug.connectionStatus);
    console.log('Total Notifications:', debug.notifications.length);
    console.log('Unread Count:', debug.unreadCount);
    
    console.log('\n📋 All Notifications:');
    debug.notifications.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title} (type: "${notif.type}", tenantId: ${notif.tenantId})`);
    });
} else {
    console.log('❌ RealTimeNotificationContext debug not found');
}

// 2. Check localStorage
const stored = localStorage.getItem('notifications');
if (stored) {
    const notifications = JSON.parse(stored);
    console.log(`\n💾 LocalStorage has ${notifications.length} notifications`);
    notifications.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title} (type: "${notif.type}", tenantId: ${notif.tenantId})`);
    });
} else {
    console.log('\n❌ No notifications in localStorage');
}

// 3. Test API directly
fetch('http://localhost:3001/api/notifications')
    .then(response => response.json())
    .then(data => {
        console.log(`\n🌐 API returned ${data.notifications.length} notifications`);
        data.notifications.forEach((notif, index) => {
            console.log(`${index + 1}. ${notif.title} (type: "${notif.type}", tenantId: ${notif.tenantId})`);
        });
    })
    .catch(error => console.error('❌ API Error:', error));

// 4. Check current user from React context (try different methods)
if (window.React && window.React.__internals) {
    console.log('\n🔍 Trying to find current user...');
    // This is a hack to find React internals - may not work in production
}

// Manual user check - you might need to adjust this
console.log('\n👤 Please manually check:');
console.log('1. What is the current user ID logged in?');
console.log('2. Open React DevTools and look for UserContext');
console.log('3. Check if user.id matches 1, 2, or 3');

// 5. Test filtering manually with different user IDs
const testNotifications = [
    { id: 1, type: 'common', title: 'Common 1', tenantId: null },
    { id: 2, type: 'personal', title: 'Personal for 1', tenantId: 1 },
    { id: 3, type: 'personal', title: 'Personal for 2', tenantId: 2 }
];

[1, 2, 3].forEach(testUserId => {
    const filtered = testNotifications.filter(notification => {
        const isCommon = notification.type === 'common';
        const isPersonal = notification.type === 'personal' && (
            notification.tenantId === testUserId || 
            notification.tenantId == testUserId
        );
        return isCommon || isPersonal;
    });
    
    console.log(`\n🧪 For user ID ${testUserId}: ${filtered.length} notifications`);
    filtered.forEach(n => console.log(`  - ${n.title}`));
});

console.log('\n🎯 DEBUG COMPLETE');
console.log('If you see data above but no notifications in UI, the issue is in React rendering.');
console.log('If you see no data, the issue is in data loading/WebSocket connection.');