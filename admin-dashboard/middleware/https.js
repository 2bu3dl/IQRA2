const { logger } = require('../services/logger');

// HTTPS redirect middleware
function httpsRedirect(req, res, next) {
  // Skip redirect for health checks and local development
  if (req.path === '/health' || req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
    return next();
  }
  
  // Check if request is already HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }
  
  // Redirect HTTP to HTTPS
  const httpsUrl = `https://${req.headers.host}${req.url}`;
  logger.info(`Redirecting HTTP to HTTPS: ${req.url} -> ${httpsUrl}`);
  
  res.redirect(301, httpsUrl);
}

// HTTPS enforcement middleware (for production)
function enforceHTTPS(req, res, next) {
  // Only enforce in production
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  // Check if request is secure
  if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
    logger.warn(`Blocked non-HTTPS request: ${req.method} ${req.url} from ${req.ip}`);
    return res.status(403).json({
      error: 'HTTPS Required',
      message: 'This application requires a secure connection'
    });
  }
  
  next();
}

// Security headers for HTTPS
function securityHeaders(req, res, next) {
  // HSTS (HTTP Strict Transport Security)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
}

module.exports = {
  httpsRedirect,
  enforceHTTPS,
  securityHeaders
};
