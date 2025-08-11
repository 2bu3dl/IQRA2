import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://baimixtdewflnnyudhwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaW1peHRkZXdmbG5ueXVkaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjIwMTcsImV4cCI6MjA2OTE5ODAxN30.vXIW8HICOhsMO0bWk59PFLWmn8aKhFUUk25llLp4jSc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
      'apikey': supabaseAnonKey
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
    console.log('[saveUserProgress] Saving progress for user:', userId);
    
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
      console.log('[saveUserProgress] Update successful');
      return { success: true, data: updateResult.data };
    }

    // If update fails, try to insert
    const insertResult = await makeSupabaseRequest(endpoint, {
      method: 'POST',
      body
    });

    if (insertResult.success) {
      console.log('[saveUserProgress] Insert successful');
      return { success: true, data: insertResult.data };
    }

    console.error('[saveUserProgress] Both update and insert failed');
    return { success: false, error: 'Failed to save progress' };
  } catch (error) {
    console.error('Error saving user progress:', error);
    return { success: false, error: error.message };
  }
};

export const loadUserProgress = async (userId) => {
  try {
    console.log('[loadUserProgress] Loading progress for user:', userId);
    
    // Use raw HTTP instead of broken Supabase client
    const endpoint = 'user_progress';
    const queryUrl = `${endpoint}?select=progress_data&user_id=eq.${userId}`;
    
    const result = await makeSupabaseRequest(queryUrl);
    
    if (result.success) {
      if (result.data && result.data.length > 0) {
        console.log('[loadUserProgress] Progress loaded successfully');
        return { success: true, data: result.data[0].progress_data };
      } else {
        console.log('[loadUserProgress] No progress found for user');
        return { success: true, data: null };
      }
    } else {
      console.error('[loadUserProgress] Failed to load progress:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error loading user progress:', error);
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
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Test function to debug the connection issue
export const testSupabaseConnection = async () => {
  try {
    console.log('[testSupabaseConnection] Testing basic connection...');
    
    // Test 1: Simple select
    const { data, error } = await supabase
      .from('leaderboard_stats')
      .select('id')
      .limit(1);
    
    console.log('[testSupabaseConnection] Result:', { data, error });
    
    if (error) {
      console.error('[testSupabaseConnection] Error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('[testSupabaseConnection] Exception:', err);
    return { success: false, error: err.message };
  }
};

// Test with raw HTTP request to bypass Supabase client
export const testRawHttpConnection = async () => {
  try {
    console.log('[testRawHttpConnection] Testing raw HTTP connection...');
    
    const url = 'https://baimixtdewflnnyudhwz.supabase.co/rest/v1/leaderboard_stats?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaW1peHRkZXdmbG5ueXVkaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjIwMTcsImV4cCI6MjA2OTE5ODAxN30.vXIW8HICOhsMO0bWk59PFLWmn8aKhFUUk25llLp4jSc';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaW1peHRkZXdmbG5ueXVkaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjIwMTcsImV4cCI6MjA2OTE5ODAxN30.vXIW8HICOhsMO0bWk59PFLWmn8aKhFUUk25llLp4jSc'
      }
    });
    
    console.log('[testRawHttpConnection] Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[testRawHttpConnection] Success:', data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error('[testRawHttpConnection] HTTP Error:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (err) {
    console.error('[testRawHttpConnection] Exception:', err);
    return { success: false, error: err.message };
  }
};

// Create a fresh Supabase client instance
export const createFreshSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Don't persist to avoid cache issues
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-react-native',
        'apikey': supabaseAnonKey
      }
    },
    db: {
      schema: 'public'
    }
  });
}; 