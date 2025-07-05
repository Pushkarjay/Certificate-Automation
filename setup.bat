@echo off
echo =============================================
echo Certificate Generation System - Setup
echo =============================================
echo.

echo [1/4] Installing root dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Installing server dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)

echo.
echo [3/4] Installing client dependencies...
cd ..\client
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install client dependencies
    pause
    exit /b 1
)

echo.
echo [4/4] Setup complete!
cd ..

echo.
echo =============================================
echo Setup completed successfully!
echo =============================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Update server/.env with your MongoDB URI
echo 3. Update client/.env with your API URL
echo 4. Run 'npm run dev' to start the application
echo.
echo Commands:
echo   npm run dev     - Start both frontend and backend
echo   npm run server  - Start backend only
echo   npm run client  - Start frontend only
echo.
pause
