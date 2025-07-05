const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
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
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'production') {
      return callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificateRoutes); // MongoDB routes
app.use('/api/mysql/certificates', certificateMySQLRoutes); // MySQL routes

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the client build directory
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // Development mode - just show API info
  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'Welcome to the Certificate API',
      availableRoutes: [
        { method: 'POST', path: '/api/certificates' },
        { method: 'GET', path: '/api/certificates' },
        { method: 'GET', path: '/api/certificates/:id' },
        { method: 'GET', path: '/api/certificates/verify/:dofNo' },
        { method: 'DELETE', path: '/api/certificates/:id' },
        { method: 'POST', path: '/api/mysql/certificates' },
        { method: 'GET', path: '/api/mysql/certificates' },
        { method: 'GET', path: '/api/mysql/certificates/:id' },
        { method: 'GET', path: '/api/mysql/certificates/verify/:dofNo' },
        { method: 'DELETE', path: '/api/mysql/certificates/:id' },
        { method: 'GET', path: '/api/mysql/certificates/stats/:dofNo' }
      ]
    });
  });
}

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

// 404 handler for API routes only (React handles frontend routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Available databases: MongoDB & MySQL`);
  console.log(`🔗 MongoDB API: http://localhost:${PORT}/api/certificates`);
  console.log(`🔗 MySQL API: http://localhost:${PORT}/api/mysql/certificates`);
});
