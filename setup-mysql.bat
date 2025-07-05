@echo off
setlocal enabledelayedexpansion

:: MySQL Setup Script for Certificate System (Windows)
:: This script sets up the MySQL database for the Certificate Generation & Verification System

echo 🗄️  Setting up MySQL Database for Certificate System...

:: Check if MySQL is installed
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MySQL is not installed or not in PATH.
    echo Please install MySQL and add it to your PATH.
    echo Download from: https://dev.mysql.com/downloads/mysql/
    pause
    exit /b 1
)

:: Database configuration
set DB_NAME=certificate_db
set SCHEMA_FILE=database\schema.sql

echo 📊 Database: %DB_NAME%
echo 📄 Schema file: %SCHEMA_FILE%

:: Check if schema file exists
if not exist "%SCHEMA_FILE%" (
    echo ❌ Schema file not found: %SCHEMA_FILE%
    echo Please make sure you're running this script from the project root directory.
    pause
    exit /b 1
)

:: Prompt for MySQL credentials
echo.
echo 🔐 Please enter your MySQL credentials:
set /p DB_HOST="MySQL Host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="MySQL Port (default: 3306): "
if "%DB_PORT%"=="" set DB_PORT=3306

set /p DB_USER="MySQL Username (default: root): "
if "%DB_USER%"=="" set DB_USER=root

:: Hide password input (basic method)
echo MySQL Password (will be hidden):
powershell -Command "$password = Read-Host 'Enter Password' -AsSecureString; $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password); $password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR); echo $password" > temp_password.txt
set /p DB_PASSWORD=<temp_password.txt
del temp_password.txt

:: Test MySQL connection
echo.
echo 🔗 Testing MySQL connection...
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% -e "SELECT 1;" >nul 2>nul

if %errorlevel% equ 0 (
    echo ✅ MySQL connection successful!
) else (
    echo ❌ Failed to connect to MySQL. Please check your credentials.
    pause
    exit /b 1
)

:: Create database and run schema
echo.
echo 🏗️  Creating database and running schema...
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% < "%SCHEMA_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Database schema created successfully!
) else (
    echo ❌ Failed to create database schema.
    pause
    exit /b 1
)

:: Update .env file
set ENV_FILE=server\.env
echo.
echo 📝 Updating environment configuration...

:: Create backup of existing .env
if exist "%ENV_FILE%" (
    copy "%ENV_FILE%" "%ENV_FILE%.backup" >nul
    echo 📄 Backup created: %ENV_FILE%.backup
)

:: Update .env file with MySQL configuration
(
echo # Environment Variables
echo PORT=5000
echo.
echo # MongoDB Configuration ^(existing^)
echo MONGODB_URI=mongodb://localhost:27017/certificate_db
echo.
echo # MySQL Database Configuration
echo DB_HOST=%DB_HOST%
echo DB_PORT=%DB_PORT%
echo DB_NAME=%DB_NAME%
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo.
echo NODE_ENV=development
echo JWT_SECRET=your_jwt_secret_key_here
echo FRONTEND_URL=http://localhost:3000
) > "%ENV_FILE%"

echo ✅ Environment file updated: %ENV_FILE%

:: Test database connection with Node.js
echo.
echo 🧪 Testing Node.js database connection...
cd server
node -e "const { testConnection } = require('./config/database'); testConnection().then(success => { if (success) { console.log('✅ Node.js MySQL connection test passed!'); process.exit(0); } else { console.log('❌ Node.js MySQL connection test failed!'); process.exit(1); } }).catch(err => { console.log('❌ Error testing connection:', err.message); process.exit(1); });" 2>nul

if %errorlevel% equ 0 (
    echo ✅ All tests passed!
) else (
    echo ⚠️  Node.js connection test failed. Please check your configuration.
)

cd ..

echo.
echo 🎉 MySQL setup completed!
echo.
echo 📋 Summary:
echo    • Database: %DB_NAME%
echo    • Host: %DB_HOST%:%DB_PORT%
echo    • Tables: certificates, verification_logs, certificate_templates
echo    • Sample data: 2 test certificates inserted
echo.
echo 🚀 Next steps:
echo    1. Install dependencies: npm run install-all
echo    2. Start the application: npm run dev
echo    3. MongoDB API: http://localhost:5000/api/certificates
echo    4. MySQL API: http://localhost:5000/api/mysql/certificates
echo.
echo 📖 Documentation:
echo    • API docs: Check README.md
echo    • Database schema: database\schema.sql
echo.
pause
