const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { logger } = require('../services/logger');
const { SECURITY_CONFIG, validatePassword } = require('../config/security');
const { 
  authenticateToken, 
  checkPermission, 
  requireAdmin, 
  createSession, 
  checkLoginAttempts, 
  recordLoginAttempt,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  getActiveRefreshTokensForUser
} = require('../middleware/auth');

// Database service for user management
const { DatabaseService } = require('../services/database');
const dbService = new DatabaseService();

// Initialize database connection
(async () => {
  try {
    await dbService.initialize();
    logger.info('Database service initialized for auth routes');
  } catch (error) {
    logger.error('Failed to initialize database service:', error);
  }
})();

// JWT secret from security config
const JWT_SECRET = SECURITY_CONFIG.auth.jwtSecret;

// Using imported middleware from auth.js

// Login endpoint
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check login attempts
    const loginCheck = checkLoginAttempts(username);
    if (!loginCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Account temporarily locked',
        message: `Too many failed login attempts. Try again in ${loginCheck.retryAfter} seconds.`,
        retryAfter: loginCheck.retryAfter
      });
    }
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      recordLoginAttempt(username, false);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    // Find user in database
    const user = await dbService.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      recordLoginAttempt(username, false);
      logger.warn(`Failed login attempt for username: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      recordLoginAttempt(username, false);
      logger.warn(`Failed login attempt for user: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Record successful login
    recordLoginAttempt(username, true);

    // Create session with refresh token
    const { session, refreshToken } = createSession(user);

    // Generate JWT token with session ID
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        permissions: user.permissions,
        sessionId: session.id
      },
      JWT_SECRET,
      { expiresIn: SECURITY_CONFIG.auth.jwtExpiry }
    );

    // Generate refresh token JWT
    const refreshTokenJWT = jwt.sign(
      {
        token: refreshToken,
        userId: user.id,
        type: 'refresh'
      },
      SECURITY_CONFIG.auth.refreshTokenSecret,
      { expiresIn: SECURITY_CONFIG.auth.refreshTokenExpiry }
    );

    // Update last login in database
    await dbService.run('UPDATE users SET last_login = ? WHERE id = ?', [new Date().toISOString(), user.id]);

    logger.info(`Successful login for user: ${username}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          lastLogin: user.lastLogin
        },
        token,
        refreshToken: refreshTokenJWT,
        expiresIn: SECURITY_CONFIG.auth.jwtExpiry,
        refreshExpiresIn: SECURITY_CONFIG.auth.refreshTokenExpiry
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

// Register endpoint (admin only)
router.post('/register', [
  authenticateToken,
  requireAdmin,
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['admin', 'monitor', 'user']).withMessage('Valid role is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, role } = req.body;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password validation failed',
        message: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await dbService.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        message: 'Username or email is already taken'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in database
    const permissions = role === 'admin' ? ['read', 'write', 'delete', 'admin'] : 
                       role === 'monitor' ? ['read'] : ['read'];
    
    const result = await dbService.run(`
      INSERT INTO users (username, email, password, role, permissions, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [username, email, hashedPassword, role, JSON.stringify(permissions), new Date().toISOString()]);
    
    const newUser = await dbService.get('SELECT * FROM users WHERE username = ?', [username]);

    logger.info(`New user registered: ${username} by admin: ${req.user.username}`);

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions,
        createdAt: newUser.createdAt
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbService.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: 'An error occurred while fetching profile'
    });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    const { email, password } = req.body;

    // Update email if provided
    if (email && email !== user.email) {
      const existingEmail = users.find(u => u.email === email && u.id !== user.id);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email already taken',
          message: 'This email is already in use'
        });
      }
      user.email = email;
    }

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    logger.info(`Profile updated for user: ${user.username}`);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: 'An error occurred while updating profile'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
  try {
    // Revoke all refresh tokens for the user
    const revokedCount = revokeAllRefreshTokensForUser(req.user.id);
    
    logger.info(`User logged out: ${req.user.username} (revoked ${revokedCount} refresh tokens)`);
    
    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    // Check rate limiting for refresh endpoint
    const clientIp = req.ip || req.connection.remoteAddress;
    const rateLimit = require('../config/security').checkRateLimit(clientIp, 'refresh');
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many refresh attempts. Try again in ${rateLimit.retryAfter} seconds.`,
        retryAfter: rateLimit.retryAfter
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // Verify refresh token JWT
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, SECURITY_CONFIG.auth.refreshTokenSecret);
    } catch (error) {
      logger.warn(`Invalid refresh token JWT: ${error.message}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired'
      });
    }

    // Validate the actual refresh token
    const tokenData = validateRefreshToken(decoded.token);
    if (!tokenData) {
      logger.warn(`Invalid or expired refresh token for user ID: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired'
      });
    }

    // Find user in database
    const user = await dbService.get('SELECT * FROM users WHERE id = ?', [tokenData.userId]);
    if (!user) {
      logger.warn(`User not found for refresh token: ${tokenData.userId}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'User not found'
      });
    }

    // Create new session and refresh token (token rotation)
    const { session, refreshToken: newRefreshToken } = createSession(user);

    // Generate new JWT token
    const newToken = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        permissions: user.permissions,
        sessionId: session.id
      },
      JWT_SECRET,
      { expiresIn: SECURITY_CONFIG.auth.jwtExpiry }
    );

    // Generate new refresh token JWT
    const newRefreshTokenJWT = jwt.sign(
      {
        token: newRefreshToken,
        userId: user.id,
        type: 'refresh'
      },
      SECURITY_CONFIG.auth.refreshTokenSecret,
      { expiresIn: SECURITY_CONFIG.auth.refreshTokenExpiry }
    );

    // Revoke old refresh token (token rotation)
    if (SECURITY_CONFIG.auth.refreshTokenRotation) {
      revokeRefreshToken(decoded.token);
    }

    logger.info(`Token refreshed for user: ${user.username}`);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshTokenJWT,
        expiresIn: SECURITY_CONFIG.auth.jwtExpiry,
        refreshExpiresIn: SECURITY_CONFIG.auth.refreshTokenExpiry
      },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: 'An error occurred during token refresh'
    });
  }
});

// Get all users (admin only)
router.get('/users', [authenticateToken, checkPermission('admin')], async (req, res) => {
  try {
    const userList = await dbService.all('SELECT id, username, email, role, permissions, created_at, last_login FROM users');

    res.json({
      success: true,
      data: userList.map(user => ({
        ...user,
        permissions: JSON.parse(user.permissions)
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users'
    });
  }
});

// Get user's active refresh tokens
router.get('/refresh-tokens', authenticateToken, (req, res) => {
  try {
    const userTokens = getActiveRefreshTokensForUser(req.user.id);
    
    res.json({
      success: true,
      data: {
        tokens: userTokens,
        count: userTokens.length
      },
      message: 'Refresh tokens retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching refresh tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch refresh tokens',
      message: 'An error occurred while fetching refresh tokens'
    });
  }
});

// Revoke specific refresh token
router.delete('/refresh-tokens/:tokenId', authenticateToken, (req, res) => {
  try {
    const { tokenId } = req.params;
    
    // Find the token in the user's tokens
    const userTokens = getActiveRefreshTokensForUser(req.user.id);
    const tokenToRevoke = userTokens.find(t => t.token === tokenId);
    
    if (!tokenToRevoke) {
      return res.status(404).json({
        success: false,
        error: 'Token not found',
        message: 'Refresh token not found'
      });
    }
    
    // Revoke the token
    const revoked = revokeRefreshToken(tokenId);
    
    if (revoked) {
      res.json({
        success: true,
        message: 'Refresh token revoked successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Token not found',
        message: 'Refresh token not found'
      });
    }
  } catch (error) {
    logger.error('Error revoking refresh token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke refresh token',
      message: 'An error occurred while revoking refresh token'
    });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', [authenticateToken, checkPermission('admin')], (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    if (userIdNum === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete yourself',
        message: 'You cannot delete your own account'
      });
    }

    const userIndex = users.findIndex(u => u.id === userIdNum);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    const deletedUser = users.splice(userIndex, 1)[0];
    logger.info(`User deleted: ${deletedUser.username} by admin: ${req.user.username}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: 'An error occurred while deleting user'
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: user.permissions
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed',
      message: 'An error occurred while verifying token'
    });
  }
});

module.exports = { router, authenticateToken, checkPermission }; 