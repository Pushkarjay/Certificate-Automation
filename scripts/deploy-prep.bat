@echo off
echo 🚀 Preparing Certificate Automation System for Production Deployment
echo ==================================================================

REM Check if we're in the correct directory
if not exist "backend" (
    echo ❌ Error: Run this script from the project root directory
    exit /b 1
)

echo 📋 Step 1: Environment Check
echo ----------------------------

echo 🔍 Checking for sensitive files...

REM Check for Google Service Account file
if exist "opportune-sylph-458214-b8-74a78b125fe6.json" (
    git ls-files "opportune-sylph-458214-b8-74a78b125fe6.json" >nul 2>&1
    if not errorlevel 1 (
        echo ⚠️  WARNING: Google Service Account file is tracked by git
        echo    Run: git rm --cached opportune-sylph-458214-b8-74a78b125fe6.json
    ) else (
        echo ✅ Google Service Account file exists but is not tracked
    )
) else (
    echo ⚠️  Google Service Account file not found
)

REM Check for .env file
if exist ".env" (
    git ls-files ".env" >nul 2>&1
    if not errorlevel 1 (
        echo ⚠️  WARNING: .env file is tracked by git
        echo    Run: git rm --cached .env
    ) else (
        echo ✅ .env file exists but is not tracked
    )
)

echo.
echo 📋 Step 2: Dependencies Check
echo -----------------------------

REM Check backend dependencies
echo 🔍 Checking backend dependencies...
cd backend
if exist "package.json" (
    npm audit --audit-level=high
    if errorlevel 1 (
        echo ⚠️  Backend has security vulnerabilities - run 'npm audit fix'
    ) else (
        echo ✅ Backend dependencies are secure
    )
)
cd ..

REM Check frontend dependencies
echo 🔍 Checking frontend dependencies...
cd frontend
if exist "package.json" (
    npm audit --audit-level=high
    if errorlevel 1 (
        echo ⚠️  Frontend has security vulnerabilities - run 'npm audit fix'
    ) else (
        echo ✅ Frontend dependencies are secure
    )
)
cd ..

echo.
echo 📋 Step 3: Build Test
echo ---------------------

REM Test backend
echo 🧪 Testing backend build...
cd backend
npm install
if errorlevel 1 (
    echo ❌ Backend dependency installation failed
    exit /b 1
) else (
    echo ✅ Backend dependencies installed successfully
)
cd ..

REM Test frontend build
echo 🧪 Testing frontend build...
cd frontend
npm install
npm run build
if errorlevel 1 (
    echo ❌ Frontend build failed
    exit /b 1
) else (
    echo ✅ Frontend build successful
    REM Clean up build folder
    if exist "build" rmdir /s /q build
)
cd ..

echo.
echo 📋 Step 4: Database Schema Check
echo --------------------------------

if exist "database\database_schema.sql" (
    echo ✅ Database schema file found
    echo 📝 Remember to run this on your production database
) else (
    echo ⚠️  Database schema file not found at database\database_schema.sql
)

echo.
echo 📋 Step 5: Google Service Account Setup
echo ---------------------------------------

if exist "opportune-sylph-458214-b8-74a78b125fe6.json" (
    echo ✅ Google Service Account file found
    echo 📝 To encode for Render environment variable:
    echo    Use online base64 encoder or PowerShell:
    echo    [Convert]::ToBase64String([IO.File]::ReadAllBytes("opportune-sylph-458214-b8-74a78b125fe6.json"^)^)
) else (
    echo ⚠️  Google Service Account file not found
    echo    Make sure opportune-sylph-458214-b8-74a78b125fe6.json exists
)

echo.
echo 📋 Step 6: Production Checklist
echo -------------------------------

echo Before deploying to Render, ensure:
echo ☐ Repository is pushed to GitHub
echo ☐ Sensitive files are in .gitignore
echo ☐ Environment variables are configured in Render dashboard
echo ☐ Database is set up and schema is applied
echo ☐ Google Forms webhook URL is updated to production endpoint
echo ☐ CORS origins include your production domain

echo.
echo 🎯 Next Steps:
echo 1. Push code to GitHub: git push origin main
echo 2. Create new Web Service on Render
echo 3. Connect your GitHub repository
echo 4. Set environment variables
echo 5. Deploy and test!

echo.
echo 🌐 Render Configuration:
echo Backend:
echo   Build Command: cd backend ^&^& npm install
echo   Start Command: cd backend ^&^& npm start
echo.
echo Frontend:
echo   Build Command: cd frontend ^&^& npm install ^&^& npm run build
echo   Publish Directory: Frontend/React/build

echo.
echo ✅ Production preparation complete!
pause
