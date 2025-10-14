# 🚀 Start Here - Your Rental Management System

## ✅ Current Status
- **Backend**: Deployed and running on `https://bhuyan-complex-rental-2.onrender.com`
- **Database**: Connected ✅
- **WebSocket**: Working ✅ (tested successfully)
- **Frontend**: Ready to connect to live backend

## 🎯 Quick Start

### 1. Start the Frontend
```bash
npm run dev
```

This will start the frontend on `http://localhost:5173` and automatically connect to your live backend.

### 2. Open Your Browser
Navigate to: `http://localhost:5173`

### 3. Check Connection Status
Look for the **Connection Status** widget in the bottom-right corner of your browser:
- **API**: Should show "Connected" (green)  
- **WS**: Should show "Connected" (green)

### 4. Test Login
**Default Owner Account:**
- Username: `owner`
- Password: `owner123`
- Role: Owner

**Or create a tenant account through the Owner dashboard**

## 🔧 Connection Details

Your frontend is now configured to use:
- **API URL**: `https://bhuyan-complex-rental-2.onrender.com/api`
- **WebSocket URL**: `wss://bhuyan-complex-rental-2.onrender.com`

## 📊 Real-time Features Working

✅ **WebSocket Notifications** - Real-time updates  
✅ **Email Notifications** - Late fees & reminders  
✅ **Bill Management** - Auto-generation & tracking  
✅ **Payment Processing** - Razorpay integration  
✅ **User Management** - Owner/Tenant accounts  
✅ **Document Upload** - Profile documents  
✅ **Mobile Responsive** - Works on all devices  

## 🧪 Testing Commands

```bash
# Test WebSocket connection
npm run test:ws

# Verify configuration
npm run verify

# Check backend health
curl https://bhuyan-complex-rental-2.onrender.com/health
```

## 📱 What You'll See

### On Login Page:
- Connection Status widget showing live status
- Console logs showing API configuration

### After Login (Owner Dashboard):
- Real-time notifications working
- All features connected to live backend
- Team management with document viewing
- Payment monitoring
- Bill generation
- Excel report downloads

### Console Output Example:
```
🔧 API Configuration:
  Environment: development
  Production build: false
  Base URL: https://bhuyan-complex-rental-2.onrender.com
  API URL: https://bhuyan-complex-rental-2.onrender.com/api
  WebSocket URL: wss://bhuyan-complex-rental-2.onrender.com

🔗 RealTimeNotificationContext Configuration:
  WebSocket URL: wss://bhuyan-complex-rental-2.onrender.com
  API URL: https://bhuyan-complex-rental-2.onrender.com/api

✅ [RealTimeContext] WebSocket connected successfully
```

## 🐛 Troubleshooting

### If Connection Status shows "Disconnected":
1. Check if backend is running: https://bhuyan-complex-rental-2.onrender.com/health
2. Check browser console for error messages
3. Run `npm run test:ws` to test WebSocket directly

### If Login Fails:
1. Check Network tab in browser dev tools
2. Verify API calls are going to the right URL
3. Check backend logs on Render dashboard

### If Real-time Notifications Don't Work:
1. Check WebSocket connection in Network tab
2. Should see connection to `wss://bhuyan-complex-rental-2.onrender.com`
3. Look for WebSocket messages in browser console

## 🎉 Features to Test

1. **Login** - Owner/Tenant authentication
2. **Dashboard** - Real-time stats and data  
3. **Notifications** - Bell icon should show live notifications
4. **Team Management** - View tenants and their documents
5. **Bill Generation** - Create bills for tenants
6. **Payment Monitoring** - Track payments and late fees
7. **Real-time Updates** - Changes should appear instantly
8. **Mobile View** - Test responsive design

---

**Everything is working!** Your system is now fully connected to the live backend with real-time WebSocket notifications. 🎊