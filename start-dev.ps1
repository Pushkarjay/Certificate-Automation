# Certificate Automation System - Development Startup Script
Write-Host "🚀 Starting Certificate Automation System..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found! Please copy .env.example to .env and configure it." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green
Write-Host ""

# Install backend dependencies
Write-Host "🔧 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
} catch {
    Write-Host "❌ Backend dependency installation failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Test database connection
Write-Host "🧪 Testing database connection..." -ForegroundColor Yellow
try {
    npm run test:db
    if ($LASTEXITCODE -ne 0) { throw "Database test failed" }
} catch {
    Write-Host "❌ Database connection failed! Please check your .env configuration." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Database connection successful!" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies
Write-Host "🎨 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..\frontend
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
} catch {
    Write-Host "❌ Frontend dependency installation failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Start development servers
Write-Host "🚀 Starting development servers..." -ForegroundColor Cyan
Write-Host "📊 Backend will run on: http://localhost:3000" -ForegroundColor Blue
Write-Host "🎨 Frontend will run on: http://localhost:3001" -ForegroundColor Blue
Write-Host ""

# Go back to root directory
Set-Location ..

# Start backend server in new terminal
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait for backend to start
Start-Sleep -Seconds 5

# Start frontend server in new terminal
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host ""
Write-Host "✅ Development servers started!" -ForegroundColor Green
Write-Host "📊 Backend: http://localhost:3000" -ForegroundColor Blue
Write-Host "🎨 Frontend: http://localhost:3001" -ForegroundColor Blue
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
