#!/usr/bin/env node

/**
 * IQRA2 Admin Dashboard Security Setup Script
 * 
 * This script helps configure the admin dashboard with secure settings.
 * Run this script after cloning the repository to set up environment variables
 * and perform initial security configuration.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`)
};

// Generate secure random strings
const generateSecureString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate secure JWT secret
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('base64');
};

// Generate secure session secret
const generateSessionSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate environment file
const validateEnvFile = (envPath) => {
  if (!fs.existsSync(envPath)) {
    log.error(`Environment file not found: ${envPath}`);
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'PORT',
    'NODE_ENV',
    'ALLOWED_ORIGINS'
  ];
  
  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(`${varName}=`)
  );
  
  if (missingVars.length > 0) {
    log.warning(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
};

// Create environment file
const createEnvFile = async () => {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('Environment file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Skipping environment file creation.');
      return;
    }
  }
  
  log.info('Creating environment file...');
  
  // Read example file
  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // Generate secure secrets
  const jwtSecret = generateJWTSecret();
  const sessionSecret = generateSessionSecret();
  const refreshTokenSecret = generateJWTSecret(); // Use same function for refresh token secret
  
  // Replace placeholder values
  envContent = envContent.replace(
    'your-super-secure-jwt-secret-key-here',
    jwtSecret
  );
  envContent = envContent.replace(
    'your-super-secure-session-secret-key-here',
    sessionSecret
  );
  envContent = envContent.replace(
    'your-super-secure-refresh-token-secret-key-here',
    refreshTokenSecret
  );
  
  // Write environment file
  fs.writeFileSync(envPath, envContent);
  
  log.success(`Environment file created: ${envPath}`);
  log.warning('Keep your JWT_SECRET and SESSION_SECRET secure and never commit them to version control!');
};

// Setup database
const setupDatabase = async () => {
  log.section('Database Setup');
  
  const dbPath = path.join(__dirname, 'data');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
    log.success(`Created database directory: ${dbPath}`);
  }
  
  // Check if database exists
  const dbFile = path.join(dbPath, 'admin_dashboard.db');
  if (fs.existsSync(dbFile)) {
    const overwrite = await question('Database already exists. Reinitialize? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Skipping database initialization.');
      return;
    }
  }
  
  log.info('Initializing database...');
  
  try {
    // Import database service
    const { initializeDatabase } = require('./services/database');
    await initializeDatabase();
    log.success('Database initialized successfully.');
  } catch (error) {
    log.error(`Database initialization failed: ${error.message}`);
    throw error;
  }
};

// Setup logs directory
const setupLogs = () => {
  log.section('Logs Setup');
  
  const logsPath = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath, { recursive: true });
    log.success(`Created logs directory: ${logsPath}`);
  }
  
  // Create log files if they don't exist
  const logFiles = ['combined.log', 'error.log'];
  logFiles.forEach(logFile => {
    const logPath = path.join(logsPath, logFile);
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '');
      log.success(`Created log file: ${logFile}`);
    }
  });
};

// Change default admin password
const changeAdminPassword = async () => {
  log.section('Admin Password Setup');
  
  log.warning('The default admin password is "password" - this is NOT secure!');
  const changePassword = await question('Change default admin password? (Y/n): ');
  
  if (changePassword.toLowerCase() === 'n') {
    log.warning('Please change the admin password manually before deploying to production!');
    return;
  }
  
  const newPassword = await question('Enter new admin password (min 12 chars, include uppercase, lowercase, numbers, special chars): ');
  
  // Validate password strength
  const passwordValidation = require('./config/security').validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    log.error('Password does not meet security requirements:');
    passwordValidation.errors.forEach(error => log.error(`  - ${error}`));
    return;
  }
  
  log.info('Updating admin password...');
  
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update database
    const { DatabaseService } = require('./services/database');
    const db = new DatabaseService();
    await db.initialize();
    
    await db.run(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    );
    
    log.success('Admin password updated successfully.');
    log.info('You can now login with username: admin and your new password.');
  } catch (error) {
    log.error(`Failed to update admin password: ${error.message}`);
  }
};

// Security checklist
const securityChecklist = () => {
  log.section('Security Checklist');
  
  const checks = [
    {
      name: 'Environment file exists',
      check: () => fs.existsSync(path.join(__dirname, '.env'))
    },
    {
      name: 'Database initialized',
      check: () => fs.existsSync(path.join(__dirname, 'data/admin_dashboard.db'))
    },
    {
      name: 'Logs directory exists',
      check: () => fs.existsSync(path.join(__dirname, 'logs'))
    },
    {
      name: 'Node modules installed',
      check: () => fs.existsSync(path.join(__dirname, 'node_modules'))
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(({ name, check }) => {
    if (check()) {
      log.success(`${name}: ✓`);
    } else {
      log.error(`${name}: ✗`);
      allPassed = false;
    }
  });
  
  if (allPassed) {
    log.success('All security checks passed!');
  } else {
    log.warning('Some security checks failed. Please review and fix issues.');
  }
  
  return allPassed;
};

// Question helper
const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Main setup function
const main = async () => {
  log.header('IQRA2 Admin Dashboard Security Setup');
  
  try {
    // Check if we're in the right directory
    if (!fs.existsSync(path.join(__dirname, 'server.js'))) {
      log.error('This script must be run from the admin-dashboard directory.');
      process.exit(1);
    }
    
    log.info('Starting security setup...');
    
    // Create environment file
    await createEnvFile();
    
    // Setup database
    await setupDatabase();
    
    // Setup logs
    setupLogs();
    
    // Change admin password
    await changeAdminPassword();
    
    // Security checklist
    const checksPassed = securityChecklist();
    
    log.header('Setup Complete!');
    
    if (checksPassed) {
      log.success('Admin dashboard is ready for development.');
      log.info('To start the server: npm start');
      log.info('To run in production: NODE_ENV=production npm start');
    } else {
      log.warning('Setup completed with warnings. Please review and fix any issues.');
    }
    
    log.section('Next Steps');
    log.info('1. Review and update environment variables for production');
    log.info('2. Configure HTTPS certificates for production deployment');
    log.info('3. Set up monitoring and alerting');
    log.info('4. Test all security features');
    log.info('5. Review security documentation: ADMIN_DASHBOARD_SECURITY.md');
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createEnvFile,
  setupDatabase,
  setupLogs,
  changeAdminPassword,
  securityChecklist
};
