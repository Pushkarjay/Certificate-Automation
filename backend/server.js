const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const sheetsDb = require('./services/sheetsDatabase');
const performanceMonitor = require('./services/performanceMonitor');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts for the admin dashboard
        "'unsafe-eval'" // Allow eval for any dynamic content if needed
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'" // Allow inline styles
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:"
      ],
      connectSrc: [
        "'self'",
        "https://certificate-automation-dmoe.onrender.com",
        "blob:" // Allow blob URLs for certificates
      ],
      fontSrc: [
        "'self'",
        "data:"
      ],
      objectSrc: [
        "'self'",
        "blob:" // Allow blob objects for PDF display
      ],
      mediaSrc: [
        "'self'",
        "blob:" // Allow blob media for certificates
      ],
      frameSrc: [
        "'self'",
        "blob:" // Allow blob frames for PDF preview
      ]
    }
  },
  crossOriginEmbedderPolicy: false // Disable COEP to avoid issues with blob URLs
}));

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  process.env.FRONTEND_URL,
  // Add your production domains here
  'https://certificate-frontend.onrender.com',
  'https://certificate-automation-dmoe.onrender.com'
].filter(Boolean);

// More permissive CORS for admin dashboard
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, direct file access, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all localhost and 127.0.0.1 variations
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow your render domain
    if (origin.includes('certificate-automation-dmoe.onrender.com')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.log('CORS blocked origin:', origin);
    // For now, allow all origins to fix the issue
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for rate limiting behind reverse proxy (Render)
app.set('trust proxy', 1);

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
// Static file serving for certificates
app.use('/certificates/pdf', express.static(path.join(__dirname, 'Generated-Certificates/PDF')));

// Serve static frontend files (for combined deployment)
app.use(express.static(path.join(__dirname, '../Frontend/static')));
app.use(express.static(path.join(__dirname, '../Frontend/React/build')));

// Serve admin dashboard
app.use('/admin', express.static(path.join(__dirname, '../')));

// Serve admin dashboard at root path when accessed with specific file
app.get('/admin-dashboard.html', (req, res) => {
  // Prevent caching to ensure latest version is always served
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    // More permissive CSP for admin dashboard
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://certificate-automation-dmoe.onrender.com; font-src 'self' data:; object-src 'none';"
  });
  res.sendFile(path.join(__dirname, '../Frontend/admin-dashboard.html'));
});

// Performance monitoring setup
performanceMonitor.on('performanceAlert', (alert) => {
  console.warn(`⚠️ Performance Alert: ${alert.message}`);
  // In production, you might want to send this to a monitoring service
});

// Google Sheets Database connection test
async function testConnection() {
  console.log('🔄 Testing Google Sheets Database connection...');
  const isConnected = await sheetsDb.testConnection();
  if (!isConnected) {
    console.error('❌ Failed to connect to Google Sheets Database. Check your configuration.');
    console.error('📝 Make sure GOOGLE_SERVICE_ACCOUNT_KEY environment variable is set');
    // process.exit(1); // Commented out for debugging
  } else {
    console.log('✅ Google Sheets Database connected successfully');
  }
}

// Google Sheets-served certificate files (replaces database file serving)
// Certificates are now stored as base64 data in Google Sheets
app.get('/certificates/pdf/:refNo.pdf', (req, res) => {
  res.redirect(`/api/certificate-files/${req.params.refNo}/pdf`);
});

// Legacy static file serving (fallback for existing files)
app.use('/certificates/pdf', express.static(path.join(__dirname, 'Generated-Certificates/PDF')));

// Routes
app.use('/api/forms', require('./API/forms'));
app.use('/api/certificates', require('./API/certificates'));
app.use('/api/verify', require('./API/verify'));
app.use('/api/admin', require('./API/admin'));
app.use('/api/certificate-files', require('./API/certificate-files'));

// Performance monitoring endpoint
app.get('/api/performance', (req, res) => {
  const report = performanceMonitor.generateReport();
  res.json(report);
});

// Health check endpoint (SRS requirement)
app.get('/health', async (req, res) => {
  const health = performanceMonitor.getSystemHealth();
  const sheetsConnected = await sheetsDb.testConnection();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: health,
    database: 'Google Sheets',
    sheetsConnection: sheetsConnected,
    version: '2.0.0',
    features: ['Google Sheets Database', 'Certificate Generation', 'Multi-Form Support']
  });
});

// Serve admin dashboard
app.get('/admin-dashboard', (req, res) => {
  // Prevent caching to ensure latest version is always served
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    // More permissive CSP for admin dashboard
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://certificate-automation-dmoe.onrender.com; font-src 'self' data:; object-src 'none';"
  });
  res.sendFile(path.join(__dirname, '../admin-dashboard.html'));
});

// Serve verification page at /verify/:refNo (React app)
app.get('/verify/:refNo?', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/React/build/index.html'));
});

// Serve React app at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/React/build/index.html'));
});

// Handle React Router - serve React app for any non-API routes
app.get('*', (req, res) => {
  // Don't serve React for API routes or admin routes
  if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, '../Frontend/React/build/index.html'));
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
module.exports = { app, sheetsDb, performanceMonitor };
