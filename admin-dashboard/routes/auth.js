const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { logger } = require('../services/logger');

// Mock user database for demonstration
// In production, this would be a real database
const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@iqra2.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    createdAt: new Date().toISOString(),
    lastLogin: null
  },
  {
    id: 2,
    username: 'monitor',
    email: 'monitor@iqra2.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'monitor',
    permissions: ['read'],
    createdAt: new Date().toISOString(),
    lastLogin: null
  }
];

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid access token'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid or expired'
      });
    }
    req.user = user;
    next();
  });
};

// Middleware to check permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    const user = users.find(u => u.id === req.user.id);
    if (!user || !user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `You don't have permission to ${permission}`
      });
    }

    next();
  };
};

// Login endpoint
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { username, password } = req.body;

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
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
      logger.warn(`Failed login attempt for user: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        permissions: user.permissions 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
        expiresIn: '24h'
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
  checkPermission('admin'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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

    // Check if user already exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        message: 'Username or email is already taken'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword,
      role,
      permissions: role === 'admin' ? ['read', 'write', 'delete', 'admin'] : 
                   role === 'monitor' ? ['read'] : ['read'],
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.push(newUser);

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
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
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
    logger.info(`User logged out: ${req.user.username}`);
    
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
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Generate new token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        permissions: user.permissions 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`Token refreshed for user: ${user.username}`);

    res.json({
      success: true,
      data: {
        token,
        expiresIn: '24h'
      },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing token'
    });
  }
});

// Get all users (admin only)
router.get('/users', [authenticateToken, checkPermission('admin')], (req, res) => {
  try {
    const userList = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    res.json({
      success: true,
      data: userList,
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