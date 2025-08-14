import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, validateConfig, APP_CONFIG } from './config';
import logger from './logger';

// Import the makeSupabaseRequest function from leaderboardService
const makeSupabaseRequest = async (endpoint, options = {}) => {
  const url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
  
  logger.debug('Supabase', 'Making request', { 
    endpoint, 
    method: options.method || 'GET',
    hasBody: !!options.body 
  });
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        ...options.headers
      },
      body: options.body
    });
    
    logger.debug('Supabase', 'Response received', { 
      status: response.status,
      hasHeaders: !!response.headers 
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errorText = await response.text();
      logger.error('Supabase', 'HTTP request error', { status: response.status, error: errorText });
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (err) {
    logger.error('Supabase', 'HTTP request exception', err);
    return { success: false, error: err.message };
  }
};

// Validate configuration on import
try {
  validateConfig();
} catch (error) {
  logger.error('Supabase', 'Configuration error', error);
  // In production, this should throw and prevent app startup
  if (APP_CONFIG.environment === 'production') {
    throw error;
  }
}

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    redirectTo: 'iqra2://auth/callback'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
      'apikey': SUPABASE_CONFIG.anonKey
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper functions for user progress
export const saveUserProgress = async (userId, progressData) => {
  try {
    logger.log('Supabase', 'Saving progress for user', { userId });
    
    // Use raw HTTP instead of broken Supabase client
    const endpoint = 'user_progress';
    const body = {
      user_id: userId,
      progress_data: progressData,
      updated_at: new Date().toISOString()
    };

    // Try to update existing record first
    const updateUrl = `${endpoint}?user_id=eq.${userId}`;
    const updateResult = await makeSupabaseRequest(updateUrl, {
      method: 'PATCH',
      body
    });

    if (updateResult.success) {
      logger.log('Supabase', 'Progress update successful');
      return { success: true, data: updateResult.data };
    }

    // If update fails, try to insert
    const insertResult = await makeSupabaseRequest(endpoint, {
      method: 'POST',
      body
    });

    if (insertResult.success) {
      logger.log('Supabase', 'Progress insert successful');
      return { success: true, data: insertResult.data };
    }

    logger.error('Supabase', 'Both update and insert failed');
    return { success: false, error: 'Failed to save progress' };
  } catch (error) {
    logger.error('Supabase', 'Error saving user progress', error);
    return { success: false, error: error.message };
  }
};

export const loadUserProgress = async (userId) => {
  try {
    logger.log('Supabase', 'Loading progress for user', { userId });
    
    // Use raw HTTP instead of broken Supabase client
    const endpoint = 'user_progress';
    const queryUrl = `${endpoint}?select=progress_data&user_id=eq.${userId}`;
    
    const result = await makeSupabaseRequest(queryUrl);
    
    if (result.success) {
      if (result.data && result.data.length > 0) {
        logger.log('Supabase', 'Progress loaded successfully');
        return { success: true, data: result.data[0].progress_data };
      } else {
        logger.log('Supabase', 'No progress found for user');
        return { success: true, data: null };
      }
    } else {
      logger.error('Supabase', 'Failed to load progress', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error('Supabase', 'Error loading user progress', error);
    return { success: false, error: error.message };
  }
};

export const createUserProfile = async (userId, email) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        email: email,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Supabase', 'Error creating user profile', error);
    return { success: false, error: error.message };
  }
};

// Test function to debug the connection issue
export const testSupabaseConnection = async () => {
  try {
    logger.log('Supabase', 'Testing basic connection');
    
    // Test 1: Simple select
    const { data, error } = await supabase
      .from('leaderboard_stats')
      .select('id')
      .limit(1);
    
    logger.debug('Supabase', 'Connection test result', { hasData: !!data, hasError: !!error });
    
    if (error) {
      logger.error('Supabase', 'Connection test error', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error('Supabase', 'Connection test exception', err);
    return { success: false, error: err.message };
  }
};

// Test with raw HTTP request to bypass Supabase client
export const testRawHttpConnection = async () => {
  try {
    logger.log('Supabase', 'Testing raw HTTP connection');
    
    const url = `${SUPABASE_CONFIG.url}/rest/v1/leaderboard_stats?apikey=${SUPABASE_CONFIG.anonKey}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey
      }
    });
    
    logger.debug('Supabase', 'Raw HTTP response status', { status: response.status });
    
    if (response.ok) {
      const data = await response.json();
      logger.log('Supabase', 'Raw HTTP connection successful');
      return { success: true, data };
    } else {
      const errorText = await response.text();
      logger.error('Supabase', 'Raw HTTP error', { status: response.status, error: errorText });
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (err) {
    logger.error('Supabase', 'Raw HTTP exception', err);
    return { success: false, error: err.message };
  }
};

// Create a fresh Supabase client instance
export const createFreshSupabaseClient = () => {
  return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Don't persist to avoid cache issues
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-react-native',
        'apikey': SUPABASE_CONFIG.anonKey
      }
    },
    db: {
      schema: 'public'
    }
  });
}; 