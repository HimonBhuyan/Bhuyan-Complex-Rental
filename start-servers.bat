@echo off
echo Starting Rental Management System...
echo.

echo Starting Backend Server (MongoDB + Express)...
start "Backend Server" cmd /k "cd /d F:\RentalSystem\rental-management-system && npm run server"

timeout /t 3 /nobreak >nul

echo Starting Frontend Development Server (React + Vite)...
start "Frontend Server" cmd /k "cd /d F:\RentalSystem\rental-management-system && npm run dev"

echo.
echo Both servers are starting...
echo.
echo Backend will be available at: http://localhost:3001
echo Frontend will be available at: http://localhost:5173
echo.
echo Press any key to continue...
pause >nul