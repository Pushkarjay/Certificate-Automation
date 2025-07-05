const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database configurations
const { testConnection: testMySQLConnection } = require('./config/database');

// Import routes
const certificateRoutes = require('./routes/certificates');
const certificateMySQLRoutes = require('./routes/certificatesMySQL');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const claimRoutes = require('./routes/claims');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connections
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/certificate_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// MySQL connection test
testMySQLConnection();

// Routes
app.use('/api/certificates', certificateRoutes); // MongoDB routes
app.use('/api/mysql/certificates', certificateMySQLRoutes); // MySQL routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/users', userRoutes); // User profile routes
app.use('/api/claims', claimRoutes); // Certificate claiming routes
app.use('/api/admin', adminRoutes); // Admin management routes

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const mysqlStatus = await testMySQLConnection() ? 'connected' : 'disconnected';
  
  res.status(200).json({ 
    status: 'OK', 
    message: 'Certificate API is running',
    databases: {
      mongodb: mongoStatus,
      mysql: mysqlStatus
    },
    timestamp: new Date().toISOString()
  });
});

// Database selection endpoint
app.get('/api/databases', (req, res) => {
  res.status(200).json({
    available: ['mongodb', 'mysql'],
    endpoints: {
      mongodb: '/api/certificates',
      mysql: '/api/mysql/certificates'
    },
    features: {
      mongodb: {
        description: 'NoSQL database with flexible schema',
        endpoints: [
          'POST /api/certificates',
          'GET /api/certificates',
          'GET /api/certificates/:id',
          'GET /api/certificates/verify/:dofNo',
          'DELETE /api/certificates/:id'
        ]
      },
      mysql: {
        description: 'Relational database with structured schema',
        endpoints: [
          'POST /api/mysql/certificates',
          'GET /api/mysql/certificates',
          'GET /api/mysql/certificates/:id',
          'GET /api/mysql/certificates/verify/:dofNo',
          'DELETE /api/mysql/certificates/:id',
          'GET /api/mysql/certificates/stats/:dofNo'
        ]
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Available databases: MongoDB & MySQL`);
  console.log(`🔗 MongoDB API: http://localhost:${PORT}/api/certificates`);
  console.log(`🔗 MySQL API: http://localhost:${PORT}/api/mysql/certificates`);
});
