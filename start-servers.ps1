Write-Host "Starting Rental Management System..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting Backend Server (MongoDB + Express)..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd 'F:\RentalSystem\rental-management-system'; npm run server"

Start-Sleep -Seconds 3

Write-Host "Starting Frontend Development Server (React + Vite)..." -ForegroundColor Yellow  
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd 'F:\RentalSystem\rental-management-system'; npm run dev"

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend will be available at: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test page with diagnostics: http://localhost:5173" -ForegroundColor Magenta
Write-Host "Login page: http://localhost:5173/login" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")