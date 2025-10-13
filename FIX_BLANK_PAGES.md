# Fix Blank Pages Issue

## 🔍 **Problem Identified:**
You're getting blank pages because:
1. **Backend server is not running** (needed for authentication)
2. **Frontend redirects to login** but can't connect to backend
3. **No stored authentication tokens**

## 🚀 **Solution (Start Both Servers):**

### **Step 1: Start Backend Server**
Open **Terminal 1** and run:
```powershell
cd F:\RentalSystem\rental-management-system
node server.js
```

You should see:
```
🚀 Rental Management Server Started!
📡 HTTP Server: http://localhost:3001
🔗 WebSocket Server: ws://localhost:3001
✅ MongoDB Connected: localhost
```

**Keep this terminal running!**

### **Step 2: Start Frontend Server** 
Open **Terminal 2** (new terminal) and run:
```powershell
cd F:\RentalSystem\rental-management-system
npm run dev
```

You should see:
```
VITE v5.0.0  ready in [time] ms
➜  Local:   http://localhost:5173/
```

**Keep this terminal running too!**

### **Step 3: Access the Application**
1. **Open browser** and go to: `http://localhost:5173/`
2. You should see the **Login Page** (not blank)
3. **Login credentials**:
   - Username: `owner`
   - Password: `owner123`
   - Role: Select "Building Owner"

## 🎯 **What You Should See:**

### **Login Page:**
- Login form with username, password, and role dropdown
- "Building Owner" and "Tenant" options

### **After Login as Owner:**
- Admin dashboard with:
  - Room management
  - Tenant management  
  - Bill generation
  - Payment tracking

### **URLs to Test:**
- `http://localhost:5173/` - Redirects to login
- `http://localhost:5173/login` - Login page  
- `http://localhost:5173/dashboard` - Admin dashboard (after login)
- `http://localhost:5173/owner` - Owner-specific dashboard

## 🔧 **If Still Blank Pages:**

### **Option 1: Check Browser Console**
1. Press `F12` in browser
2. Go to "Console" tab
3. Look for error messages
4. Share any red error messages

### **Option 2: Clear Browser Cache**
```
- Press Ctrl+Shift+Delete
- Clear cookies and cached data
- Refresh page
```

### **Option 3: Test API Directly**
```powershell
# Test backend health (should work if backend is running)
Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
```

### **Option 4: Check Both Servers Running**
You should have **TWO terminals running**:
- Terminal 1: `node server.js` (Backend on port 3001)  
- Terminal 2: `npm run dev` (Frontend on port 5173)

## ⚡ **Quick Test Commands:**

### **Test Backend:**
```powershell
# Should show server status
Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
```

### **Test Frontend:**
```powershell
# Should show HTML content
Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing
```

## 🎯 **Expected Results:**

### **Working System:**
- **Backend**: http://localhost:3001 (API server)
- **Frontend**: http://localhost:5173 (React app)
- **Login Page**: Visible with form fields
- **After Login**: Admin dashboard with navigation

### **Troubleshooting:**
If you still see blank pages:
1. **Check both servers are running**
2. **Check browser console for errors**  
3. **Clear browser cache**
4. **Try different browser**
5. **Check if ports 3001 and 5173 are free**

## 📱 **Alternative: Direct Backend Testing**
If frontend still has issues, you can test the backend directly:

```bash
# Login via API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"owner","password":"owner123","role":"owner"}'
```

**Your rental management system backend is fully working - just need to get the frontend connected! 🚀**