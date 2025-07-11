const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query test successful:', rows[0]);
    
    await connection.end();
    console.log('✅ Connection closed gracefully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('📝 Please check your .env configuration:');
    console.error('   - DB_HOST:', process.env.DB_HOST);
    console.error('   - DB_PORT:', process.env.DB_PORT);
    console.error('   - DB_USER:', process.env.DB_USER);
    console.error('   - DB_NAME:', process.env.DB_NAME);
    process.exit(1);
  }
}

if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };
