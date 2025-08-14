// Secure authentication middleware for IQRA2 Admin Dashboard
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require('../services/logger');
const { SECURITY_CONFIG, checkRateLimit, sanitizeInput } = require('../config/security');

// Session store (in production, use Redis or database)
const activeSessions = new Map();
const loginAttempts = new Map();
const refreshTokens = new Map(); // Store refresh tokens with user info

// Clean up expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      activeSessions.delete(sessionId);
      logger.info(`Session expired: ${sessionId}`);
    }
  }
}, 60000); // Check every minute

// Clean up old login attempts
setInterval(() => {
  const now = Date.now();
  for (const [identifier, attempts] of loginAttempts.entries()) {
    if (now > attempts.resetTime) {
      loginAttempts.delete(identifier);
    }
  }
}, 300000); // Check every 5 minutes

// Clean up expired refresh tokens
setInterval(() => {
  const now = Date.now();
  for (const [token, tokenData] of refreshTokens.entries()) {
    if (now > tokenData.expiresAt) {
      refreshTokens.delete(token);
    }
  }
}, 600000); // Clean up every 10 minutes

// Generate secure session ID
const generateSessionId = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// Generate secure refresh token
const generateRefreshToken = () => {
  return require('crypto').randomBytes(64).toString('hex');
};

// Store refresh token
const storeRefreshToken = (refreshToken, userData) => {
  const expiresAt = Date.now() + SECURITY_CONFIG.auth.refreshTokenExpiry;
  
  refreshTokens.set(refreshToken, {
    userId: userData.id,
    username: userData.username,
    role: userData.role,
    permissions: userData.permissions,
    sessionId: userData.sessionId,
    createdAt: new Date().toISOString(),
    expiresAt,
    lastUsed: Date.now()
  });
  
  logger.info(`Refresh token stored for user: ${userData.username}`);
};

// Validate refresh token
const validateRefreshToken = (refreshToken) => {
  const tokenData = refreshTokens.get(refreshToken);
  
  if (!tokenData) {
    return null;
  }
  
  if (Date.now() > tokenData.expiresAt) {
    refreshTokens.delete(refreshToken);
    return null;
  }
  
  // Update last used timestamp
  tokenData.lastUsed = Date.now();
  refreshTokens.set(refreshToken, tokenData);
  
  return tokenData;
};

// Revoke refresh token
const revokeRefreshToken = (refreshToken) => {
  if (refreshTokens.has(refreshToken)) {
    const tokenData = refreshTokens.get(refreshToken);
    refreshTokens.delete(refreshToken);
    logger.info(`Refresh token revoked for user: ${tokenData.username}`);
    return true;
  }
  return false;
};

// Revoke all refresh tokens for a user
const revokeAllRefreshTokensForUser = (userId) => {
  let revokedCount = 0;
  for (const [token, tokenData] of refreshTokens.entries()) {
    if (tokenData.userId === userId) {
      refreshTokens.delete(token);
      revokedCount++;
    }
  }
  if (revokedCount > 0) {
    logger.info(`Revoked ${revokedCount} refresh tokens for user ID: ${userId}`);
  }
  return revokedCount;
};

// Get active refresh tokens for a user
const getActiveRefreshTokensForUser = (userId) => {
  const userTokens = [];
  for (const [token, tokenData] of refreshTokens.entries()) {
    if (tokenData.userId === userId) {
      userTokens.push({
        token: token.substring(0, 16) + '...', // Only show partial token
        createdAt: tokenData.createdAt,
        lastUsed: tokenData.lastUsed,
        expiresAt: tokenData.expiresAt
      });
    }
  }
  return userTokens;
};

// Create session with refresh token
const createSession = (user) => {
  const sessionId = generateSessionId();
  const refreshToken = generateRefreshToken();
  const expiresAt = Date.now() + SECURITY_CONFIG.auth.sessionTimeout;
  
  const session = {
    id: sessionId,
    userId: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions,
    createdAt: new Date().toISOString(),
    expiresAt,
    lastActivity: Date.now(),
    ipAddress: null, // Will be set by request
    userAgent: null, // Will be set by request
  };
  
  activeSessions.set(sessionId, session);
  
  // Store refresh token
  storeRefreshToken(refreshToken, {
    id: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions,
    sessionId: sessionId
  });
  
  logger.info(`Session created for user: ${user.username} with refresh token`);
  
  return { session, refreshToken };
};

// Validate session
const validateSession = (sessionId) => {
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(sessionId);
    logger.info(`Session expired: ${sessionId}`);
    return null;
  }
  
  // Update last activity
  session.lastActivity = Date.now();
  activeSessions.set(sessionId, session);
  
  return session;
};

// Check login attempts
const checkLoginAttempts = (identifier) => {
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    return { allowed: true, remaining: SECURITY_CONFIG.auth.maxLoginAttempts };
  }
  
  const now = Date.now();
  
  if (now > attempts.resetTime) {
    loginAttempts.delete(identifier);
    return { allowed: true, remaining: SECURITY_CONFIG.auth.maxLoginAttempts };
  }
  
  if (attempts.count >= SECURITY_CONFIG.auth.maxLoginAttempts) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: attempts.resetTime,
      retryAfter: Math.ceil((attempts.resetTime - now) / 1000)
    };
  }
  
  return { 
    allowed: true, 
    remaining: SECURITY_CONFIG.auth.maxLoginAttempts - attempts.count 
  };
};

// Record login attempt
const recordLoginAttempt = (identifier, success) => {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || {
    count: 0,
    resetTime: now + SECURITY_CONFIG.auth.lockoutDuration
  };
  
  if (success) {
    loginAttempts.delete(identifier);
    logger.info(`Successful login for: ${identifier}`);
  } else {
    attempts.count++;
    attempts.resetTime = now + SECURITY_CONFIG.auth.lockoutDuration;
    loginAttempts.set(identifier, attempts);
    
    logger.warn(`Failed login attempt for: ${identifier} (${attempts.count}/${SECURITY_CONFIG.auth.maxLoginAttempts})`);
    
    if (attempts.count >= SECURITY_CONFIG.auth.maxLoginAttempts) {
      logger.error(`Account locked for: ${identifier} until ${new Date(attempts.resetTime).toISOString()}`);
    }
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  try {
    // Check rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    const rateLimit = checkRateLimit(clientIp, 'auth');
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${rateLimit.retryAfter} seconds.`,
        retryAfter: rateLimit.retryAfter
      });
    }
    
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
    }
    
    // Verify JWT token
    jwt.verify(token, SECURITY_CONFIG.auth.jwtSecret, (err, decoded) => {
      if (err) {
        logger.warn(`Invalid JWT token: ${err.message}`);
        return res.status(403).json({
          success: false,
          error: 'Invalid token',
          message: 'Token is invalid or expired'
        });
      }
      
      // Validate session
      const session = validateSession(decoded.sessionId);
      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Session expired',
          message: 'Your session has expired. Please log in again.'
        });
      }
      
      // Set user info in request
      req.user = {
        id: session.userId,
        username: session.username,
        role: session.role,
        permissions: session.permissions,
        sessionId: session.id
      };
      
      // Update session with request info
      session.ipAddress = clientIp;
      session.userAgent = req.headers['user-agent'];
      activeSessions.set(session.id, session);
      
      next();
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Permission checking middleware
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }
    
    if (!req.user.permissions.includes(permission)) {
      logger.warn(`Permission denied: ${req.user.username} tried to access ${permission}`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `You don't have permission to ${permission}`
      });
    }
    
    next();
  };
};

// Role checking middleware
const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }
    
    if (req.user.role !== role) {
      logger.warn(`Role denied: ${req.user.username} (${req.user.role}) tried to access ${role} role`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient role',
        message: `You need ${role} role to access this resource`
      });
    }
    
    next();
  };
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  
  if (req.user.role !== 'admin') {
    logger.warn(`Admin access denied: ${req.user.username} (${req.user.role})`);
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      message: 'You need admin privileges to access this resource'
    });
  }
  
  next();
};

// Input sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key]);
      }
    });
  }
  
  // Sanitize URL parameters
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeInput(req.params[key]);
      }
    });
  }
  
  next();
};

// Logging middleware
const logRequest = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      username: req.user?.username
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Request completed with error:', logData);
    } else {
      logger.info('Request completed:', logData);
    }
  });
  
  next();
};

module.exports = {
  authenticateToken,
  checkPermission,
  checkRole,
  requireAdmin,
  sanitizeRequest,
  logRequest,
  createSession,
  validateSession,
  checkLoginAttempts,
  recordLoginAttempt,
  activeSessions,
  loginAttempts,
  // Refresh token functions
  generateRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  getActiveRefreshTokensForUser,
  refreshTokens
};
