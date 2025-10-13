# 🏠 Rental Management System - Startup Instructions

## Quick Start Options

### Option 1: Use Batch Script (Recommended for Windows)
1. Double-click `start-servers.bat` in your project folder
2. This will automatically start both backend and frontend servers in separate windows

### Option 2: Use PowerShell Script
1. Right-click in your project folder and select "Open PowerShell window here"
2. Run: `./start-servers.ps1`
3. If you get execution policy errors, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Option 3: Manual Start (Two Terminals)
**Terminal 1 (Backend):**
```powershell
cd "F:\RentalSystem\rental-management-system"
npm run server
```

**Terminal 2 (Frontend):**
```powershell
cd "F:\RentalSystem\rental-management-system"
npm run dev
```

## 🧪 Testing the Application

### Step 1: Test Frontend
- Go to: http://localhost:5173
- You should see a **diagnostic test page** with green checkmarks
- This confirms React is working properly

### Step 2: Test Backend Connection
- On the diagnostic page, you should see "✅ Connected" under Backend Connection
- Click "Test Login" button to verify authentication

### Step 3: Test Normal Application
- Click "Go to Login Page" or navigate to: http://localhost:5173/login
- Use these credentials:
  - **Username:** owner
  - **Password:** owner123
  - **Role:** Building Owner

## 🔧 Switching Between Test and Normal Mode

Edit `src/main.jsx` and change line 10:

**For Testing (Diagnostic Page):**
```javascript
const AppComponent = TestApp; // Shows diagnostic page
```

**For Normal Application:**
```javascript
const AppComponent = App; // Shows login and dashboards
```

## 📡 Server URLs
- **Backend API:** http://localhost:3001
- **Frontend App:** http://localhost:5173
- **Health Check:** http://localhost:3001/health

## 🚨 Troubleshooting

### If Frontend Shows Blank Page:
1. Switch to TestApp mode (see above)
2. Check browser console (F12) for errors
3. Ensure both servers are running
4. Try restarting both servers

### If Backend Won't Start:
1. Ensure MongoDB is running
2. Check if port 3001 is available
3. Look for error messages in terminal

### If Login Doesn't Work:
1. Verify backend is running (check http://localhost:3001/health)
2. Ensure MongoDB has the default owner account
3. Use exact credentials: owner/owner123

## 🎯 Default Test Credentials
- **Username:** owner
- **Password:** owner123
- **Role:** Building Owner (owner)

## 📁 Important Files
- `src/TestApp.jsx` - Diagnostic test component
- `src/main.jsx` - App entry point (switch between test/normal)
- `server.js` - Backend server
- `vite.config.js` - Frontend build configuration

---
*If you encounter any issues, check the console output in your terminal windows for detailed error messages.*