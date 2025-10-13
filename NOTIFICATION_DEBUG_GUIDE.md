# 🔧 NOTIFICATION SYSTEM DEBUGGING GUIDE

## ✅ System Status Verification (COMPLETED)

### 1. ✅ Notification Server Status
- **Server**: Running on port 3001
- **API Endpoints**: Working correctly
- **WebSocket**: Multiple active connections established
- **Data File**: notifications-data.json exists and contains valid data

### 2. ✅ Test Data Available
The system now has proper test notifications:
- **Common notifications** (visible to all tenants): 6 notifications
- **Personal notification** for tenant ID 1: 1 notification
- All notifications have correct `type` field values

## 🧪 DEBUGGING STEPS FOR CLIENT-SIDE ISSUES

### Step 1: Open Browser Console
1. Open client-side tenant dashboard in browser
2. Open Developer Tools (F12)
3. Go to Console tab

### Step 2: Run Debug Script
Copy and paste the contents of `debug-notifications.js` into the console and press Enter.

This will test:
- ✅ localStorage contents
- ✅ WebSocket connection
- ✅ API endpoints
- ✅ Notification filtering logic
- ✅ React context state

### Step 3: Check Expected Results
For **Tenant ID 1**, you should see:
- **7 total notifications** (6 common + 1 personal)
- Personal notification: "Test Personal Notification for Tenant 1"
- Common notifications: All 6 common notifications

For **Other Tenant IDs** (2, 3), you should see:
- **6 total notifications** (6 common + 0 personal)

### Step 4: Verify React App Integration
Check these in the console output:
- React context debug info should show `connectionStatus: "connected"`
- localStorage should contain all notifications
- Filtering should work correctly for the current user

## 🔍 CURRENT TEST DATA

```json
{
  "notifications": [
    {
      "id": 1758986155998.6646,
      "type": "common",
      "title": "Test Common Notification"
    },
    {
      "id": 1758986144607.4705,
      "type": "personal",
      "tenantId": 1,
      "title": "Test Personal Notification for Tenant 1"
    },
    {
      "id": 1758980754924.4607,
      "type": "common",
      "title": "Building Maintenance Update"
    },
    {
      "id": 1758980622830.4517,
      "type": "common", 
      "title": "New Building Policies"
    },
    {
      "id": 1758980415244.5894,
      "type": "common",
      "title": "Security Update"
    },
    {
      "id": 1758980199427.256,
      "type": "common",
      "title": "Payment Reminder"
    },
    {
      "id": 1758980147966.5457,
      "type": "common",
      "title": "Test Notification"
    }
  ]
}
```

## 🎯 SPECIFIC TESTS TO RUN

### Test 1: Login as Tenant 1
1. Login with tenant ID 1 credentials
2. Check if you see 7 notifications (including the personal one)
3. Verify the personal notification appears at the top

### Test 2: Cross-Browser Real-Time Test
1. Open admin panel in one browser
2. Open client panel (tenant 1) in another browser
3. Send a new common notification from admin
4. Verify it appears immediately in client browser

### Test 3: WebSocket Debug
Run this in the browser console:
```javascript
// Check WebSocket connection
console.log('WebSocket Debug:', window.realTimeNotificationDebug);

// Monitor WebSocket messages
const ws = new WebSocket('ws://localhost:3001');
ws.onmessage = (event) => {
  console.log('WebSocket message:', JSON.parse(event.data));
};
```

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: No Notifications Showing
**Possible causes:**
1. WebSocket not connected
2. localStorage empty
3. Filtering logic removing all notifications
4. User ID mismatch

**Solution:** Run the debug script to identify the specific issue.

### Issue: Notifications Not Real-Time
**Possible causes:**
1. WebSocket disconnected
2. Server not broadcasting
3. Event listeners not working

**Solution:** Check WebSocket connection status and server logs.

### Issue: Wrong Notifications Showing
**Possible causes:**
1. Incorrect tenant ID in filtering
2. Wrong notification types in database
3. Filtering logic bug

**Solution:** Verify user.id value and notification.type values match expected format.

## 📋 VERIFICATION CHECKLIST

- [ ] Server running on port 3001
- [ ] API returns notifications correctly
- [ ] WebSocket establishes connection
- [ ] localStorage contains notifications
- [ ] React context loads notifications
- [ ] Filtering works for tenant ID
- [ ] Real-time updates work cross-browser
- [ ] Personal notifications show for correct tenant
- [ ] Common notifications show for all tenants

## 🔗 QUICK TEST COMMANDS

```powershell
# Test server health
Invoke-RestMethod -Uri "http://localhost:3001/health"

# Test API
Invoke-RestMethod -Uri "http://localhost:3001/api/notifications"

# Check server processes
netstat -an | findstr :3001
```

---

**Next Steps:** If issues persist after running these tests, check the specific console output and compare against expected results above.