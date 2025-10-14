# Rental Management System - Deployment Guide 🚀

This guide covers deploying the React + Node.js rental management system to Render with proper WebSocket and production configuration.

## Quick Setup Summary ✨

The system now auto-detects production URLs! No hardcoded localhost URLs anymore.

### For Local Development:
```bash
npm run dev          # Frontend (port 5173)
npm run server       # Backend (port 3001)
```

### For Production (Render):
- Deploy as single Node.js service
- Frontend built and served by Express
- WebSocket works automatically
- No environment variables required for URLs

## Architecture Overview 🏗️

### Development Mode:
- **Frontend**: Vite dev server (`localhost:5173`)
- **Backend**: Express + WebSocket (`localhost:3001`)
- **Connection**: Frontend connects to `ws://localhost:3001`

### Production Mode:
- **Single Server**: Express serves built frontend + API + WebSocket
- **Smart Detection**: URLs auto-detected from deployment environment
- **WebSocket**: Automatically uses `wss://` for HTTPS deployments

## Files Updated for Production 📁

### Backend Changes (`server.js`):
- ✅ Enhanced CORS configuration for production
- ✅ Dynamic URL detection using `RENDER_EXTERNAL_URL`
- ✅ Proper WebSocket server attached to HTTP server
- ✅ Environment-aware logging

### Frontend Changes:
- ✅ `src/utils/api.js` - Centralized API configuration
- ✅ `src/context/RealTimeNotificationContext.jsx` - Dynamic WebSocket URLs
- ✅ `src/components/Modal.jsx` - Updated API calls
- ✅ Environment variable support

### Configuration Files:
- ✅ `.env.development` - Development settings
- ✅ `.env.production` - Production template
- ✅ Enhanced `vite.config.mjs`

## Render Deployment Steps 🌐

### 1. Repository Setup
```bash
# Ensure your code is pushed to GitHub/GitLab
git add .
git commit -m "Production deployment ready"
git push origin main
```

### 2. Create Render Service

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "New +" → "Web Service"**
3. **Connect your repository**
4. **Configure the service:**

```yaml
# Render Service Configuration
Name: rental-management-system
Region: Choose nearest to users
Branch: main
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run server
```

### 3. Environment Variables on Render

Set these in Render Dashboard → Environment:

```env
# Required for Production
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rental-management
JWT_SECRET=your-super-secret-production-jwt-key-minimum-32-characters

# Email Configuration (for password reset & notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Razorpay (if using payments)
VITE_RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_production_secret

# Optional: Only set if you need custom URLs
# FRONTEND_URL=https://your-app.onrender.com
# VITE_API_URL=https://your-app.onrender.com
# VITE_WS_URL=wss://your-app.onrender.com
```

### 4. Build Configuration

Update `package.json` build script:
```json
{
  "scripts": {
    "build": "vite build && npm run build:server",
    "build:server": "echo 'Server build complete'",
    "server": "node server.js",
    "start": "node server.js"
  }
}
```

### 5. Static File Serving

Add to your `server.js` (for production frontend serving):
```javascript
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Catch all handler for React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
}
```

## URL Configuration Logic 🔧

### Automatic Detection:
```javascript
// Frontend (src/utils/api.js)
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return 'http://localhost:3001'; // Development fallback
};

// Backend (server.js)
const baseUrl = process.env.RENDER_EXTERNAL_URL || 
                process.env.BASE_URL || 
                `http://localhost:${PORT}`;
```

### Environment Priority:
1. **Explicit Environment Variables** (`VITE_API_URL`, `VITE_WS_URL`)
2. **Production Auto-Detection** (uses current domain)
3. **Development Fallback** (`localhost:3001`)

## Testing the Deployment 🧪

### 1. Local Testing:
```bash
# Test production build locally
npm run build
npm run server
# Visit http://localhost:3001
```

### 2. Production Verification:
```bash
# Check these in browser console after deployment
# Should see logs like:
🔧 API Configuration:
  Environment: production
  Production build: true
  Base URL: https://your-app.onrender.com
  API URL: https://your-app.onrender.com/api
  WebSocket URL: wss://your-app.onrender.com
```

### 3. WebSocket Testing:
- ✅ Check browser Network tab for WebSocket connection
- ✅ Should show `wss://your-app.onrender.com` (not localhost)
- ✅ Test real-time notifications
- ✅ Verify email notifications work

## Troubleshooting 🔧

### Issue: WebSocket Connection Failed
**Solution:**
```bash
# Check browser console for:
# "WebSocket connection failed" 
# Make sure URL is wss:// not ws:// in production
```

### Issue: CORS Errors
**Solution:**
```javascript
// Add your domain to CORS origins in server.js
const allowedOrigins = [
  'https://your-app.onrender.com',
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL,
];
```

### Issue: API Calls Failing
**Solution:**
```bash
# Check environment variables are set on Render
# Verify API URLs in browser console
# Check server logs on Render dashboard
```

### Issue: Email Notifications Not Sending
**Solution:**
```bash
# Verify these environment variables on Render:
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password  # Use App Password!
```

## Database Setup 💾

### MongoDB Atlas Configuration:
1. **Create MongoDB Atlas account**
2. **Create cluster and database**
3. **Whitelist Render IP ranges** (or use 0.0.0.0/0 for all)
4. **Get connection string:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/rental-management
   ```
5. **Add as `MONGODB_URI` environment variable on Render**

## Security Checklist ✅

- [ ] Strong JWT secret (minimum 32 characters)
- [ ] MongoDB connection string secured
- [ ] Gmail App Password (not regular password) for emails
- [ ] Environment variables not committed to Git
- [ ] CORS properly configured for production domain
- [ ] HTTPS enabled (automatic on Render)

## Performance Optimization 🚀

### Frontend:
```javascript
// Vite build optimizations in vite.config.mjs
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lucide-react', 'react-hot-toast']
        }
      }
    }
  }
});
```

### Backend:
```javascript
// Compression and caching
app.use(compression());
app.use(express.static('dist', { maxAge: '1y' }));
```

## Monitoring 📊

### Render Logs:
- **View in Render Dashboard → Services → Your App → Logs**
- **Look for startup messages:**
  ```
  🚀 Rental Management Server Started!
  🌍 Environment: production
  📡 HTTP Server: https://your-app.onrender.com
  🔗 WebSocket Server: wss://your-app.onrender.com
  ```

### Health Check:
```javascript
// Built-in health endpoint
GET /health
// Returns: {"status":"OK","timestamp":"...","database":"connected"}
```

## Support 💬

### Common Commands:
```bash
# Local development
npm run dev              # Start frontend dev server
npm run server          # Start backend server
npm run start:all       # Start both (with concurrently)

# Production testing
npm run build           # Build frontend
npm run preview         # Preview built frontend
npm start              # Start production server

# Debugging
npm run server          # Check server logs
```

### Key Features Working:
- ✅ User authentication (Owner/Tenant login)
- ✅ Real-time notifications via WebSocket
- ✅ Bill generation and management
- ✅ Payment processing (Razorpay)
- ✅ Email notifications (late fees, reminders)
- ✅ Tenant and room management
- ✅ Document upload and viewing
- ✅ Excel report generation
- ✅ Mobile responsive design

---

**Last Updated:** January 2025  
**Status:** ✅ Production Ready  
**Deployment Platform:** Render (recommended)  
**Architecture:** Single Node.js service with built-in frontend serving