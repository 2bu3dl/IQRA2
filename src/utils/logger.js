// Centralized logging system for IQRA2 app
// This prevents sensitive data exposure and allows logging control

import { APP_CONFIG } from './config';

class Logger {
  constructor() {
    this.isEnabled = APP_CONFIG.enableLogging;
    this.isDebugMode = APP_CONFIG.debugMode;
  }

  // Safe logging that doesn't expose sensitive data
  log(component, message, data = null) {
    if (!this.isEnabled) return;
    
    // Sanitize data to prevent sensitive information exposure
    const sanitizedData = this.sanitizeData(data);
    
    console.log(`[${component}] ${message}`, sanitizedData);
  }

  // Debug logging only in debug mode
  debug(component, message, data = null) {
    if (!this.isDebugMode) return;
    
    const sanitizedData = this.sanitizeData(data);
    console.log(`[DEBUG][${component}] ${message}`, sanitizedData);
  }

  // Error logging (always enabled for debugging)
  error(component, message, error = null) {
    console.error(`[ERROR][${component}] ${message}`, error);
  }

  // Warning logging
  warn(component, message, data = null) {
    if (!this.isEnabled) return;
    
    const sanitizedData = this.sanitizeData(data);
    console.warn(`[WARN][${component}] ${message}`, sanitizedData);
  }

  // Sanitize data to prevent sensitive information exposure
  sanitizeData(data) {
    if (!data) return data;
    
    // Create a copy to avoid modifying original data
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'key', 'secret', 'auth', 'credential',
      'apikey', 'api_key', 'access_token', 'refresh_token',
      'email', 'phone', 'ssn', 'credit_card', 'card_number'
    ];
    
    const removeSensitiveData = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          removeSensitiveData(obj[key]);
        }
      }
    };
    
    removeSensitiveData(sanitized);
    return sanitized;
  }

  // Enable/disable logging dynamically
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  setDebugMode(enabled) {
    this.isDebugMode = enabled;
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
