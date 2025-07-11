@echo off
echo 🚀 Starting Certificate Automation System...
echo.

echo 📊 Checking environment...
if not exist ".env" (
    echo ❌ .env file not found! Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

echo ✅ Environment file found
echo.

echo 🔧 Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend dependency installation failed!
    pause
    exit /b 1
)

echo 🧪 Testing database connection...
call npm run test:db
if %errorlevel% neq 0 (
    echo ❌ Database connection failed! Please check your .env configuration.
    pause
    exit /b 1
)

echo ✅ Database connection successful!
echo.

echo 🎨 Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependency installation failed!
    pause
    exit /b 1
)

echo ✅ All dependencies installed successfully!
echo.

echo 🚀 Starting development servers...
echo 📊 Backend will run on: http://localhost:3000
echo 🎨 Frontend will run on: http://localhost:3001
echo.

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 5

echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ✅ Development servers started!
echo 📊 Backend: http://localhost:3000
echo 🎨 Frontend: http://localhost:3001
echo.
echo Press any key to close this window...
pause > nul
