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
      'X-Client-Info': 'supabase-js-react-native'
    }
  }
});

// Helper functions for user progress
export const saveUserProgress = async (userId, progressData) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        progress_data: progressData,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving user progress:', error);
    return { success: false, error: error.message };
  }
};

export const loadUserProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('progress_data')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return { success: true, data: data?.progress_data || null };
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