import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

import { API_CONFIG, FEATURES } from './config';

class AdminDashboardIntegration {
  constructor() {
    this.baseUrl = API_CONFIG.adminDashboardUrl + '/api/iqra2';
    this.sessionId = null;
    this.isInitialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  // Initialize the integration
  async initialize() {
    try {
      // Get or create user ID
      let userId = await AsyncStorage.getItem('admin_dashboard_user_id');
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('admin_dashboard_user_id', userId);
      }

      // Get device info
      const deviceInfo = {
        brand: await DeviceInfo.getBrand(),
        model: await DeviceInfo.getModel(),
        systemVersion: await DeviceInfo.getSystemVersion(),
        appVersion: await DeviceInfo.getVersion(),
        buildNumber: await DeviceInfo.getBuildNumber(),
        deviceId: await DeviceInfo.getDeviceId(),
        isTablet: await DeviceInfo.isTablet(),
        isEmulator: await DeviceInfo.isEmulator(),
      };

      // Start session
      const response = await this.makeRequest('/session/start', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          deviceInfo,
          appVersion: await DeviceInfo.getVersion()
        })
      });

      if (response.success) {
        this.sessionId = response.data.sessionId;
        this.isInitialized = true;
        console.log('[AdminDashboard] Integration initialized successfully');
        return true;
      }
    } catch (error) {
      console.warn('[AdminDashboard] Failed to initialize integration:', error);
      return false;
    }
  }

  // Make HTTP request with retry logic
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, config);
        const data = await response.json();
        return data;
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // Track memorization progress
  async trackMemorizationProgress(surahId, ayahId, success) {
    if (!this.isInitialized || !this.sessionId) {
      console.warn('[AdminDashboard] Integration not initialized');
      return;
    }

    try {
      await this.makeRequest('/track/memorization', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: this.sessionId,
          surahId,
          ayahId,
          success
        })
      });
    } catch (error) {
      console.warn('[AdminDashboard] Failed to track memorization:', error);
    }
  }

  // Track audio playback
  async trackAudioPlayback(audioType, duration, success, error = null) {
    if (!this.isInitialized || !this.sessionId) {
      console.warn('[AdminDashboard] Integration not initialized');
      return;
    }

    try {
      await this.makeRequest('/track/audio', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: this.sessionId,
          audioType,
          duration,
          success,
          error: error?.message || null
        })
      });
    } catch (error) {
      console.warn('[AdminDashboard] Failed to track audio playback:', error);
    }
  }

  // Track Quran loading
  async trackQuranLoading(surahId, loadTime, success) {
    if (!this.isInitialized || !this.sessionId) {
      console.warn('[AdminDashboard] Integration not initialized');
      return;
    }

    try {
      await this.makeRequest('/track/quran-loading', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: this.sessionId,
          surahId,
          loadTime,
          success
        })
      });
    } catch (error) {
      console.warn('[AdminDashboard] Failed to track Quran loading:', error);
    }
  }

  // Track app performance
  async trackAppPerformance(performanceData) {
    if (!this.isInitialized || !this.sessionId) {
      console.warn('[AdminDashboard] Integration not initialized');
      return;
    }

    try {
      await this.makeRequest('/track/performance', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: this.sessionId,
          ...performanceData
        })
      });
    } catch (error) {
      console.warn('[AdminDashboard] Failed to track performance:', error);
    }
  }

  // Track app error
  async trackAppError(errorData) {
    if (!this.isInitialized || !this.sessionId) {
      console.warn('[AdminDashboard] Integration not initialized');
      return;
    }

    try {
      await this.makeRequest('/track/error', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: this.sessionId,
          ...errorData
        })
      });
    } catch (error) {
      console.warn('[AdminDashboard] Failed to track error:', error);
    }
  }

  // End session
  async endSession() {
    if (!this.isInitialized || !this.sessionId) {
      console.warn('[AdminDashboard] Integration not initialized');
      return;
    }

    try {
      await this.makeRequest('/session/end', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: this.sessionId
        })
      });
      
      this.sessionId = null;
      this.isInitialized = false;
      console.log('[AdminDashboard] Session ended successfully');
    } catch (error) {
      console.warn('[AdminDashboard] Failed to end session:', error);
    }
  }

  // Get app health status
  async getAppHealthStatus() {
    try {
      const response = await this.makeRequest('/health');
      return response.data;
    } catch (error) {
      console.warn('[AdminDashboard] Failed to get app health:', error);
      return null;
    }
  }

  // Performance monitoring wrapper
  async measurePerformance(operation, callback) {
    const startTime = Date.now();
    let success = false;
    let error = null;

    try {
      const result = await callback();
      success = true;
      return result;
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      
      // Track performance
      await this.trackAppPerformance({
        loadTime: duration,
        renderTime: duration,
        memoryUsage: 0, // Could be enhanced with actual memory usage
        batteryLevel: 0  // Could be enhanced with actual battery level
      });

      // Track error if any
      if (error) {
        await this.trackAppError({
          type: `${operation}_error`,
          message: error.message,
          stack: error.stack,
          component: operation
        });
      }
    }
  }

  // Enhanced Quran loading with tracking
  async loadQuranData(surahId) {
    return this.measurePerformance('quran_loading', async () => {
      const startTime = Date.now();
      
      // Your existing Quran loading logic here
      // const quranData = await loadQuranData(surahId);
      
      const loadTime = Date.now() - startTime;
      
      // Track Quran loading
      await this.trackQuranLoading(surahId, loadTime, true);
      
      // return quranData;
    });
  }

  // Enhanced audio playback with tracking
  async playAudio(audioType, audioData) {
    return this.measurePerformance('audio_playback', async () => {
      const startTime = Date.now();
      
      // Your existing audio playback logic here
      // await playAudio(audioData);
      
      const duration = Date.now() - startTime;
      
      // Track audio playback
      await this.trackAudioPlayback(audioType, duration, true);
      
      // return audioResult;
    });
  }

  // Enhanced memorization tracking
  async trackMemorization(surahId, ayahId, success) {
    await this.trackMemorizationProgress(surahId, ayahId, success);
  }
}

// Create singleton instance
const adminDashboard = new AdminDashboardIntegration();

export default adminDashboard; 