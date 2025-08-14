const fs = require('fs');
const path = require('path');

// SSL Configuration
const SSL_CONFIG = {
  // Development SSL (self-signed)
  development: {
    enabled: process.env.SSL_ENABLED === 'true',
    cert: process.env.SSL_CERT_PATH || path.join(__dirname, '../ssl/cert.pem'),
    key: process.env.SSL_KEY_PATH || path.join(__dirname, '../ssl/key.pem'),
    port: process.env.HTTPS_PORT || 5002,
    options: {
      // Self-signed certificate options
      requestCert: false,
      rejectUnauthorized: false
    }
  },
  
  // Production SSL (real certificates)
  production: {
    enabled: process.env.SSL_ENABLED === 'true',
    cert: process.env.SSL_CERT_PATH,
    key: process.env.SSL_KEY_PATH,
    port: process.env.HTTPS_PORT || 443,
    options: {
      // Production certificate options
      requestCert: false,
      rejectUnauthorized: true
    }
  }
};

// Get SSL config for current environment
function getSSLConfig() {
  const env = process.env.NODE_ENV || 'development';
  return SSL_CONFIG[env];
}

// Check if SSL files exist
function validateSSLFiles() {
  const config = getSSLConfig();
  
  if (!config.enabled) {
    return { valid: true, message: 'SSL disabled' };
  }
  
  const certExists = fs.existsSync(config.cert);
  const keyExists = fs.existsSync(config.key);
  
  if (!certExists || !keyExists) {
    return {
      valid: false,
      message: `SSL files missing: cert=${certExists}, key=${keyExists}`,
      certPath: config.cert,
      keyPath: config.key
    };
  }
  
  return { valid: true, message: 'SSL files found' };
}

// Create HTTPS server options
function createHTTPSOptions() {
  const config = getSSLConfig();
  
  if (!config.enabled) {
    return null;
  }
  
  const validation = validateSSLFiles();
  if (!validation.valid) {
    throw new Error(`SSL configuration error: ${validation.message}`);
  }
  
  return {
    cert: fs.readFileSync(config.cert),
    key: fs.readFileSync(config.key),
    ...config.options
  };
}

module.exports = {
  SSL_CONFIG,
  getSSLConfig,
  validateSSLFiles,
  createHTTPSOptions
};
