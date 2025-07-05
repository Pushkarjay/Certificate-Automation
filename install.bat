@echo off
echo Installing Certificate Generation & Verification System...
echo.

echo Step 1: Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Installing backend dependencies...
call npm run install-server
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Step 3: Installing frontend dependencies...
call npm run install-client
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Configure environment files (.env)
echo 3. Run: npm run dev
echo.
echo For detailed instructions, see README.md
echo.
pause
