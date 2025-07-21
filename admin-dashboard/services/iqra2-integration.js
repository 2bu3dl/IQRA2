const { logger } = require('./logger');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class IQRA2IntegrationService {
  constructor() {
    this.appMetrics = {
      audioPlayback: { success: 0, failure: 0, avgResponseTime: 0 },
      progressTracking: { success: 0, failure: 0, avgResponseTime: 0 },
      quranLoading: { success: 0, failure: 0, avgResponseTime: 0 },
      userActivity: { activeUsers: 0, totalSessions: 0 },
      memoryUsage: { current: 0, peak: 0, average: 0 },
      performance: { loadTime: 0, renderTime: 0, crashRate: 0 }
    };
    
    this.activeSessions = new Map();
    this.performanceHistory = [];
    this.errorLog = [];
  }

  // Track user session
  async trackUserSession(userId, sessionData) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId,
      startTime: new Date().toISOString(),
      deviceInfo: sessionData.deviceInfo || {},
      appVersion: sessionData.appVersion || '1.0.0',
      lastActivity: new Date().toISOString(),
      metrics: {
        memorizationProgress: 0,
        audioRecordings: 0,
        screenTime: 0,
        errors: 0
      }
    };

    this.activeSessions.set(sessionId, session);
    logger.info(`User session started: ${sessionId} for user: ${userId}`);
    
    return sessionId;
  }

  // Track memorization progress
  async trackMemorizationProgress(sessionId, surahId, ayahId, success) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`Session not found: ${sessionId}`);
      return;
    }

    session.metrics.memorizationProgress++;
    session.lastActivity = new Date().toISOString();

    // Update app metrics
    if (success) {
      this.appMetrics.progressTracking.success++;
    } else {
      this.appMetrics.progressTracking.failure++;
    }

    logger.info(`Memorization progress tracked: Surah ${surahId}, Ayah ${ayahId}, Success: ${success}`);
  }

  // Track audio playback performance
  async trackAudioPlayback(sessionId, audioType, duration, success, error = null) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`Session not found: ${sessionId}`);
      return;
    }

    session.metrics.audioRecordings++;
    session.lastActivity = new Date().toISOString();

    // Update app metrics
    if (success) {
      this.appMetrics.audioPlayback.success++;
      this.appMetrics.audioPlayback.avgResponseTime = 
        (this.appMetrics.audioPlayback.avgResponseTime + duration) / 2;
    } else {
      this.appMetrics.audioPlayback.failure++;
      this.errorLog.push({
        timestamp: new Date().toISOString(),
        type: 'audio_playback_error',
        sessionId,
        audioType,
        error: error?.message || 'Unknown error',
        duration
      });
    }

    logger.info(`Audio playback tracked: ${audioType}, Duration: ${duration}ms, Success: ${success}`);
  }

  // Track Quran data loading
  async trackQuranLoading(sessionId, surahId, loadTime, success) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`Session not found: ${sessionId}`);
      return;
    }

    session.lastActivity = new Date().toISOString();

    // Update app metrics
    if (success) {
      this.appMetrics.quranLoading.success++;
      this.appMetrics.quranLoading.avgResponseTime = 
        (this.appMetrics.quranLoading.avgResponseTime + loadTime) / 2;
    } else {
      this.appMetrics.quranLoading.failure++;
    }

    logger.info(`Quran loading tracked: Surah ${surahId}, Load time: ${loadTime}ms, Success: ${success}`);
  }

  // Track app performance
  async trackAppPerformance(sessionId, performanceData) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`Session not found: ${sessionId}`);
      return;
    }

    session.lastActivity = new Date().toISOString();

    // Update performance metrics
    this.appMetrics.performance.loadTime = performanceData.loadTime || 0;
    this.appMetrics.performance.renderTime = performanceData.renderTime || 0;
    this.appMetrics.memoryUsage.current = performanceData.memoryUsage || 0;
    this.appMetrics.memoryUsage.peak = Math.max(this.appMetrics.memoryUsage.peak, performanceData.memoryUsage || 0);

    // Store performance history
    this.performanceHistory.push({
      timestamp: new Date().toISOString(),
      sessionId,
      ...performanceData
    });

    // Keep only last 1000 performance records
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }

    logger.info(`App performance tracked: Load time: ${performanceData.loadTime}ms, Memory: ${performanceData.memoryUsage}MB`);
  }

  // Track app errors
  async trackAppError(sessionId, errorData) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.metrics.errors++;
      session.lastActivity = new Date().toISOString();
    }

    // Update crash rate
    this.appMetrics.performance.crashRate = 
      (this.appMetrics.performance.crashRate * 0.9) + 0.1;

    // Log error
    this.errorLog.push({
      timestamp: new Date().toISOString(),
      sessionId,
      ...errorData
    });

    // Keep only last 1000 error records
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-1000);
    }

    logger.error(`App error tracked: ${errorData.type}, Message: ${errorData.message}`);
  }

  // End user session
  async endUserSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn(`Session not found: ${sessionId}`);
      return;
    }

    session.endTime = new Date().toISOString();
    session.duration = moment(session.endTime).diff(moment(session.startTime), 'seconds');

    // Update app metrics
    this.appMetrics.userActivity.totalSessions++;
    this.appMetrics.userActivity.activeUsers = this.activeSessions.size;

    this.activeSessions.delete(sessionId);
    logger.info(`User session ended: ${sessionId}, Duration: ${session.duration}s`);
  }

  // Get app health status
  getAppHealthStatus() {
    const totalAudioAttempts = this.appMetrics.audioPlayback.success + this.appMetrics.audioPlayback.failure;
    const totalProgressAttempts = this.appMetrics.progressTracking.success + this.appMetrics.progressTracking.failure;
    const totalQuranLoads = this.appMetrics.quranLoading.success + this.appMetrics.quranLoading.failure;

    const audioSuccessRate = totalAudioAttempts > 0 ? (this.appMetrics.audioPlayback.success / totalAudioAttempts) * 100 : 100;
    const progressSuccessRate = totalProgressAttempts > 0 ? (this.appMetrics.progressTracking.success / totalProgressAttempts) * 100 : 100;
    const quranLoadSuccessRate = totalQuranLoads > 0 ? (this.appMetrics.quranLoading.success / totalQuranLoads) * 100 : 100;

    return {
      status: 'healthy',
      metrics: {
        audioPlayback: {
          successRate: audioSuccessRate,
          avgResponseTime: this.appMetrics.audioPlayback.avgResponseTime,
          totalAttempts: totalAudioAttempts
        },
        progressTracking: {
          successRate: progressSuccessRate,
          avgResponseTime: this.appMetrics.progressTracking.avgResponseTime,
          totalAttempts: totalProgressAttempts
        },
        quranLoading: {
          successRate: quranLoadSuccessRate,
          avgResponseTime: this.appMetrics.quranLoading.avgResponseTime,
          totalAttempts: totalQuranLoads
        },
        userActivity: {
          activeUsers: this.appMetrics.userActivity.activeUsers,
          totalSessions: this.appMetrics.userActivity.totalSessions
        },
        performance: {
          loadTime: this.appMetrics.performance.loadTime,
          renderTime: this.appMetrics.performance.renderTime,
          crashRate: this.appMetrics.performance.crashRate,
          memoryUsage: this.appMetrics.memoryUsage
        }
      },
      recentErrors: this.errorLog.slice(-10),
      performanceHistory: this.performanceHistory.slice(-50)
    };
  }

  // Get active sessions
  getActiveSessions() {
    return Array.from(this.activeSessions.values());
  }

  // Clean up old sessions (older than 24 hours)
  cleanupOldSessions() {
    const cutoffTime = moment().subtract(24, 'hours');
    let cleanedCount = 0;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (moment(session.lastActivity).isBefore(cutoffTime)) {
        this.activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} old sessions`);
    }
  }

  // Initialize the service
  async initialize() {
    logger.info('Initializing IQRA2 Integration Service...');
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupOldSessions();
    }, 60 * 60 * 1000); // Every hour

    logger.info('IQRA2 Integration Service initialized successfully');
  }
}

module.exports = { IQRA2IntegrationService }; 