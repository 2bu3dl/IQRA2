import { supabase } from './supabase';
import { loadData } from './store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_CONFIG } from './config';
import logger from './logger';

// Raw HTTP functions to bypass broken Supabase client

const makeSupabaseRequest = async (endpoint, options = {}) => {
  try {
    const url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
    logger.debug('LeaderboardService', 'Making request', { 
      endpoint, 
      method: options.method || 'GET',
      hasBody: !!options.body 
    });
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Prefer': 'return=minimal', // For PATCH/POST operations
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    logger.debug('LeaderboardService', 'Response received', { 
      status: response.status,
      hasHeaders: !!response.headers 
    });

    if (response.ok) {
      // For PATCH/POST, response might be empty
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { success: true, data: null };
      }
      
      try {
        const data = await response.json();
        return { success: true, data };
      } catch (parseError) {
        // If response is empty or can't be parsed as JSON
        return { success: true, data: null };
      }
    } else {
      const errorText = await response.text();
      logger.error('LeaderboardService', 'HTTP request error', { status: response.status, error: errorText });
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (err) {
    logger.error('LeaderboardService', 'HTTP request exception', err);
    return { success: false, error: err.message };
  }
};

// Leaderboard types
export const LEADERBOARD_TYPES = {
  MEMORIZATION: 'memorization',
  STREAK: 'streak',
  HASANAT: 'hasanat',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

// Update user's leaderboard stats
export const updateLeaderboardStats = async (userId, stats) => {
  try {
    logger.log('LeaderboardService', 'Starting update for user', { userId });
    
    // Use raw HTTP instead of broken Supabase client
    const endpoint = 'leaderboard_stats';
    const body = {
      user_id: userId,
      total_hasanat: stats.totalHasanat || 0,
      total_ayaat_memorized: stats.memorizedAyaat || 0,
      current_streak: stats.streak || 0,
      best_streak: stats.bestStreak || 0,
      weekly_hasanat: stats.weeklyHasanat || 0,
      monthly_hasanat: stats.monthlyHasanat || 0,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    logger.debug('LeaderboardService', 'Request body prepared', { hasBody: !!body });

    // Try to update existing record first
    const updateUrl = `${endpoint}?user_id=eq.${userId}`;
    logger.debug('LeaderboardService', 'Trying update', { updateUrl });
    
    const updateResult = await makeSupabaseRequest(updateUrl, {
      method: 'PATCH',
      body
    });

    logger.debug('LeaderboardService', 'Update result', { success: updateResult.success });

    if (updateResult.success) {
      logger.log('LeaderboardService', 'Update successful');
      return { success: true, data: updateResult.data };
    }

    // If update fails, try to insert
    logger.debug('LeaderboardService', 'Update failed, trying insert');
    const insertResult = await makeSupabaseRequest(endpoint, {
      method: 'POST',
      body
    });

    logger.debug('LeaderboardService', 'Insert result', { success: insertResult.success });

    if (insertResult.success) {
      logger.log('LeaderboardService', 'Insert successful');
      return { success: true, data: insertResult.data };
    }

    logger.error('LeaderboardService', 'Both update and insert failed', { 
      updateError: updateResult.error,
      insertError: insertResult.error 
    });
    return { success: false, error: `Update: ${updateResult.error}, Insert: ${insertResult.error}` };
  } catch (error) {
    logger.error('LeaderboardService', 'Error updating stats', error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard data
export const getLeaderboardData = async (type = LEADERBOARD_TYPES.MEMORIZATION, limit = 10) => {
  try {
    console.log('[getLeaderboardData] Starting query for type:', type);
    
    // Use raw HTTP instead of broken Supabase client
    const endpoint = 'leaderboard_stats';
    
    // Build the query with ordering
    let orderBy = 'total_ayaat_memorized';
    switch (type) {
      case LEADERBOARD_TYPES.MEMORIZATION:
        orderBy = 'total_ayaat_memorized';
        break;
      case LEADERBOARD_TYPES.STREAK:
        orderBy = 'current_streak';
        break;
      case LEADERBOARD_TYPES.HASANAT:
        orderBy = 'total_hasanat';
        break;
      case LEADERBOARD_TYPES.WEEKLY:
        orderBy = 'weekly_hasanat';
        break;
      case LEADERBOARD_TYPES.MONTHLY:
        orderBy = 'monthly_hasanat';
        break;
      default:
        orderBy = 'total_ayaat_memorized';
    }
    
    const queryUrl = `${endpoint}?order=${orderBy}.desc&limit=${limit}`;
    const result = await makeSupabaseRequest(queryUrl);
    
    if (result.success) {
      console.log('[getLeaderboardData] Success:', result.data.length, 'records');
      
      // Get user profiles to add usernames and profile pictures
      const userProfilesResult = await makeSupabaseRequest('user_profiles?select=id,username,display_name,profile_letter,letter_color,background_color');
      let userProfiles = {};
      
      if (userProfilesResult.success && userProfilesResult.data) {
        userProfilesResult.data.forEach(profile => {
          userProfiles[profile.id] = profile;
        });
      }
      
      // Merge leaderboard data with user profiles
      const enrichedData = result.data.map(user => {
        const profile = userProfiles[user.user_id];
        const enrichedUser = {
          ...user,
          username: profile?.username || null,
          display_name: profile?.display_name || null,
          profile_letter: profile?.profile_letter || 'ء',
          letter_color: profile?.letter_color || '#6BA368',
          background_color: profile?.background_color || '#F5E6C8'
        };
        return enrichedUser;
      });
      
      console.log('[getLeaderboardData] Enriched data sample:', enrichedData[0]);
      return { success: true, data: enrichedData || [] };
    } else {
      console.error('[getLeaderboardData] Failed:', result.error);
      return { success: false, error: result.error, data: [] };
    }
  } catch (error) {
    console.error('[LeaderboardService] Error getting leaderboard:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Get user's rank in leaderboard
export const getUserRank = async (userId, type = LEADERBOARD_TYPES.MEMORIZATION) => {
  try {
    console.log('[getUserRank] Getting rank for user:', userId, 'type:', type);

    let orderBy;
    switch (type) {
      case LEADERBOARD_TYPES.MEMORIZATION:
        orderBy = 'total_ayaat_memorized';
        break;
      case LEADERBOARD_TYPES.STREAK:
        orderBy = 'current_streak';
        break;
      case LEADERBOARD_TYPES.HASANAT:
        orderBy = 'total_hasanat';
        break;
      case LEADERBOARD_TYPES.WEEKLY:
        orderBy = 'weekly_hasanat';
        break;
      case LEADERBOARD_TYPES.MONTHLY:
        orderBy = 'monthly_hasanat';
        break;
      default:
        orderBy = 'total_ayaat_memorized';
    }

    // Use raw HTTP to get all users ordered by the metric
    const endpoint = 'leaderboard_stats';
    const queryUrl = `${endpoint}?select=user_id&order=${orderBy}.desc`;
    const result = await makeSupabaseRequest(queryUrl);
    
    if (!result.success) {
      console.error('[getUserRank] Failed to get data:', result.error);
      return { success: false, error: result.error, rank: null };
    }

    // Find user's position
    const userIndex = result.data.findIndex(user => user.user_id === userId);
    const rank = userIndex >= 0 ? userIndex + 1 : null;
    
    console.log('[getUserRank] User rank:', rank);
    return { success: true, rank };
  } catch (error) {
    console.error('[LeaderboardService] Error getting user rank:', error);
    return { success: false, error: error.message, rank: null };
  }
};

// Calculate weekly and monthly hasanat
const calculateTimeBasedHasanat = async () => {
  try {
    const weeklyActivity = await AsyncStorage.getItem('weeklyActivity');
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let weeklyHasanat = 0;
    let monthlyHasanat = 0;
    
    if (weeklyActivity) {
      const activityData = JSON.parse(weeklyActivity);
      
      // Calculate weekly hasanat (current week)
      const weekKey = `${startOfWeek.getFullYear()}-${startOfWeek.getMonth()}-${startOfWeek.getDate()}`;
      if (activityData[weekKey]) {
        weeklyHasanat = activityData[weekKey].totalHasanat || 0;
      }
      
      // Calculate monthly hasanat (current month)
      Object.keys(activityData).forEach(week => {
        const weekDate = new Date(week);
        if (weekDate >= startOfMonth && weekDate <= now) {
          monthlyHasanat += activityData[week].totalHasanat || 0;
        }
      });
    }
    
    return { weeklyHasanat, monthlyHasanat };
  } catch (error) {
    console.error('[LeaderboardService] Error calculating time-based hasanat:', error);
    return { weeklyHasanat: 0, monthlyHasanat: 0 };
  }
};

// Get best streak from AsyncStorage
const getBestStreak = async () => {
  try {
    const bestStreak = await AsyncStorage.getItem('bestStreak');
    return parseInt(bestStreak || '0') || 0;
  } catch (error) {
    console.error('[LeaderboardService] Error getting best streak:', error);
    return 0;
  }
};

// Update best streak if current streak is higher
const updateBestStreak = async (currentStreak) => {
  try {
    const currentBest = await getBestStreak();
    if (currentStreak > currentBest) {
      await AsyncStorage.setItem('bestStreak', currentStreak.toString());
      return currentStreak;
    }
    return currentBest;
  } catch (error) {
    console.error('[LeaderboardService] Error updating best streak:', error);
    return currentStreak;
  }
};

// Sync user's current stats to leaderboard
export const syncUserStatsToLeaderboard = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[LeaderboardService] No user logged in, skipping sync');
      return { success: false, error: 'Not authenticated' };
    }

    // Load current user data
    const userData = await loadData();
    
    // Calculate time-based hasanat
    const { weeklyHasanat, monthlyHasanat } = await calculateTimeBasedHasanat();
    
    // Update and get best streak
    const bestStreak = await updateBestStreak(userData.streak);
    
    // Calculate additional stats
    const stats = {
      totalHasanat: userData.totalHasanat,
      memorizedAyaat: userData.memorizedAyaat,
      streak: userData.streak,
      bestStreak: bestStreak,
      weeklyHasanat: weeklyHasanat,
      monthlyHasanat: monthlyHasanat,
    };

    // Update leaderboard stats
    const result = await updateLeaderboardStats(user.id, stats);
    
    if (result.success) {
      console.log('[LeaderboardService] Stats synced to leaderboard successfully', stats);
    }
    
    return result;
  } catch (error) {
    console.error('[LeaderboardService] Error syncing stats:', error);
    return { success: false, error: error.message };
  }
};

// Get real-time leaderboard updates using Supabase subscriptions with polling fallback
export const subscribeToLeaderboardUpdates = (type, callback) => {
  try {
    let subscription = null;
    let pollInterval = null;
    
    // Try to set up real-time subscription first
    try {
      subscription = supabase
        .channel('leaderboard_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leaderboard_stats'
          },
          async (payload) => {
            console.log('[LeaderboardService] Real-time update received:', payload);
            // When any change happens, refresh the leaderboard data
            try {
              const result = await getLeaderboardData(type);
              if (result.success) {
                callback(result.data);
              }
            } catch (error) {
              console.error('[LeaderboardService] Error processing real-time update:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('[LeaderboardService] Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[LeaderboardService] Real-time leaderboard subscription active');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[LeaderboardService] Real-time subscription failed, falling back to polling');
            setupPolling();
          }
        });
    } catch (realtimeError) {
      console.warn('[LeaderboardService] Real-time not available, using polling:', realtimeError);
      setupPolling();
    }
    
    // Fallback polling function
    function setupPolling() {
      if (pollInterval) return; // Don't set up multiple intervals
      
      pollInterval = setInterval(async () => {
        try {
          const result = await getLeaderboardData(type);
          if (result.success) {
            callback(result.data);
          }
        } catch (error) {
          console.error('[LeaderboardService] Polling error:', error);
        }
      }, 30000); // Poll every 30 seconds
    }
    
    // If real-time subscription fails to connect within 5 seconds, fall back to polling
    const fallbackTimer = setTimeout(() => {
      if (!subscription || subscription.state !== 'joined') {
        console.log('[LeaderboardService] Real-time connection timeout, falling back to polling');
        setupPolling();
      }
    }, 5000);

    // Return cleanup function
    return () => {
      clearTimeout(fallbackTimer);
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  } catch (error) {
    console.error('[LeaderboardService] Error setting up updates:', error);
    return null;
  }
};

// Format leaderboard data for display
export const formatLeaderboardData = (data, type) => {
  return data.map((user, index) => {
    let displayValue;
    let displayLabel;
    
    switch (type) {
      case LEADERBOARD_TYPES.MEMORIZATION:
        displayValue = user.total_ayaat_memorized;
        displayLabel = 'ayaat';
        break;
      case LEADERBOARD_TYPES.STREAK:
        displayValue = user.current_streak;
        displayLabel = 'days';
        break;
      case LEADERBOARD_TYPES.HASANAT:
        displayValue = formatLargeNumber(user.total_hasanat);
        displayLabel = 'hasanat';
        break;
      case LEADERBOARD_TYPES.WEEKLY:
        displayValue = formatLargeNumber(user.weekly_hasanat);
        displayLabel = 'hasanat';
        break;
      case LEADERBOARD_TYPES.MONTHLY:
        displayValue = formatLargeNumber(user.monthly_hasanat);
        displayLabel = 'hasanat';
        break;
      default:
        displayValue = user.total_ayaat_memorized;
        displayLabel = 'ayaat';
    }

    // Try to get username from user_profiles table, fallback to user ID
    let displayName = `User ${user.user_id.slice(0, 8)}`;
    
    // If we have display_name data, use it (prefer display_name over username)
    if (user.display_name && user.display_name.trim() !== '') {
      displayName = user.display_name;
    } else if (user.username && user.username.trim() !== '') {
      displayName = user.username;
    }

    return {
      rank: index + 1,
      name: displayName,
      value: displayValue,
      label: displayLabel,
      userId: user.user_id,
      lastActivity: user.last_activity,
      profileLetter: user.profile_letter || 'ء',
      letterColor: user.letter_color || '#6BA368',
      backgroundColor: user.background_color || '#F5E6C8'
    };
  });
};

// Helper function to format large numbers
const formatLargeNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return num.toString();
  }
};

// Test function to verify database connection
export const testLeaderboardConnection = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[LeaderboardService] No user logged in for test');
      return { success: false, error: 'Not authenticated' };
    }

    // Test inserting a record
    const testResult = await updateLeaderboardStats(user.id, {
      totalHasanat: 100,
      memorizedAyaat: 5,
      streak: 3,
      bestStreak: 3,
      weeklyHasanat: 50,
      monthlyHasanat: 100
    });

    if (testResult.success) {
      console.log('[LeaderboardService] Database connection test successful');
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('leaderboard_stats')
        .delete()
        .eq('user_id', user.id)
        .eq('total_hasanat', 100);

      if (deleteError) {
        console.warn('[LeaderboardService] Could not clean up test data:', deleteError);
      }
      
      return { success: true, message: 'Database connection working' };
    } else {
      return { success: false, error: testResult.error };
    }
  } catch (error) {
    console.error('[LeaderboardService] Database connection test failed:', error);
    return { success: false, error: error.message };
  }
}; 