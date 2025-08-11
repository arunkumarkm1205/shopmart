@echo off
echo Starting ShopKart E-commerce Platform...
echo.

echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Error installing backend dependencies
    pause
    exit /b 1
)

echo.
echo Starting backend server...
start "ShopKart Backend" cmd /k "npm run dev"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Opening frontend in browser...
cd ..
start "" index.html

echo.
echo ShopKart is now running!
echo Backend: http://localhost:5000
echo Frontend: Opening in your default browser
echo.
echo Press any key to exit...
pause > nul 