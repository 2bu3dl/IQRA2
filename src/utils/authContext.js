import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { supabase } from './supabase';
import logger from './logger';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle user state changes
  const onAuthStateChange = (event, session) => {
    logger.log('Auth', 'User state changed', { 
      event, 
      hasUser: !!session?.user,
      userId: session?.user?.id 
    });
    setUser(session?.user || null);
    setLoading(false);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(onAuthStateChange);

    return () => subscription.unsubscribe();
  }, []);

  // Login with email/password or username
  const login = async (identifier, password) => {
    try {
      setLoading(true);
      
      // Check if identifier is email or username
      const isEmail = identifier.includes('@');
      
      if (isEmail) {
        // Login with email
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password
        });

        if (error) throw error;
        
        logger.log('Auth', 'Login successful', { userId: data.user.id });
        return { success: true, user: data.user };
      } else {
        // Login with username - we need to find the user by username first
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('username', identifier)
          .single();

        if (profileError || !profile) {
          return { success: false, error: 'Username not found' };
        }

        // Login with the email associated with the username
        const { data, error } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password
        });

        if (error) throw error;
        
        logger.log('Auth', 'Login successful with username', { userId: data.user.id });
        return { success: true, user: data.user };
      }
    } catch (error) {
      logger.error('Auth', 'Login error', error);
      let message = 'Login failed';
      
      if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid username/email or password';
      } else if (error.message.includes('Email not confirmed') || error.message.includes('not confirmed')) {
        message = 'Account not found or invalid credentials.';
      } else if (error.message.includes('rate limit')) {
        message = 'Too many login attempts. Please try again later.';
      } else if (error.message.includes('User not found')) {
        message = 'Account not found. Please check your email/username.';
      }
      
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (email, password, username = '') => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;
      
      // Email confirmation is disabled, user can login immediately
      if (data.user) {
        logger.log('Auth', 'Registration successful', { userId: data.user.id });
        return { success: true, user: data.user };
      }
      
      // Note: User profile is automatically created by database trigger
      // The trigger will create user_profiles, user_progress, and leaderboard_stats entries
      // The username will be automatically generated to ensure uniqueness
      
      logger.log('Auth', 'Registration successful', { userId: data.user.id });
      return { success: true, user: data.user };
    } catch (error) {
      logger.error('Auth', 'Registration error', error);
      let message = 'Registration failed';
      
      // Handle specific error cases
      if (error.message.includes('User already registered')) {
        message = 'Email is already registered';
      } else if (error.message.includes('Password') || error.message.includes('pwned')) {
        message = 'Password is too weak or has been compromised. Please choose a stronger password.';
      } else if (error.message.includes('Email')) {
        message = 'Please enter a valid email address.';
      } else if (error.message.includes('rate limit')) {
        message = 'Too many attempts. Please try again later.';
      }
      
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      logger.log('Auth', 'Logout successful');
      return { success: true };
    } catch (error) {
      logger.error('Auth', 'Logout error', error);
      return { success: false, error: 'Logout failed' };
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      logger.error('Auth', 'Password reset error', error);
      let message = 'Password reset failed';
      if (error.message.includes('User not found')) {
        message = 'No account found with this email';
      }
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 