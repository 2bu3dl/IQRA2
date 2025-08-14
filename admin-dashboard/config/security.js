// Security configuration for IQRA2 Admin Dashboard
require('dotenv').config();

const SECURITY_CONFIG = {
  // Authentication settings
  auth: {
    jwtSecret: process.env.JWT_SECRET || (() => {
      throw new Error('JWT_SECRET environment variable is required');
    })(),
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || (() => {
      throw new Error('REFRESH_TOKEN_SECRET environment variable is required');
    })(),
    passwordMinLength: 12,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    refreshTokenRotation: true, // Enable refresh token rotation
    maxRefreshTokensPerUser: 5, // Maximum active refresh tokens per user
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // requests per window
    authWindowMs: 5 * 60 * 1000, // 5 minutes for auth endpoints
    maxAuthRequests: 10, // auth requests per window
    refreshWindowMs: 1 * 60 * 1000, // 1 minute for refresh endpoints
    maxRefreshRequests: 5, // refresh requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // CORS settings
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'https://admin.iqra2.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  },

  // Helmet security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "ws:", "wss:", "https:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  },

  // Database security
  database: {
    maxConnections: 10,
    connectionTimeout: 30000,
    queryTimeout: 10000,
    enableLogging: process.env.NODE_ENV === 'development',
    sanitizeInputs: true,
    usePreparedStatements: true,
  },

  // Session management
  session: {
    secret: process.env.SESSION_SECRET || (() => {
      throw new Error('SESSION_SECRET environment variable is required');
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 60 * 1000, // 30 minutes
      sameSite: 'strict',
    },
  },

  // Logging and monitoring
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logAuthAttempts: true,
    logSecurityEvents: true,
    logDatabaseQueries: process.env.NODE_ENV === 'development',
    logPerformanceMetrics: true,
  },

  // Environment-specific settings
  environment: {
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
  },
};

// Password validation function
const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < SECURITY_CONFIG.auth.passwordMinLength) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.auth.passwordMinLength} characters long`);
  }
  
  if (SECURITY_CONFIG.auth.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (SECURITY_CONFIG.auth.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (SECURITY_CONFIG.auth.passwordRequireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (SECURITY_CONFIG.auth.passwordRequireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const weakPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'dragon', 'master', 'football', 'superman', 'trustno1'
  ];
  
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }
  
  // Check for sequential characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password contains too many repeated characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove remaining < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

const getRateLimitKey = (identifier, type = 'general') => {
  return `${type}:${identifier}`;
};

const checkRateLimit = (identifier, type = 'general') => {
  const key = getRateLimitKey(identifier, type);
  const now = Date.now();
  
  let config;
  switch (type) {
    case 'auth':
      config = { 
        windowMs: SECURITY_CONFIG.rateLimit.authWindowMs, 
        maxRequests: SECURITY_CONFIG.rateLimit.maxAuthRequests 
      };
      break;
    case 'refresh':
      config = { 
        windowMs: SECURITY_CONFIG.rateLimit.refreshWindowMs, 
        maxRequests: SECURITY_CONFIG.rateLimit.maxRefreshRequests 
      };
      break;
    default:
      config = { 
        windowMs: SECURITY_CONFIG.rateLimit.windowMs, 
        maxRequests: SECURITY_CONFIG.rateLimit.maxRequests 
      };
  }
  
  const userData = rateLimitStore.get(key) || { requests: [], resetTime: now + config.windowMs };
  
  // Clean old requests
  userData.requests = userData.requests.filter(time => now - time < config.windowMs);
  
  if (userData.requests.length >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: userData.resetTime,
      retryAfter: Math.ceil((userData.resetTime - now) / 1000)
    };
  }
  
  userData.requests.push(now);
  rateLimitStore.set(key, userData);
  
  return {
    allowed: true,
    remaining: config.maxRequests - userData.requests.length,
    resetTime: userData.resetTime
  };
};

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

module.exports = {
  SECURITY_CONFIG,
  validatePassword,
  sanitizeInput,
  checkRateLimit,
  getRateLimitKey
};
