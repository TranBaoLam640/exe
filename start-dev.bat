@echo off
echo Starting DoRentMe Development Environment...
echo.

REM Start Frontend (Vite React)
echo [1/2] Starting Frontend on http://localhost:5173...
start "DoRentMe Frontend" cmd /k "cd frontend && npm run dev"

REM Wait 3 seconds for frontend to initialize
timeout /t 3 /nobreak >nul

REM Start Backend API
echo [2/2] Starting Backend API on http://localhost:5000...
start "DoRentMe Backend" cmd /k "cd backend\DoRentMe.Api && dotnet run"

REM Wait 5 seconds then open browser
timeout /t 5 /nobreak >nul
echo.
echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo DoRentMe Development Environment Ready!
echo ========================================
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000
echo.
echo Press any key to stop all services...
pause >nul

REM Close all windows
taskkill /FI "WindowTitle eq DoRentMe Frontend*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq DoRentMe Backend*" /T /F >nul 2>&1
echo All services stopped.
