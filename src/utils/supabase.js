import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, validateConfig, APP_CONFIG } from './config';

const makeSupabaseRequest = async (endpoint, options = {}) => {
  const url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
  
  // Get the current user's session for authentication
  let authToken = SUPABASE_CONFIG.anonKey;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authToken = session.access_token;
    }
  } catch (error) {
    console.log('[DEBUG][Supabase] Could not get session, using anon key');
  }
  
  console.log('[DEBUG][Supabase] Making request', { 
    endpoint, 
    method: options.method || 'GET',
    hasBody: !!options.body,
    bodyPreview: options.body ? JSON.stringify(options.body).substring(0, 100) + '...' : 'none',
    usingAuthToken: !!authToken && authToken !== SUPABASE_CONFIG.anonKey
  });
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${authToken}`,
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    if (response.ok) {
      try {
        const data = await response.json();
        return { success: true, data };
      } catch (parseError) {
        console.error('[ERROR][Supabase] Failed to parse response JSON:', parseError);
        return { success: false, error: 'Invalid response format' };
      }
    } else {
      const errorText = await response.text();
      console.error('[ERROR][Supabase] HTTP request error', { status: response.status, error: errorText });
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (err) {
    console.error('[ERROR][Supabase] HTTP request exception', err);
    return { success: false, error: err.message };
  }
};

// Validate configuration on import
try {
  validateConfig();
} catch (error) {
  console.error('[ERROR][Supabase] Configuration error', error);
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
    console.log('[Supabase] Saving progress for user', { userId, progressDataKeys: Object.keys(progressData || {}) });
    
    // Use raw HTTP instead of broken Supabase client
    const endpoint = 'user_progress';
    const body = {
      user_id: userId,
      progress_data: progressData,
      updated_at: new Date().toISOString()
    };
    
    console.log('[DEBUG][Supabase] Request body:', JSON.stringify(body, null, 2));

    // Validate body data
    if (!progressData || typeof progressData !== 'object') {
      console.error('[ERROR][Supabase] Invalid progress data:', progressData);
      return { success: false, error: 'Invalid progress data' };
    }

    // Try to update existing record first
    const updateUrl = `${endpoint}?user_id=eq.${userId}`;
    console.log('[DEBUG][Supabase] Update URL:', updateUrl);
    
    let updateResult;
    try {
      updateResult = await makeSupabaseRequest(updateUrl, {
        method: 'PATCH',
        body
      });
    } catch (error) {
      console.log('[DEBUG][Supabase] Update request failed, will try insert:', error.message);
      updateResult = { success: false };
    }

    if (updateResult.success) {
      console.log('[Supabase] Progress update successful');
      return { success: true, data: updateResult.data };
    }

    // If update fails, try to insert
    console.log('[DEBUG][Supabase] Update failed, trying insert...');
    const insertResult = await makeSupabaseRequest(endpoint, {
      method: 'POST',
      body
    });

    if (insertResult.success) {
      console.log('[Supabase] Progress insert successful');
      return { success: true, data: insertResult.data };
    }

    console.error('[ERROR][Supabase] Both update and insert failed');
    return { success: false, error: 'Failed to save progress' };
  } catch (error) {
    console.error('[ERROR][Supabase] Error saving user progress', error);
    return { success: false, error: error.message };
  }
};

export const loadUserProgress = async (userId) => {
  try {
    console.log('[Supabase] Loading progress for user', { userId });
    
    // Use raw HTTP instead of broken Supabase client
    const endpoint = 'user_progress';
    const queryUrl = `${endpoint}?select=progress_data&user_id=eq.${userId}`;
    
    const result = await makeSupabaseRequest(queryUrl);
    
    if (result.success) {
      if (result.data && result.data.length > 0) {
        console.log('[Supabase] Progress loaded successfully');
        return { success: true, data: result.data[0].progress_data };
      } else {
        console.log('[Supabase] No progress found for user');
        return { success: true, data: null };
      }
    } else {
      console.error('[ERROR][Supabase] Failed to load progress', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('[ERROR][Supabase] Error loading user progress', error);
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
    console.error('[ERROR][Supabase] Error creating user profile', error);
    return { success: false, error: error.message };
  }
};



 