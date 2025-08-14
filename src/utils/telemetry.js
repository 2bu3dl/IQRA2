import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { API_CONFIG, FEATURES } from './config';

// Telemetry configuration
const TELEMETRY_CONFIG = {
  BACKEND_URL: API_CONFIG.baseUrl,
  SEND_INTERVAL: 30000, // 30 seconds
  BATCH_SIZE: 10,
};

const TELEMETRY_URL = API_CONFIG.telemetryUrl;

// Telemetry data structure
class TelemetryService {
  constructor() {
    // Disable telemetry for development to prevent errors
    this.isEnabled = false;
    this.queue = [];
    this.lastSent = 0;
    this.sessionId = null;
    this.deviceInfo = null;
    this.init();
  }

  async init() {
    try {
      // Generate session ID
      this.sessionId = `iqra2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get device info
      this.deviceInfo = {
        deviceId: await DeviceInfo.getUniqueId(),
        deviceName: await DeviceInfo.getDeviceName(),
        systemName: await DeviceInfo.getSystemName(),
        systemVersion: await DeviceInfo.getSystemVersion(),
        appVersion: await DeviceInfo.getVersion(),
        buildNumber: await DeviceInfo.getBuildNumber(),
        isTablet: await DeviceInfo.isTablet(),
        brand: await DeviceInfo.getBrand(),
        model: await DeviceInfo.getModel(),
      };

      console.log('[Telemetry] Initialized with session:', this.sessionId);
      
      // Only start periodic sending if telemetry is enabled
      if (this.isEnabled) {
        this.startPeriodicSend();
      }
      
    } catch (error) {
      console.error('[Telemetry] Initialization error:', error);
    }
  }

  // Track app events
  trackEvent(eventName, data = {}) {
    if (!this.isEnabled) return;

    const event = {
      eventName,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      deviceInfo: this.deviceInfo,
    };

    this.queue.push(event);
    console.log('[Telemetry] Tracked event:', eventName, data);

    // Send immediately if queue is getting large
    if (this.queue.length >= TELEMETRY_CONFIG.BATCH_SIZE) {
      this.sendData();
    }
  }

  // Track app performance metrics
  async trackPerformance() {
    if (!this.isEnabled) return;
    
    try {
      const performanceData = {
        memoryUsage: await this.getMemoryUsage(),
        batteryLevel: await this.getBatteryLevel(),
        networkInfo: await this.getNetworkInfo(),
        appState: await this.getAppState(),
      };

      this.trackEvent('performance_metrics', performanceData);
    } catch (error) {
      console.error('[Telemetry] Performance tracking error:', error);
    }
  }

  // Track user interactions
  trackUserInteraction(interaction, details = {}) {
    this.trackEvent('user_interaction', {
      interaction,
      ...details,
    });
  }

  // Track app usage
  trackAppUsage(action, details = {}) {
    this.trackEvent('app_usage', {
      action,
      ...details,
    });
  }

  // Track memorization progress
  trackMemorizationProgress(surahName, ayahNumber, progress) {
    this.trackEvent('memorization_progress', {
      surahName,
      ayahNumber,
      progress,
    });
  }

  // Track hasanat earned
  trackHasanatEarned(amount, source) {
    this.trackEvent('hasanat_earned', {
      amount,
      source,
    });
  }

  // Get memory usage (simplified)
  async getMemoryUsage() {
    try {
      // This is a simplified version - in a real app you'd use native modules
      return {
        available: 'unknown',
        total: 'unknown',
        used: 'unknown',
      };
    } catch (error) {
      console.error('[Telemetry] Memory usage error:', error);
      return { error: error.message };
    }
  }

  // Get battery level
  async getBatteryLevel() {
    try {
      // This would require a native module in a real implementation
      // Simulate potential failure
      if (Math.random() < 0.1) {
        throw new Error('Battery level unavailable');
      }
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // Get network info
  async getNetworkInfo() {
    try {
      // This would require a native module in a real implementation
      // Simulate potential failure
      if (Math.random() < 0.1) {
        throw new Error('Network info unavailable');
      }
      return {
        type: 'unknown',
        isConnected: true,
      };
    } catch (error) {
      console.error('[Telemetry] Network info error:', error);
      return { error: error.message };
    }
  }

  // Get app state
  async getAppState() {
    try {
      // Simulate potential failure
      if (Math.random() < 0.1) {
        throw new Error('App state unavailable');
      }
      return {
        isActive: true,
        lastActive: Date.now(),
      };
    } catch (error) {
      console.error('[Telemetry] App state error:', error);
      return { error: error.message };
    }
  }

  // Send data to backend
  async sendData() {
    if (this.queue.length === 0 || !this.isEnabled) return;

    try {
      const dataToSend = this.queue.splice(0, TELEMETRY_CONFIG.BATCH_SIZE);
      
      const response = await fetch(TELEMETRY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: dataToSend,
          deviceInfo: this.deviceInfo,
          sessionId: this.sessionId,
        }),
      });

      if (response.ok) {
        this.lastSent = Date.now();
        console.log('[Telemetry] Sent', dataToSend.length, 'events to backend');
      } else {
        console.error('[Telemetry] Failed to send data:', response.status);
        // Put events back in queue for retry
        this.queue.unshift(...dataToSend);
      }
    } catch (error) {
      console.error('[Telemetry] Send error:', error);
      // Put events back in queue for retry
      if (this.queue.length > 0) {
        // Get the events that were being sent
        const eventsToRetry = this.queue.splice(0, TELEMETRY_CONFIG.BATCH_SIZE);
        this.queue.unshift(...eventsToRetry);
      }
    }
  }

  // Start periodic sending
  startPeriodicSend() {
    if (!this.isEnabled) return;
    
    setInterval(() => {
      if (this.queue.length > 0) {
        this.sendData();
      }
    }, TELEMETRY_CONFIG.SEND_INTERVAL);
  }

  // Enable/disable telemetry
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log('[Telemetry]', enabled ? 'Enabled' : 'Disabled');
    
    // Start periodic sending if enabling
    if (enabled) {
      this.startPeriodicSend();
    }
  }

  // Get current queue status
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      queueLength: this.queue.length,
      lastSent: this.lastSent,
      sessionId: this.sessionId,
    };
  }
}

// Create singleton instance
const telemetryService = new TelemetryService();

export default telemetryService; 