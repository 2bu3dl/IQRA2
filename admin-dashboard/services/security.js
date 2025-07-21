const { logger } = require('./logger');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const crypto = require('crypto');

class SecurityService {
  constructor() {
    this.securityEvents = [];
    this.threats = [];
    this.blockedIPs = new Set();
    this.suspiciousActivities = [];
    this.securityMetrics = {
      failedLogins: 0,
      suspiciousIPs: 0,
      rateLimitViolations: 0,
      securityAlerts: 0,
      blockedRequests: 0
    };
    this.securityRules = {
      maxFailedLogins: 5,
      maxRequestsPerMinute: 100,
      suspiciousPatterns: [
        /sql\s+injection/i,
        /xss/i,
        /script/i,
        /eval\(/i,
        /union\s+select/i
      ]
    };
  }

  // Initialize security monitoring
  async initialize() {
    logger.info('Initializing security service...');
    
    // Start security monitoring
    this.startSecurityMonitoring();
    
    // Start threat detection
    this.startThreatDetection();
    
    // Start vulnerability scanning
    this.startVulnerabilityScanning();
    
    logger.info('Security service initialized successfully');
  }

  // Security monitoring
  startSecurityMonitoring() {
    setInterval(() => {
      this.updateSecurityMetrics();
    }, 30000); // Every 30 seconds
  }

  // Threat detection
  startThreatDetection() {
    setInterval(() => {
      this.detectThreats();
    }, 60000); // Every minute
  }

  // Vulnerability scanning
  startVulnerabilityScanning() {
    setInterval(() => {
      this.scanVulnerabilities();
    }, 300000); // Every 5 minutes
  }

  // Log security event
  logSecurityEvent(type, data, severity = 'info') {
    const event = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type,
      data,
      severity,
      ip: data.ip || 'unknown',
      userAgent: data.userAgent || 'unknown',
      userId: data.userId || 'anonymous'
    };

    this.securityEvents.push(event);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    logger.info(`Security event logged: ${type}`, event);
    
    // Check for security alerts
    this.checkSecurityAlerts(event);
    
    return event;
  }

  // Check request for security threats
  checkRequest(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const requestData = {
      ip: clientIP,
      userAgent,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    };

    // Check if IP is blocked
    if (this.blockedIPs.has(clientIP)) {
      this.logSecurityEvent('BLOCKED_REQUEST', requestData, 'high');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for suspicious patterns
    const suspiciousPattern = this.detectSuspiciousPattern(requestData);
    if (suspiciousPattern) {
      this.logSecurityEvent('SUSPICIOUS_PATTERN', {
        ...requestData,
        pattern: suspiciousPattern
      }, 'medium');
    }

    // Check rate limiting
    const rateLimitViolation = this.checkRateLimit(clientIP);
    if (rateLimitViolation) {
      this.logSecurityEvent('RATE_LIMIT_VIOLATION', requestData, 'medium');
      this.blockedIPs.add(clientIP);
      return res.status(429).json({ error: 'Too many requests' });
    }

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    next();
  }

  // Detect suspicious patterns
  detectSuspiciousPattern(requestData) {
    const { url, body, headers } = requestData;
    const content = JSON.stringify({ url, body, headers }).toLowerCase();

    for (const pattern of this.securityRules.suspiciousPatterns) {
      if (pattern.test(content)) {
        return pattern.source;
      }
    }

    return null;
  }

  // Check rate limiting
  checkRateLimit(clientIP) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentRequests = this.securityEvents.filter(event => 
      event.data.ip === clientIP && 
      new Date(event.timestamp).getTime() > oneMinuteAgo
    );

    return recentRequests.length > this.securityRules.maxRequestsPerMinute;
  }

  // Authentication security
  checkAuthentication(req, res, next) {
    const { username, password } = req.body;
    
    if (!username || !password) {
      this.logSecurityEvent('MISSING_CREDENTIALS', {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }, 'medium');
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Check for brute force attempts
    const failedAttempts = this.getFailedLoginAttempts(req.ip);
    if (failedAttempts >= this.securityRules.maxFailedLogins) {
      this.logSecurityEvent('BRUTE_FORCE_ATTEMPT', {
        ip: req.ip,
        username,
        failedAttempts
      }, 'high');
      
      this.blockedIPs.add(req.ip);
      return res.status(403).json({ error: 'Account temporarily locked' });
    }

    next();
  }

  // Log failed login
  logFailedLogin(ip, username) {
    this.logSecurityEvent('FAILED_LOGIN', {
      ip,
      username,
      timestamp: new Date().toISOString()
    }, 'medium');
    
    this.securityMetrics.failedLogins++;
  }

  // Get failed login attempts
  getFailedLoginAttempts(ip) {
    const oneHourAgo = moment().subtract(1, 'hour');
    return this.securityEvents.filter(event => 
      event.type === 'FAILED_LOGIN' &&
      event.data.ip === ip &&
      moment(event.timestamp).isAfter(oneHourAgo)
    ).length;
  }

  // Detect threats
  detectThreats() {
    const recentEvents = this.securityEvents.filter(event =>
      moment(event.timestamp).isAfter(moment().subtract(1, 'hour'))
    );

    // Detect unusual activity patterns
    const ipActivity = {};
    recentEvents.forEach(event => {
      const ip = event.data.ip;
      ipActivity[ip] = (ipActivity[ip] || 0) + 1;
    });

    // Check for suspicious IP activity
    Object.entries(ipActivity).forEach(([ip, count]) => {
      if (count > 50) { // More than 50 events in an hour
        this.createThreat('SUSPICIOUS_IP_ACTIVITY', {
          ip,
          eventCount: count,
          timeWindow: '1 hour'
        });
      }
    });

    // Check for failed login patterns
    const failedLogins = recentEvents.filter(event => event.type === 'FAILED_LOGIN');
    if (failedLogins.length > 10) {
      this.createThreat('MULTIPLE_FAILED_LOGINS', {
        count: failedLogins.length,
        timeWindow: '1 hour'
      });
    }
  }

  // Create threat
  createThreat(type, data) {
    const threat = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type,
      data,
      severity: this.calculateThreatSeverity(type),
      status: 'active'
    };

    this.threats.push(threat);
    
    // Keep only last 100 threats
    if (this.threats.length > 100) {
      this.threats = this.threats.slice(-100);
    }

    logger.warn(`Threat detected: ${type}`, threat);
    
    return threat;
  }

  // Calculate threat severity
  calculateThreatSeverity(type) {
    const severityMap = {
      'BRUTE_FORCE_ATTEMPT': 'high',
      'SUSPICIOUS_PATTERN': 'medium',
      'RATE_LIMIT_VIOLATION': 'medium',
      'SUSPICIOUS_IP_ACTIVITY': 'medium',
      'MULTIPLE_FAILED_LOGINS': 'high',
      'SQL_INJECTION_ATTEMPT': 'critical',
      'XSS_ATTEMPT': 'critical'
    };

    return severityMap[type] || 'low';
  }

  // Scan for vulnerabilities
  async scanVulnerabilities() {
    const vulnerabilities = [];

    // Check for common vulnerabilities
    vulnerabilities.push(...await this.checkSQLInjectionVulnerabilities());
    vulnerabilities.push(...await this.checkXSSVulnerabilities());
    vulnerabilities.push(...await this.checkAuthenticationVulnerabilities());
    vulnerabilities.push(...await this.checkAuthorizationVulnerabilities());

    if (vulnerabilities.length > 0) {
      this.logSecurityEvent('VULNERABILITY_SCAN', {
        vulnerabilities,
        scanTime: new Date().toISOString()
      }, 'medium');
    }

    return vulnerabilities;
  }

  // Check SQL injection vulnerabilities
  async checkSQLInjectionVulnerabilities() {
    const vulnerabilities = [];
    
    // Simulate SQL injection checks
    const testPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "1' UNION SELECT * FROM users --"
    ];

    for (const payload of testPayloads) {
      try {
        // This would be actual vulnerability testing
        // For now, we'll simulate it
        if (Math.random() < 0.1) { // 10% chance of finding vulnerability
          vulnerabilities.push({
            type: 'SQL_INJECTION',
            payload,
            severity: 'high',
            description: 'Potential SQL injection vulnerability detected'
          });
        }
      } catch (error) {
        logger.error('Error checking SQL injection vulnerabilities:', error);
      }
    }

    return vulnerabilities;
  }

  // Check XSS vulnerabilities
  async checkXSSVulnerabilities() {
    const vulnerabilities = [];
    
    // Simulate XSS checks
    const testPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')"
    ];

    for (const payload of testPayloads) {
      try {
        // This would be actual vulnerability testing
        if (Math.random() < 0.05) { // 5% chance of finding vulnerability
          vulnerabilities.push({
            type: 'XSS',
            payload,
            severity: 'medium',
            description: 'Potential XSS vulnerability detected'
          });
        }
      } catch (error) {
        logger.error('Error checking XSS vulnerabilities:', error);
      }
    }

    return vulnerabilities;
  }

  // Check authentication vulnerabilities
  async checkAuthenticationVulnerabilities() {
    const vulnerabilities = [];
    
    // Check for weak password policies
    const weakPasswords = this.detectWeakPasswords();
    if (weakPasswords.length > 0) {
      vulnerabilities.push({
        type: 'WEAK_PASSWORD_POLICY',
        severity: 'medium',
        description: 'Weak password policy detected',
        details: weakPasswords
      });
    }

    // Check for session vulnerabilities
    const sessionVulnerabilities = this.checkSessionVulnerabilities();
    vulnerabilities.push(...sessionVulnerabilities);

    return vulnerabilities;
  }

  // Check authorization vulnerabilities
  async checkAuthorizationVulnerabilities() {
    const vulnerabilities = [];
    
    // Check for privilege escalation attempts
    const privilegeEscalationAttempts = this.securityEvents.filter(event =>
      event.type === 'PRIVILEGE_ESCALATION_ATTEMPT'
    );

    if (privilegeEscalationAttempts.length > 0) {
      vulnerabilities.push({
        type: 'PRIVILEGE_ESCALATION',
        severity: 'high',
        description: 'Privilege escalation attempts detected',
        count: privilegeEscalationAttempts.length
      });
    }

    return vulnerabilities;
  }

  // Detect weak passwords
  detectWeakPasswords() {
    // This would check actual password policies
    // For now, return empty array
    return [];
  }

  // Check session vulnerabilities
  checkSessionVulnerabilities() {
    const vulnerabilities = [];
    
    // Check for session fixation attempts
    const sessionFixationAttempts = this.securityEvents.filter(event =>
      event.type === 'SESSION_FIXATION_ATTEMPT'
    );

    if (sessionFixationAttempts.length > 0) {
      vulnerabilities.push({
        type: 'SESSION_FIXATION',
        severity: 'medium',
        description: 'Session fixation attempts detected',
        count: sessionFixationAttempts.length
      });
    }

    return vulnerabilities;
  }

  // Update security metrics
  updateSecurityMetrics() {
    const recentEvents = this.securityEvents.filter(event =>
      moment(event.timestamp).isAfter(moment().subtract(1, 'hour'))
    );

    this.securityMetrics = {
      failedLogins: recentEvents.filter(e => e.type === 'FAILED_LOGIN').length,
      suspiciousIPs: this.getSuspiciousIPs().length,
      rateLimitViolations: recentEvents.filter(e => e.type === 'RATE_LIMIT_VIOLATION').length,
      securityAlerts: this.threats.filter(t => t.status === 'active').length,
      blockedRequests: recentEvents.filter(e => e.type === 'BLOCKED_REQUEST').length
    };
  }

  // Get suspicious IPs
  getSuspiciousIPs() {
    const recentEvents = this.securityEvents.filter(event =>
      moment(event.timestamp).isAfter(moment().subtract(1, 'hour'))
    );

    const ipActivity = {};
    recentEvents.forEach(event => {
      const ip = event.data.ip;
      ipActivity[ip] = (ipActivity[ip] || 0) + 1;
    });

    return Object.entries(ipActivity)
      .filter(([ip, count]) => count > 20)
      .map(([ip, count]) => ({ ip, activityCount: count }));
  }

  // Check security alerts
  checkSecurityAlerts(event) {
    if (event.severity === 'high' || event.severity === 'critical') {
      this.createThreat('SECURITY_ALERT', {
        eventType: event.type,
        severity: event.severity,
        data: event.data
      });
    }
  }

  // Get security metrics
  getSecurityMetrics() {
    return {
      metrics: this.securityMetrics,
      recentEvents: this.securityEvents.slice(-50),
      activeThreats: this.threats.filter(t => t.status === 'active'),
      blockedIPs: Array.from(this.blockedIPs),
      suspiciousIPs: this.getSuspiciousIPs()
    };
  }

  // Unblock IP
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    logger.info(`IP ${ip} unblocked`);
  }

  // Acknowledge threat
  acknowledgeThreat(threatId) {
    const threat = this.threats.find(t => t.id === threatId);
    if (threat) {
      threat.status = 'acknowledged';
      threat.acknowledgedAt = new Date().toISOString();
      logger.info(`Threat ${threatId} acknowledged`);
    }
  }

  // Generate security report
  generateSecurityReport() {
    const now = moment();
    const last24Hours = now.subtract(24, 'hours');
    
    const events24h = this.securityEvents.filter(event =>
      moment(event.timestamp).isAfter(last24Hours)
    );

    return {
      period: '24 hours',
      totalEvents: events24h.length,
      eventsByType: this.groupEventsByType(events24h),
      threats: this.threats.filter(t => 
        moment(t.timestamp).isAfter(last24Hours)
      ),
      metrics: this.securityMetrics,
      recommendations: this.generateSecurityRecommendations()
    };
  }

  // Group events by type
  groupEventsByType(events) {
    const grouped = {};
    events.forEach(event => {
      grouped[event.type] = (grouped[event.type] || 0) + 1;
    });
    return grouped;
  }

  // Generate security recommendations
  generateSecurityRecommendations() {
    const recommendations = [];

    if (this.securityMetrics.failedLogins > 10) {
      recommendations.push({
        type: 'AUTHENTICATION',
        priority: 'high',
        description: 'High number of failed login attempts detected. Consider implementing additional authentication measures.',
        action: 'Implement multi-factor authentication and account lockout policies.'
      });
    }

    if (this.securityMetrics.suspiciousIPs > 5) {
      recommendations.push({
        type: 'NETWORK',
        priority: 'medium',
        description: 'Multiple suspicious IP addresses detected.',
        action: 'Review and update firewall rules and implement IP reputation checking.'
      });
    }

    if (this.threats.filter(t => t.severity === 'critical').length > 0) {
      recommendations.push({
        type: 'CRITICAL',
        priority: 'critical',
        description: 'Critical security threats detected.',
        action: 'Immediate review and remediation required.'
      });
    }

    return recommendations;
  }
}

module.exports = { SecurityService }; 