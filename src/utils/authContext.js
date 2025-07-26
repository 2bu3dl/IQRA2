import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Handle user state changes
  const onAuthStateChanged = (user) => {
    console.log('[Auth] User state changed:', user?.email || 'No user');
    setUser(user);
    if (initializing) setInitializing(false);
    setLoading(false);
  };

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, [initializing]);

  // Login with email/password
  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await auth().signInWithEmailAndPassword(email, password);
      console.log('[Auth] Login successful:', result.user.email);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      let message = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (email, password) => {
    try {
      setLoading(true);
      const result = await auth().createUserWithEmailAndPassword(email, password);
      console.log('[Auth] Registration successful:', result.user.email);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('[Auth] Registration error:', error);
      let message = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email is already registered';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await auth().signOut();
      console.log('[Auth] Logout successful');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      await auth().sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Password reset error:', error);
      let message = 'Password reset failed';
      if (error.code === 'auth/user-not-found') {
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
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 