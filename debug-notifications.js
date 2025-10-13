// Notification System Debug Tool
// Run this in the browser console to debug notification issues

console.log('🔧 NOTIFICATION SYSTEM DEBUG TOOL');
console.log('================================');

// Test 1: Check localStorage
console.log('\n📦 1. LOCALSTORAGE TEST:');
try {
    const stored = localStorage.getItem('notifications');
    if (stored) {
        const notifications = JSON.parse(stored);
        console.log(`✅ Found ${notifications.length} notifications in localStorage`);
        console.table(notifications.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title.substring(0, 30) + '...',
            tenantId: n.tenantId,
            category: n.category,
            priority: n.priority
        })));
    } else {
        console.log('❌ No notifications found in localStorage');
    }
} catch (error) {
    console.error('❌ Error reading localStorage:', error);
}

// Test 2: Check WebSocket connection
console.log('\n🔗 2. WEBSOCKET CONNECTION TEST:');
const testWs = new WebSocket('ws://localhost:3001');

testWs.onopen = () => {
    console.log('✅ WebSocket connection successful');
    testWs.close();
};

testWs.onerror = (error) => {
    console.error('❌ WebSocket connection failed:', error);
};

testWs.onclose = (event) => {
    console.log(`🔌 WebSocket closed: ${event.code} ${event.reason}`);
};

// Test 3: Test API endpoints
console.log('\n📡 3. API ENDPOINTS TEST:');

fetch('http://localhost:3001/api/notifications')
    .then(response => response.json())
    .then(data => {
        console.log(`✅ API returned ${data.notifications.length} notifications`);
        console.table(data.notifications.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title.substring(0, 30) + '...',
            tenantId: n.tenantId,
            category: n.category,
            priority: n.priority
        })));
    })
    .catch(error => {
        console.error('❌ API request failed:', error);
    });

// Test 4: Test notification filtering logic
console.log('\n🔍 4. NOTIFICATION FILTERING TEST:');

// Mock tenant IDs for testing
const testTenantIds = ['1', '2', '3', 'tenant-1', 'user-123'];

const testNotifications = [
    { id: 1, type: 'common', title: 'Common Notification 1', tenantId: null },
    { id: 2, type: 'common', title: 'Common Notification 2', tenantId: null },
    { id: 3, type: 'personal', title: 'Personal for Tenant 1', tenantId: '1' },
    { id: 4, type: 'personal', title: 'Personal for Tenant 2', tenantId: '2' },
    { id: 5, type: null, title: 'Notification with null type', tenantId: null },
    { id: 6, type: '', title: 'Notification with empty type', tenantId: null }
];

console.log('Test notifications:', testNotifications);

testTenantIds.forEach(tenantId => {
    console.log(`\n--- Testing for tenant ID: "${tenantId}" (${typeof tenantId}) ---`);
    
    const filtered = testNotifications.filter(notification => {
        const isCommon = notification.type === 'common';
        const isPersonal = notification.type === 'personal' && (
            notification.tenantId === tenantId || 
            notification.tenantId == tenantId
        );
        
        console.log(`  ${notification.title}:`);
        console.log(`    type: "${notification.type}" (${typeof notification.type})`);
        console.log(`    tenantId: "${notification.tenantId}" (${typeof notification.tenantId})`);
        console.log(`    isCommon: ${isCommon}, isPersonal: ${isPersonal}`);
        console.log(`    included: ${isCommon || isPersonal}`);
        
        return isCommon || isPersonal;
    });
    
    console.log(`📊 Result: ${filtered.length} notifications for tenant "${tenantId}"`);
    filtered.forEach(n => console.log(`  - ${n.title}`));
});

// Test 5: Check React context (if available)
console.log('\n⚛️ 5. REACT CONTEXT TEST:');
if (typeof window !== 'undefined' && window.realTimeNotificationDebug) {
    const debug = window.realTimeNotificationDebug;
    console.log('✅ RealTimeNotificationContext debug info found:');
    console.log(`  - Notifications: ${debug.notifications.length}`);
    console.log(`  - Unread count: ${debug.unreadCount}`);
    console.log(`  - Connection status: ${debug.connectionStatus}`);
    console.log(`  - Loading: ${debug.loading}`);
    console.log(`  - WebSocket URL: ${debug.wsUrl}`);
    console.log(`  - API URL: ${debug.apiUrl}`);
} else {
    console.log('❌ RealTimeNotificationContext debug info not found');
    console.log('Make sure the React app is running and the context is loaded');
}

console.log('\n🎯 DEBUG COMPLETE!');
console.log('If you see issues above, check:');
console.log('1. Is the notification server running on port 3001?');
console.log('2. Are notifications being stored with correct "type" values?');
console.log('3. Is the WebSocket connection established?');
console.log('4. Are notifications being filtered correctly for the tenant?');