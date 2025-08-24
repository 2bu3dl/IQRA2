// Input validation and sanitization utilities for IQRA2 app
import logger from './logger';

// Validation patterns
const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  DISPLAY_NAME: /^[a-zA-Z0-9\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]{1,50}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  SAFE_TEXT: /^[a-zA-Z0-9\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF.,!?-]{1,1000}$/,
  FILE_NAME: /^[a-zA-Z0-9._-]{1,100}$/,
  SEARCH_TEXT: /^[a-zA-Z0-9\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF.,!?-]{1,200}$/,
};

// Validation error messages
const ERROR_MESSAGES = {
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_REQUIRED: 'Email is required',
  USERNAME_INVALID: 'Username must be 3-20 characters, letters, numbers, underscore, or dash only',
  USERNAME_REQUIRED: 'Username is required',
  DISPLAY_NAME_INVALID: 'Display name must be 1-50 characters, letters, numbers, or Arabic text only',
  DISPLAY_NAME_REQUIRED: 'Display name is required',
  PASSWORD_WEAK: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MISMATCH: 'Passwords do not match',
  SAFE_TEXT_INVALID: 'Text contains invalid characters',
  FILE_NAME_INVALID: 'File name contains invalid characters',
  SEARCH_TEXT_INVALID: 'Search text contains invalid characters',
  LENGTH_TOO_LONG: 'Input is too long',
  LENGTH_TOO_SHORT: 'Input is too short',
};

// Input validation functions
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: ERROR_MESSAGES.EMAIL_REQUIRED };
  }
  
  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0) {
    return { isValid: false, error: ERROR_MESSAGES.EMAIL_REQUIRED };
  }
  
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: ERROR_MESSAGES.LENGTH_TOO_LONG };
  }
  
  if (!PATTERNS.EMAIL.test(trimmedEmail)) {
    return { isValid: false, error: ERROR_MESSAGES.EMAIL_INVALID };
  }
  
  return { isValid: true, value: trimmedEmail };
};

export const validateEmailOrUsername = (identifier) => {
  if (!identifier || typeof identifier !== 'string') {
    return { isValid: false, error: 'Email or username is required' };
  }
  
  const trimmedIdentifier = identifier.trim();
  if (trimmedIdentifier.length === 0) {
    return { isValid: false, error: 'Email or username is required' };
  }
  
  if (trimmedIdentifier.length > 254) {
    return { isValid: false, error: ERROR_MESSAGES.LENGTH_TOO_LONG };
  }
  
  // Check if it's an email
  if (PATTERNS.EMAIL.test(trimmedIdentifier)) {
    return { isValid: true, value: trimmedIdentifier, type: 'email' };
  }
  
  // Check if it's a valid username
  if (PATTERNS.USERNAME.test(trimmedIdentifier)) {
    return { isValid: true, value: trimmedIdentifier, type: 'username' };
  }
  
  // If neither, provide helpful error message
  return { 
    isValid: false, 
    error: 'Please enter a valid email address or username (3-20 characters, letters, numbers, underscore, or dash only)' 
  };
};

export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: ERROR_MESSAGES.USERNAME_REQUIRED };
  }
  
  const trimmedUsername = username.trim();
  if (trimmedUsername.length === 0) {
    return { isValid: false, error: ERROR_MESSAGES.USERNAME_REQUIRED };
  }
  
  if (trimmedUsername.length < 3) {
    return { isValid: false, error: ERROR_MESSAGES.LENGTH_TOO_SHORT };
  }
  
  if (trimmedUsername.length > 20) {
    return { isValid: false, error: ERROR_MESSAGES.LENGTH_TOO_LONG };
  }
  
  if (!PATTERNS.USERNAME.test(trimmedUsername)) {
    return { isValid: false, error: ERROR_MESSAGES.USERNAME_INVALID };
  }
  
  return { isValid: true, value: trimmedUsername };
};

export const validateDisplayName = (displayName) => {
  if (!displayName || typeof displayName !== 'string') {
    return { isValid: false, error: ERROR_MESSAGES.DISPLAY_NAME_REQUIRED };
  }
  
  const trimmedName = displayName.trim();
  if (trimmedName.length === 0) {
    return { isValid: false, error: ERROR_MESSAGES.DISPLAY_NAME_REQUIRED };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: ERROR_MESSAGES.LENGTH_TOO_LONG };
  }
  
  if (!PATTERNS.DISPLAY_NAME.test(trimmedName)) {
    return { isValid: false, error: ERROR_MESSAGES.DISPLAY_NAME_INVALID };
  }
  
  return { isValid: true, value: trimmedName };
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_REQUIRED };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_WEAK };
  }
  
  // Check for common weak passwords
  const weakPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'dragon', 'master', 'football', 'superman', 'trustno1'
  ];
  
  if (weakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'This password is too common. Please choose a stronger password.' };
  }
  
  // Check for sequential characters
  if (/(.)\1{2,}/.test(password)) {
    return { isValid: false, error: 'Password contains too many repeated characters.' };
  }
  
  if (!PATTERNS.PASSWORD.test(password)) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_WEAK };
  }
  
  return { isValid: true, value: password };
};

export const validatePasswordConfirmation = (password, confirmPassword) => {
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_MISMATCH };
  }
  
  return { isValid: true, value: password };
};

export const validateSafeText = (text, maxLength = 1000) => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: ERROR_MESSAGES.SAFE_TEXT_INVALID };
  }
  
  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return { isValid: false, error: ERROR_MESSAGES.SAFE_TEXT_INVALID };
  }
  
  if (trimmedText.length > maxLength) {
    return { isValid: false, error: ERROR_MESSAGES.LENGTH_TOO_LONG };
  }
  
  if (!PATTERNS.SAFE_TEXT.test(trimmedText)) {
    return { isValid: false, error: ERROR_MESSAGES.SAFE_TEXT_INVALID };
  }
  
  return { isValid: true, value: trimmedText };
};

export const validateFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return { isValid: false, error: ERROR_MESSAGES.FILE_NAME_INVALID };
  }
  
  const trimmedFileName = fileName.trim();
  if (trimmedFileName.length === 0) {
    return { isValid: false, error: ERROR_MESSAGES.FILE_NAME_INVALID };
  }
  
  if (trimmedFileName.length > 100) {
    return { isValid: false, error: ERROR_MESSAGES.LENGTH_TOO_LONG };
  }
  
  if (!PATTERNS.FILE_NAME.test(trimmedFileName)) {
    return { isValid: false, error: ERROR_MESSAGES.FILE_NAME_INVALID };
  }
  
  return { isValid: true, value: trimmedFileName };
};

export const validateSearchText = (searchText) => {
  if (!searchText || typeof searchText !== 'string') {
    return { isValid: true, value: '' }; // Empty search is valid
  }
  
  const trimmedText = searchText.trim();
  if (trimmedText.length === 0) {
    return { isValid: true, value: '' };
  }
  
  if (trimmedText.length > 200) {
    return { isValid: false, error: ERROR_MESSAGES.LENGTH_TOO_LONG };
  }
  
  if (!PATTERNS.SEARCH_TEXT.test(trimmedText)) {
    return { isValid: false, error: ERROR_MESSAGES.SEARCH_TEXT_INVALID };
  }
  
  return { isValid: true, value: trimmedText };
};

// Sanitization functions
export const sanitizeHtml = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove HTML tags and dangerous characters
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove remaining < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const sanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }
  
  // Remove dangerous characters and normalize
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file name characters
    .replace(/\.\./g, '') // Remove path traversal attempts
    .replace(/^[.-]+/, '') // Remove leading dots and dashes
    .replace(/[.-]+$/, '') // Remove trailing dots and dashes
    .trim();
};

export const sanitizePath = (path) => {
  if (!path || typeof path !== 'string') {
    return '';
  }
  
  // Normalize and sanitize file paths
  return path
    .replace(/\.\./g, '') // Remove path traversal attempts
    .replace(/[<>:"|?*]/g, '') // Remove invalid path characters
    .replace(/\/+/g, '/') // Normalize slashes
    .replace(/^\/+/, '') // Remove leading slashes
    .trim();
};

// Rate limiting utilities
class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.maxAttempts = 5;
    this.windowMs = 15 * 60 * 1000; // 15 minutes
  }
  
  isRateLimited(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(timestamp => now - timestamp < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return true;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return false;
  }
  
  reset(key) {
    this.attempts.delete(key);
  }
  
  getRemainingAttempts(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }
}

export const rateLimiter = new RateLimiter();

// Validation middleware for forms
export const validateForm = (formData, validationRules) => {
  const errors = {};
  const sanitizedData = {};
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field];
    
    // Apply validation based on rules
    if (rules.required && (!value || value.trim().length === 0)) {
      errors[field] = rules.required;
      continue;
    }
    
    if (value) {
      let validationResult;
      
      switch (rules.type) {
        case 'email':
          validationResult = validateEmail(value);
          break;
        case 'username':
          validationResult = validateUsername(value);
          break;
        case 'displayName':
          validationResult = validateDisplayName(value);
          break;
        case 'password':
          validationResult = validatePassword(value);
          break;
        case 'safeText':
          validationResult = validateSafeText(value, rules.maxLength);
          break;
        case 'fileName':
          validationResult = validateFileName(value);
          break;
        case 'searchText':
          validationResult = validateSearchText(value);
          break;
        default:
          validationResult = { isValid: true, value };
      }
      
      if (!validationResult.isValid) {
        errors[field] = validationResult.error;
      } else {
        sanitizedData[field] = validationResult.value;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: sanitizedData
  };
};

// Log validation attempts for security monitoring
export const logValidationAttempt = (field, value, isValid, context = '') => {
  logger.debug('Validation', 'Input validation attempt', {
    field,
    valueLength: value ? value.length : 0,
    isValid,
    context,
    timestamp: new Date().toISOString()
  });
};

export default {
  validateEmail,
  validateUsername,
  validateDisplayName,
  validatePassword,
  validatePasswordConfirmation,
  validateSafeText,
  validateFileName,
  validateSearchText,
  sanitizeHtml,
  sanitizeFileName,
  sanitizePath,
  validateForm,
  rateLimiter,
  logValidationAttempt,
  PATTERNS,
  ERROR_MESSAGES
};
