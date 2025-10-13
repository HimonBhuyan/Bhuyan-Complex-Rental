@echo off
echo Starting Real-Time Notification System...
echo.

echo Starting WebSocket Notification Server on port 3001...
start "WebSocket Server" cmd /k "node notification-server.js"

timeout /t 3 /nobreak > nul

echo Starting React App on port 3000...
start "React App" cmd /k "npm run dev"

echo.
echo ========================================
echo   WEBSOCKET REAL-TIME SYSTEM READY
echo ========================================
echo.
echo WebSocket Server: http://localhost:3001
echo React App: http://localhost:3000
echo.
echo TEST INSTRUCTIONS:
echo 1. Open Chrome: http://localhost:3000 (Login as Admin)
echo 2. Open Firefox: http://localhost:3000 (Login as Tenant)
echo 3. Send notification from Admin
echo 4. Watch it appear INSTANTLY in Firefox!
echo.
echo Status Indicators:
echo - Green LIVE = Real-time connected
echo - Red Offline = Using localStorage fallback
echo.
echo Press any key to exit...
pause > nul
