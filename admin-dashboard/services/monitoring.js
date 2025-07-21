const { logger } = require('./logger');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class MonitoringService {
  constructor(io) {
    this.io = io;
    this.metrics = {
      system: {},
      app: {},
      errors: [],
      performance: [],
      security: []
    };
    this.alerts = [];
    this.healthChecks = new Map();
    this.startTime = Date.now();
  }

  // Initialize monitoring
  async initialize() {
    logger.info('Initializing monitoring service...');
    
    // Start system monitoring
    this.startSystemMonitoring();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Start error tracking
    this.startErrorTracking();
    
    // Start security monitoring
    this.startSecurityMonitoring();
    
    logger.info('Monitoring service initialized successfully');
  }

  // System monitoring
  startSystemMonitoring() {
    setInterval(() => {
      const systemMetrics = {
        timestamp: new Date().toISOString(),
        cpu: {
          usage: os.loadavg(),
          cores: os.cpus().length
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
        },
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch()
      };

      this.metrics.system = systemMetrics;
      
      // Check for system alerts
      this.checkSystemAlerts(systemMetrics);
      
      // Emit to dashboard
      this.io.to('dashboard').emit('system-metrics', systemMetrics);
    }, 15000); // Every 15 seconds (increased from 5 seconds)
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    setInterval(() => {
      const performanceMetrics = {
        timestamp: new Date().toISOString(),
        responseTime: this.calculateAverageResponseTime(),
        throughput: this.calculateThroughput(),
        errorRate: this.calculateErrorRate(),
        activeConnections: this.getActiveConnections()
      };

      this.metrics.performance.push(performanceMetrics);
      
      // Keep only last 100 performance records (reduced from 1000)
      if (this.metrics.performance.length > 100) {
        this.metrics.performance = this.metrics.performance.slice(-100);
      }

      // Check for performance alerts
      this.checkPerformanceAlerts(performanceMetrics);
      
      // Emit to dashboard
      this.io.to('dashboard').emit('performance-metrics', performanceMetrics);
    }, 30000); // Every 30 seconds (increased from 10 seconds)
  }

  // Error tracking
  startErrorTracking() {
    process.on('uncaughtException', (error) => {
      this.logError('Uncaught Exception', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logError('Unhandled Rejection', { reason, promise });
    });
  }

  // Security monitoring
  startSecurityMonitoring() {
    setInterval(() => {
      const securityMetrics = {
        timestamp: new Date().toISOString(),
        failedLogins: this.getFailedLogins(),
        suspiciousIPs: this.getSuspiciousIPs(),
        rateLimitViolations: this.getRateLimitViolations(),
        securityAlerts: this.getSecurityAlerts()
      };

      this.metrics.security.push(securityMetrics);
      
      // Keep only last 100 security records
      if (this.metrics.security.length > 100) {
        this.metrics.security = this.metrics.security.slice(-100);
      }

      // Emit to dashboard
      this.io.to('dashboard').emit('security-metrics', securityMetrics);
    }, 30000); // Every 30 seconds
  }

  // Log errors
  logError(type, error, context = {}) {
    const errorRecord = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type,
      message: error.message || error,
      stack: error.stack,
      context,
      severity: this.calculateErrorSeverity(error)
    };

    this.metrics.errors.push(errorRecord);
    
    // Keep only last 1000 errors
    if (this.metrics.errors.length > 1000) {
      this.metrics.errors = this.metrics.errors.slice(-1000);
    }

    logger.error(`Error logged: ${type}`, errorRecord);
    
    // Emit to dashboard
    this.io.to('dashboard').emit('error-logged', errorRecord);
    
    // Check for error alerts
    this.checkErrorAlerts(errorRecord);
  }

  // Health check registration
  registerHealthCheck(name, checkFunction, interval = 30000) {
    this.healthChecks.set(name, {
      function: checkFunction,
      interval,
      lastCheck: null,
      status: 'unknown'
    });

    // Start the health check
    this.runHealthCheck(name);
  }

  // Run health check
  async runHealthCheck(name) {
    const healthCheck = this.healthChecks.get(name);
    if (!healthCheck) return;

    try {
      const result = await healthCheck.function();
      healthCheck.status = result.healthy ? 'healthy' : 'unhealthy';
      healthCheck.lastCheck = new Date().toISOString();
      healthCheck.lastResult = result;

      // Emit health check result
      this.io.to('dashboard').emit('health-check', {
        name,
        status: healthCheck.status,
        timestamp: healthCheck.lastCheck,
        result
      });

      // Schedule next check
      setTimeout(() => this.runHealthCheck(name), healthCheck.interval);
    } catch (error) {
      healthCheck.status = 'error';
      healthCheck.lastCheck = new Date().toISOString();
      healthCheck.lastError = error.message;

      logger.error(`Health check failed for ${name}:`, error);
      
      // Emit health check error
      this.io.to('dashboard').emit('health-check-error', {
        name,
        error: error.message,
        timestamp: healthCheck.lastCheck
      });

      // Schedule next check
      setTimeout(() => this.runHealthCheck(name), healthCheck.interval);
    }
  }

  // Alert checking methods
  checkSystemAlerts(metrics) {
    // Only create alerts if we don't already have recent alerts of the same type
    const recentAlerts = this.alerts.filter(alert => 
      alert.category === 'SYSTEM' && 
      moment(alert.timestamp).isAfter(moment().subtract(5, 'minutes'))
    );

    if (metrics.memory.usage > 90 && !recentAlerts.some(a => a.type === 'HIGH_MEMORY_USAGE')) {
      this.createAlert('SYSTEM', 'HIGH_MEMORY_USAGE', 'Memory usage is above 90%', metrics);
    }
    
    if (metrics.cpu.usage[0] > 80 && !recentAlerts.some(a => a.type === 'HIGH_CPU_USAGE')) {
      this.createAlert('SYSTEM', 'HIGH_CPU_USAGE', 'CPU usage is above 80%', metrics);
    }
  }

  checkPerformanceAlerts(metrics) {
    if (metrics.responseTime > 2000) {
      this.createAlert('PERFORMANCE', 'SLOW_RESPONSE', 'Average response time is above 2 seconds', metrics);
    }
    
    if (metrics.errorRate > 5) {
      this.createAlert('PERFORMANCE', 'HIGH_ERROR_RATE', 'Error rate is above 5%', metrics);
    }
  }

  checkErrorAlerts(error) {
    if (error.severity === 'critical') {
      this.createAlert('ERROR', 'CRITICAL_ERROR', 'Critical error detected', error);
    }
  }

  // Create alert
  createAlert(category, type, message, data) {
    const alert = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      category,
      type,
      message,
      data,
      acknowledged: false
    };

    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    logger.warn(`Alert created: ${category} - ${type}`, alert);
    
    // Emit to dashboard
    this.io.to('dashboard').emit('alert-created', alert);
  }

  // Utility methods
  calculateAverageResponseTime() {
    // This would be implemented based on your actual response time tracking
    return Math.random() * 1000; // Placeholder
  }

  calculateThroughput() {
    // This would be implemented based on your actual throughput tracking
    return Math.random() * 100; // Placeholder
  }

  calculateErrorRate() {
    const recentErrors = this.metrics.errors.filter(
      error => moment(error.timestamp).isAfter(moment().subtract(1, 'hour'))
    );
    return recentErrors.length / 100; // Placeholder calculation
  }

  getActiveConnections() {
    // This would be implemented based on your actual connection tracking
    return Math.floor(Math.random() * 50); // Placeholder
  }

  calculateErrorSeverity(error) {
    // Simple severity calculation based on error type
    if (error.message && error.message.includes('critical')) return 'critical';
    if (error.message && error.message.includes('warning')) return 'warning';
    return 'info';
  }

  getFailedLogins() {
    // This would be implemented based on your actual login tracking
    return Math.floor(Math.random() * 10); // Placeholder
  }

  getSuspiciousIPs() {
    // This would be implemented based on your actual IP tracking
    return Math.floor(Math.random() * 5); // Placeholder
  }

  getRateLimitViolations() {
    // This would be implemented based on your actual rate limit tracking
    return Math.floor(Math.random() * 3); // Placeholder
  }

  getSecurityAlerts() {
    // This would be implemented based on your actual security tracking
    return Math.floor(Math.random() * 2); // Placeholder
  }

  // Get all metrics
  getMetrics() {
    return {
      system: this.metrics.system,
      performance: this.metrics.performance.slice(-100),
      errors: this.metrics.errors.slice(-100),
      security: this.metrics.security.slice(-50),
      alerts: this.alerts.slice(-50),
      healthChecks: Array.from(this.healthChecks.entries()).map(([name, check]) => ({
        name,
        status: check.status,
        lastCheck: check.lastCheck,
        lastResult: check.lastResult
      }))
    };
  }

  // Acknowledge alert
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.io.to('dashboard').emit('alert-acknowledged', alertId);
    }
  }
}

// Initialize monitoring service
async function initializeMonitoring(io) {
  const monitoringService = new MonitoringService(io);
  await monitoringService.initialize();
  
  // Register some default health checks
  monitoringService.registerHealthCheck('database', async () => {
    // This would check your database connection
    return { healthy: true, message: 'Database connection OK' };
  });
  
  monitoringService.registerHealthCheck('external-api', async () => {
    // This would check external API dependencies
    return { healthy: true, message: 'External APIs OK' };
  });
  
  monitoringService.registerHealthCheck('file-system', async () => {
    // This would check file system access
    return { healthy: true, message: 'File system OK' };
  });

  return monitoringService;
}

module.exports = { initializeMonitoring, MonitoringService }; 