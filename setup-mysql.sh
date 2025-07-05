#!/bin/bash

# MySQL Setup Script for Certificate System
# This script sets up the MySQL database for the Certificate Generation & Verification System

echo "🗄️  Setting up MySQL Database for Certificate System..."

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    echo "Download from: https://dev.mysql.com/downloads/mysql/"
    exit 1
fi

# Database configuration
DB_NAME="certificate_db"
SCHEMA_FILE="database/schema.sql"

echo "📊 Database: $DB_NAME"
echo "📄 Schema file: $SCHEMA_FILE"

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Schema file not found: $SCHEMA_FILE"
    echo "Please make sure you're running this script from the project root directory."
    exit 1
fi

# Prompt for MySQL credentials
echo ""
echo "🔐 Please enter your MySQL credentials:"
read -p "MySQL Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "MySQL Port (default: 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "MySQL Username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -s -p "MySQL Password: " DB_PASSWORD
echo ""

# Test MySQL connection
echo ""
echo "🔗 Testing MySQL connection..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ MySQL connection successful!"
else
    echo "❌ Failed to connect to MySQL. Please check your credentials."
    exit 1
fi

# Create database and run schema
echo ""
echo "🏗️  Creating database and running schema..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" < "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
else
    echo "❌ Failed to create database schema."
    exit 1
fi

# Update .env file
ENV_FILE="server/.env"
echo ""
echo "📝 Updating environment configuration..."

# Create backup of existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup"
    echo "📄 Backup created: $ENV_FILE.backup"
fi

# Update .env file with MySQL configuration
cat > "$ENV_FILE" << EOF
# Environment Variables
PORT=5000

# MongoDB Configuration (existing)
MONGODB_URI=mongodb://localhost:27017/certificate_db

# MySQL Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000
EOF

echo "✅ Environment file updated: $ENV_FILE"

# Test database connection with Node.js
echo ""
echo "🧪 Testing Node.js database connection..."
cd server
node -e "
const { testConnection } = require('./config/database');
testConnection().then(success => {
    if (success) {
        console.log('✅ Node.js MySQL connection test passed!');
        process.exit(0);
    } else {
        console.log('❌ Node.js MySQL connection test failed!');
        process.exit(1);
    }
}).catch(err => {
    console.log('❌ Error testing connection:', err.message);
    process.exit(1);
});
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "⚠️  Node.js connection test failed. Please check your configuration."
fi

cd ..

echo ""
echo "🎉 MySQL setup completed!"
echo ""
echo "📋 Summary:"
echo "   • Database: $DB_NAME"
echo "   • Host: $DB_HOST:$DB_PORT"
echo "   • Tables: certificates, verification_logs, certificate_templates"
echo "   • Sample data: 2 test certificates inserted"
echo ""
echo "🚀 Next steps:"
echo "   1. Install dependencies: npm run install-all"
echo "   2. Start the application: npm run dev"
echo "   3. MongoDB API: http://localhost:5000/api/certificates"
echo "   4. MySQL API: http://localhost:5000/api/mysql/certificates"
echo ""
echo "📖 Documentation:"
echo "   • API docs: Check README.md"
echo "   • Database schema: database/schema.sql"
echo ""
