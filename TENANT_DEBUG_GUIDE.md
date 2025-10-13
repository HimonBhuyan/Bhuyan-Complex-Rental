# Tenant Notification Debug Guide

## 🎯 The Issue
- ✅ Notifications work on **Admin side** (can see them in history)
- ❌ Notifications **NOT showing** on **Tenant side**
- 🔍 Need to identify if it's a **filtering issue** or **context loading issue**

## 🔧 Debug Information Added

### Admin Dashboard Header
Shows: `📋 Context: [X] | 💾 Storage: [Y] | 🔗 [status]`

### Tenant Dashboard Header  
Shows: `📋 Context: [X] | 🔎 Filtered: [Y] | 💾 Storage: [Z]`

Where:
- **Context**: Notifications loaded in React context
- **Filtered**: Notifications after tenant filtering  
- **Storage**: Notifications in localStorage

## 🧪 Test Steps

### Step 1: Check Numbers in Headers
1. **Login as Admin** - note the Context and Storage numbers
2. **Create a notification** using test button
3. **Check if numbers increase**
4. **Switch to Tenant tab** - check the numbers

**Expected:**
- Admin Context = Admin Storage = Tenant Context = Tenant Storage
- Tenant Filtered should be ≤ Tenant Context (filtered down)

### Step 2: Use Debug Buttons

#### Tenant Dashboard Buttons:
- **🔄 Refresh Notifications** - Force refresh and log current state
- **📝 Manual Test** - Add test notification directly to localStorage  
- **🔍 Check Storage** - Show what's actually in localStorage
- **🧪 Test Filter** - Test filtering function directly

#### Admin Dashboard Buttons:
- **🧪 Test Notification** - Create via context
- **🔴 DIRECT Test** - Create directly in localStorage
- **🔍 Debug** - Show detailed context state

### Step 3: Check Browser Console

The console will show detailed debug info:

```
🔍 [TenantDashboard] DETAILED Debug Info:
- User ID: [tenant_id] (type: [string/number])
- All notifications from context: [array]
- All notifications count: [number]
- Context notifications (filtered): [array] 
- Context notifications length: [number]
- LocalStorage notifications: [array]
- LocalStorage count: [number]
  [0] ID: xxx, Type: "common" (string), Title: "xxx"
  [1] ID: yyy, Type: null (object), Title: "yyy"
```

**And from the filtering function:**
```
🔍 [Filter Debug] Input tenantId: [id] (type: [type])
🔍 [Filter Debug] All notifications: [array]
🔍 [Filter Debug] Notification [id]: {
  notificationTenantId: [value],
  type: [value], 
  isCommon: [boolean],
  willInclude: [boolean]
}
```

## 🐛 Common Issues to Look For

### Issue 1: Context Not Loading
**Symptoms:** Tenant Context = 0, but Admin Context > 0
**Cause:** Tenant dashboard not receiving context updates
**Debug:** Check if both use same context provider

### Issue 2: Filtering Too Restrictive  
**Symptoms:** Tenant Context > 0, but Tenant Filtered = 0
**Cause:** Notifications have `type: null` instead of `type: "common"`
**Debug:** Look at notification type in console logs

### Issue 3: User ID Mismatch
**Symptoms:** Personal notifications not showing
**Cause:** `user.id` type mismatch (string vs number)
**Debug:** Check tenantId vs user.id in filter logs

### Issue 4: Context vs Storage Mismatch
**Symptoms:** Storage has data but Context = 0  
**Cause:** Context not loading from localStorage properly
**Debug:** Check context initialization

## 🎯 Expected Results

After creating notifications on Admin side, you should see:

### Admin Dashboard:
- 📋 Context: 5 | 💾 Storage: 5 | 🔗 local

### Tenant Dashboard:
- 📋 Context: 5 | 🔎 Filtered: 5 | 💾 Storage: 5 (if all are common)
- 📋 Context: 5 | 🔎 Filtered: 3 | 💾 Storage: 5 (if some are personal)

### Console Logs:
- All notifications should have `Type: "common"` or `Type: "personal"`
- Filter should include common notifications: `isCommon: true, willInclude: true`
- No notifications should have `Type: null` 

## 🔧 Quick Fixes

### If notifications have `type: null`:
The form data extraction in Modal.jsx isn't working properly with radio buttons.

### If context numbers don't match storage:
The NotificationContext isn't loading from localStorage correctly.

### If filtering excludes common notifications:
There's a bug in the `getNotificationsForTenant` function.

Run through these tests and let me know what numbers you see and what the console logs show! 🕵️‍♀️