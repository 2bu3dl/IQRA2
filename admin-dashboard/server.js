const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import SSL configuration
const { getSSLConfig, validateSSLFiles, createHTTPSOptions } = require('./config/ssl');

// Import security configuration
const { SECURITY_CONFIG } = require('./config/security');
const { logRequest, sanitizeRequest } = require('./middleware/auth');
const { httpsRedirect, enforceHTTPS, securityHeaders } = require('./middleware/https');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const monitoringRoutes = require('./routes/monitoring');
const testingRoutes = require('./routes/testing');
const securityRoutes = require('./routes/security');
const analyticsRoutes = require('./routes/analytics');
const iqra2Routes = require('./routes/iqra2');

// Import services
const { logger } = require('./services/logger');
const { initializeDatabase } = require('./services/database');
const { initializeMonitoring } = require('./services/monitoring');

const app = express();

// Create HTTP server
const httpServer = http.createServer(app);

// Create HTTPS server if SSL is enabled
let httpsServer = null;
let io = null;

const sslConfig = getSSLConfig();
if (sslConfig.enabled) {
  try {
    const httpsOptions = createHTTPSOptions();
    if (httpsOptions) {
      httpsServer = https.createServer(httpsOptions, app);
      io = socketIo(httpsServer, {
        cors: {
          origin: process.env.FRONTEND_URL || "https://localhost:5002",
          methods: ["GET", "POST"]
        }
      });
      logger.info('✅ HTTPS server created successfully');
    }
  } catch (error) {
    logger.error('❌ Failed to create HTTPS server:', error.message);
    logger.info('🔄 Falling back to HTTP server');
  }
}

// Fallback to HTTP if HTTPS failed
if (!httpsServer) {
  io = socketIo(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });
}

// Security middleware with comprehensive protection
app.use(helmet(SECURITY_CONFIG.helmet));

// HTTPS and security headers
app.use(securityHeaders);
app.use(enforceHTTPS);
app.use(httpsRedirect);

// Rate limiting is now handled by the security middleware

// Middleware
app.use(cors(SECURITY_CONFIG.cors));
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(sanitizeRequest);
app.use(logRequest);

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Serve favicon and other static assets
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get('/apple-touch-icon.png', (req, res) => {
  res.status(404).send('Not found');
});

app.get('/apple-touch-icon-precomposed.png', (req, res) => {
  res.status(404).send('Not found');
});

// Serve the main dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test page
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Debug endpoint to test API directly
app.get('/debug-api', (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    url: req.url,
    method: req.method
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes.router);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/testing', testingRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/iqra2', iqra2Routes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-dashboard', (room) => {
    socket.join(room);
    logger.info(`Client ${socket.id} joined room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services
async function initializeApp() {
  try {
    await initializeDatabase();
    await initializeMonitoring(io);
    
    const PORT = process.env.PORT || 5001;
    const HTTPS_PORT = sslConfig.enabled ? sslConfig.port : null;
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Admin Dashboard HTTP Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔒 Security dashboard: http://localhost:${PORT}/api/security`);
      logger.info(`📈 Monitoring: http://localhost:${PORT}/api/monitoring`);
    });
    
    // Start HTTPS server if enabled
    if (httpsServer && HTTPS_PORT) {
      httpsServer.listen(HTTPS_PORT, () => {
        logger.info(`🔒 Admin Dashboard HTTPS Server running on port ${HTTPS_PORT}`);
        logger.info(`📊 Health check: https://localhost:${HTTPS_PORT}/health`);
        logger.info(`🔒 Security dashboard: https://localhost:${HTTPS_PORT}/api/security`);
        logger.info(`📈 Monitoring: https://localhost:${HTTPS_PORT}/api/monitoring`);
        logger.info(`⚠️  Note: Using self-signed certificate (browser will show warning)`);
      });
    }
  } catch (error) {
    logger.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    if (httpsServer) {
      httpsServer.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    } else {
      logger.info('Process terminated');
      process.exit(0);
    }
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    if (httpsServer) {
      httpsServer.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    } else {
      logger.info('Process terminated');
      process.exit(0);
    }
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

initializeApp();

module.exports = { app, httpServer, httpsServer, io }; 