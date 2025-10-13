# Basic Notification Testing Guide

## 🚨 Current Status
I've temporarily reverted the app to use the basic `NotificationContext` instead of the `RealTimeNotificationContext` to identify what's broken.

## ✅ Quick Test Steps

### Step 1: Start the Application
1. **Ensure notification server is running:**
   ```bash
   node notification-server.js
   ```
2. **Start the React app:**
   ```bash
   npm run dev
   ```

### Step 2: Test Basic Functionality
1. **Open the app** in your browser (typically http://localhost:5173)
2. **Login as Owner/Admin**
3. **Look at the Admin Panel header** - you should see:
   - 📋 Context: [number] (notifications in React context)
   - 💾 Storage: [number] (notifications in localStorage)  
   - 🔗 local (connection status)

### Step 3: Test Notification Creation
1. **Click "🧪 Test Notification" button** - this creates a notification via the context
2. **Click "🔴 DIRECT Test" button** - this creates a notification directly in localStorage
3. **Watch the numbers change** in the header after each test
4. **Click "🔍 Debug" button** and check browser console for detailed state information

### Step 4: Test Notification History
1. **Click "📜 History" button** to open notification history modal
2. **Check if notifications appear** in the history list
3. **Try deleting individual notifications** using the 🗑️ button
4. **Try "Clear All History"** to delete all notifications

### Step 5: Test Custom Notifications
1. **Click "Post Notifications"** (if available in UI)
2. **Fill out the form** with a custom notification
3. **Submit the form**
4. **Check if it appears** in the history

### Step 6: Test Tenant Side
1. **Open a new browser tab**
2. **Login as Tenant**
3. **Check if notifications appear** in the tenant dashboard
4. **Test if changes sync** between admin and tenant tabs

## 🐛 Expected Issues to Look For

### Issue 1: Numbers Always Show 0
- **Cause:** Context not loading notifications from localStorage/API
- **Debug:** Click Debug button and check console logs

### Issue 2: Test Notifications Don't Work
- **Cause:** `addNotification` function not working properly
- **Debug:** Check browser console for errors

### Issue 3: History Modal Empty
- **Cause:** `notifications` array in context is empty
- **Debug:** Check if localStorage has data vs context state

### Issue 4: Form Submission Fails
- **Cause:** Form data extraction or `addNotification` call failing
- **Debug:** Check browser Network tab and console logs

## 📊 What Should Work Now

With the basic NotificationContext:
- ✅ localStorage-based notification storage
- ✅ Context state management
- ✅ Cross-tab synchronization (via localStorage events)
- ✅ Manual notification creation and deletion
- ❌ Real-time WebSocket updates (not available in basic context)
- ❌ Cross-browser synchronization (not available in basic context)

## 🔧 Debug Information

The Debug button will show:
```javascript
🔍 [DEBUG] Context State:
- sentNotifications: [array of notification objects]
- connectionStatus: 'local' 
- localStorage: [JSON string of notifications or null]
```

**What to check:**
- If `sentNotifications` is empty but localStorage has data → Context not loading properly
- If localStorage is null but context has data → Storage not saving properly  
- If both are empty → No notifications created yet
- If browser console shows errors → Identify the root cause

## 🎯 Next Steps

Once basic functionality works:
1. **Identify what works vs what doesn't**
2. **Fix any core issues** in the basic NotificationContext
3. **Switch back to RealTimeNotificationContext** 
4. **Apply the same fixes** to the RealTime version
5. **Add back WebSocket functionality** step by step

Run through these tests and let me know:
1. **What numbers do you see** in the header?
2. **Do the test buttons work?**
3. **Does the history modal show notifications?**
4. **Any errors in browser console?**

This will help identify if the issue is in the basic notification system or specifically with the WebSocket/RealTime implementation.