const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dbService = require('./services/databaseService');
const performanceMonitor = require('./services/performanceMonitor');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  // Add your production domains here
  'https://certificate-frontend.onrender.com'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (SRS NFR3: Support 10,000+ certificates)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use('/api/', limiter);

// Static files - Serve generated certificates
app.use('/certificates/img', express.static(path.join(__dirname, 'Generated-Certificates/IMG')));
app.use('/certificates/pdf', express.static(path.join(__dirname, 'Generated-Certificates/PDF')));

// Serve static frontend files (for combined deployment)
app.use(express.static(path.join(__dirname, '../Frontend/static')));
app.use(express.static(path.join(__dirname, '../Frontend/React/build')));

// Performance monitoring setup
performanceMonitor.on('performanceAlert', (alert) => {
  console.warn(`⚠️ Performance Alert: ${alert.message}`);
  // In production, you might want to send this to a monitoring service
});

// Database connection test
async function testConnection() {
  const isConnected = await dbService.testConnection();
  if (!isConnected) {
    console.error('❌ Failed to connect to database. Check your configuration.');
    process.exit(1);
  }
}

// Routes
app.use('/api/forms', require('./API/forms'));
app.use('/api/certificates', require('./API/certificates'));
app.use('/api/verify', require('./API/verify'));
app.use('/api/admin', require('./API/admin'));

// Performance monitoring endpoint
app.get('/api/performance', (req, res) => {
  const report = performanceMonitor.generateReport();
  res.json(report);
});

// Health check endpoint (SRS requirement)
app.get('/health', (req, res) => {
  const health = performanceMonitor.getSystemHealth();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: health,
    database: dbService.dbType,
    version: '1.0.0'
  });
});

// Root endpoint (SRS API documentation)
app.get('/', (req, res) => {
  res.json({
    message: 'Certificate Automation Backend API',
    version: '1.0.0',
    srs_compliance: {
      database: dbService.dbType,
      formats: ['IMG', 'PDF'],
      performance_target: '<5 seconds',
      security: 'Encrypted QR codes',
      scalability: '10,000+ certificates'
    },
    endpoints: {
      forms: '/api/forms',
      certificates: '/api/certificates',
      verify: '/api/verify',
      admin: '/api/admin',
      performance: '/api/performance',
      health: '/health'
    },
    forms: {
      student: process.env.STUDENT_FORM_URL || 'https://forms.gle/UygoiVrfaKi3A3z59',
      trainer: process.env.TRAINER_FORM_URL,
      trainee: process.env.TRAINEE_FORM_URL
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl
  });
});

// Serve React app for all non-API routes (client-side routing)
app.get('*', (req, res) => {
  // Check if React build exists, otherwise fallback to static
  const reactBuildPath = path.join(__dirname, '../Frontend/React/build/index.html');
  const staticPath = path.join(__dirname, '../Frontend/static/index.html');
  
  if (require('fs').existsSync(reactBuildPath)) {
    res.sendFile(reactBuildPath);
  } else {
    res.sendFile(staticPath);
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});

// Export for testing
module.exports = { app, dbService, performanceMonitor };
