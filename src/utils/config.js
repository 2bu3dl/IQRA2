// Environment configuration for IQRA2 app
// This file centralizes all configuration values and removes hardcoded credentials

// For now, use direct values while we debug the dotenv setup
// TODO: Switch back to @env imports once dotenv is working properly

// App Configuration (define first since it's used by other configs)
export const APP_CONFIG = {
  environment: 'production',
  debugMode: false,
  enableLogging: false, // Will be false in production
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: 'https://baimixtdewflnnyudhwz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaW1peHRkZXdmbG5ueXVkaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjIwMTcsImV4cCI6MjA2OTE5ODAxN30.vXIW8HICOhsMO0bWk59PFLWmn8aKhFUUk25llLp4jSc',
  serviceKey: '',
};

// API Configuration
export const API_CONFIG = {
  baseUrl: APP_CONFIG.environment === 'production' ? 'https://api.iqra2.app' : 'http://localhost:5001',
  adminDashboardUrl: APP_CONFIG.environment === 'production' ? 'https://admin.iqra2.app' : 'http://localhost:5001',
  telemetryUrl: APP_CONFIG.environment === 'production' ? 'https://api.iqra2.app/telemetry' : 'http://localhost:5001/api/iqra2/telemetry',
};

// Security Configuration
export const SECURITY_CONFIG = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Feature Flags
export const FEATURES = {
  enableTelemetry: false,
  enableAdminDashboard: false,
  enableLeaderboard: true,
  enableRecording: true,
};

// Validation functions
export const validateConfig = () => {
  const errors = [];
  
  if (!SUPABASE_CONFIG.url) {
    errors.push('SUPABASE_URL is required');
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('SUPABASE_ANON_KEY is required');
  }
  
  if (APP_CONFIG.environment === 'production' && (API_CONFIG.baseUrl.includes('localhost') || API_CONFIG.adminDashboardUrl.includes('localhost'))) {
    errors.push('Production environment cannot use localhost URLs');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors);
    // Only throw in production to prevent app crashes during development
    if (APP_CONFIG.environment === 'production') {
      throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }
  }
  
  return true;
};

// Helper function to get environment-specific values
export const getEnvironmentValue = (devValue, prodValue) => {
  return APP_CONFIG.environment === 'production' ? prodValue : devValue;
};

export default {
  SUPABASE_CONFIG,
  API_CONFIG,
  APP_CONFIG,
  SECURITY_CONFIG,
  FEATURES,
  validateConfig,
  getEnvironmentValue,
};
