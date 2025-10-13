# Notification System Troubleshooting Guide

## 🚨 Current Status

The backend notification server and API are working correctly. If notifications aren't appearing in the frontend, here's how to troubleshoot:

## ✅ Prerequisites Check

### 1. Verify Backend is Running
```bash
# Check if notification server is running
curl http://localhost:3001/health
# Should return: {"status":"OK","timestamp":"..."}

# Check if API has notifications
curl http://localhost:3001/api/notifications
# Should return: {"notifications":[...]}
```

### 2. Verify React App is Using RealTimeNotificationContext
The app has been updated to use `RealTimeNotificationContext`. Check that:
- `src/App.jsx` imports `RealTimeNotificationProvider`
- Components use `useRealTimeNotifications()` hook

## 🔧 Frontend Debugging Steps

### Step 1: Browser Console Debugging
1. **Open your React app** in browser (`http://localhost:5173`)
2. **Login** as either tenant or owner
3. **Open browser developer console** (F12)
4. **Copy and paste the content of `browser-debug.js`** into the console
5. **Review the debug output** for connection status, notification count, etc.

### Step 2: Test WebSocket Connection
In the browser console, the debug script will automatically test:
- ✅ API connection
- ✅ WebSocket connection  
- ✅ LocalStorage status
- ✅ RealTimeNotificationContext initialization

### Step 3: Manual Testing Functions
Use these functions in the browser console:
```javascript
// Create a test notification
testCreateNotification()

// Delete the first notification
testDeleteFirstNotification()

// Refresh the page
refreshNotifications()
```

## 🐛 Common Issues & Solutions

### Issue 1: No Notifications Displayed
**Symptoms:** Empty notification list, zero notification count  
**Debugging:**
1. Check if `window.realTimeNotificationDebug` exists in console
2. Check if API returns data: `window.realTimeNotificationDebug.apiUrl`
3. Look for console errors during component initialization

**Solutions:**
- If API has data but UI doesn't: Component filtering might be too restrictive
- If WebSocket fails: Backend server might not be running
- If context not initialized: Check if app is properly wrapped with provider

### Issue 2: WebSocket Connection Fails
**Symptoms:** Connection status shows 'disconnected' or 'error'  
**Debugging:**
1. Check if notification server is running: `node notification-server.js`
2. Test WebSocket manually in browser console (debug script does this)
3. Check for firewall/antivirus blocking WebSocket connections

**Solutions:**
- Restart notification server
- Check if port 3001 is available
- System should fallback to API polling automatically

### Issue 3: Notifications Not Syncing Between Tabs/Browsers
**Symptoms:** Creating/deleting notifications in one tab doesn't update others  
**Debugging:**
1. Check WebSocket connection status in all tabs
2. Verify localStorage updates: Check `localStorage.getItem('notifications')`
3. Look for cross-tab event listeners in console logs

**Solutions:**
- WebSocket should handle real-time sync
- localStorage events should handle cross-tab sync
- API polling should handle cross-browser sync

### Issue 4: Creating Notifications Doesn't Work
**Symptoms:** Form submission succeeds but no notifications appear  
**Debugging:**
1. Check if notification has correct `type` field (not null)
2. Verify API response in Network tab
3. Check if WebSocket broadcast message is received

**Solutions:**
- Form data extraction might be failing (check radio button values)
- API might be succeeding but WebSocket not broadcasting
- Check tenant filtering logic

## 📋 Step-by-Step Testing Process

### Test 1: Basic Functionality
1. **Start servers:**
   ```bash
   # Terminal 1: Backend
   node notification-server.js
   
   # Terminal 2: Frontend  
   npm run dev
   ```

2. **Open React app** and login as Owner
3. **Go to notification management** (post notifications)
4. **Open browser console** and run the debug script
5. **Check connection status** and notification count

### Test 2: Creation Testing
1. **Try creating a notification** through the UI
2. **Check browser console** for any errors
3. **Run `testCreateNotification()`** in console to test API directly
4. **Verify notification appears** in UI

### Test 3: Deletion Testing  
1. **Try deleting a notification** through the UI
2. **Check browser console** for deletion logs
3. **Run `testDeleteFirstNotification()`** in console to test API directly
4. **Verify notification disappears** from UI

### Test 4: Real-Time Sync Testing
1. **Open Owner dashboard** in one browser tab
2. **Open Tenant dashboard** in another browser tab  
3. **Create/delete notifications** from Owner dashboard
4. **Check if changes appear immediately** in Tenant dashboard
5. **Check browser console logs** in both tabs

## 🎯 What Should Work Now

✅ **Backend API:** Create, read, delete notifications  
✅ **WebSocket Server:** Broadcast creation and deletion events  
✅ **Frontend Context:** Load notifications from API/localStorage  
✅ **Real-Time Updates:** WebSocket events trigger UI updates  
✅ **Cross-Tab Sync:** localStorage events sync across tabs  
✅ **Cross-Browser Sync:** API polling syncs across browsers  

## 🔍 If All Else Fails

1. **Clear browser cache and localStorage:**
   ```javascript
   localStorage.clear()
   location.reload()
   ```

2. **Restart both servers** (backend and frontend)

3. **Check for JavaScript errors** in browser console

4. **Verify file permissions** on notifications-data.json

5. **Test with a completely fresh browser session** (incognito mode)

## 📞 Need More Help?

If notifications still aren't working:

1. **Run the debug script** in browser console and share the output
2. **Check for error messages** in both browser and server console logs  
3. **Try the manual test functions** and report which ones work/fail
4. **Check browser Network tab** for failed API requests

The system is designed with multiple fallback mechanisms, so at minimum you should see notifications loading from the API even if real-time features fail.