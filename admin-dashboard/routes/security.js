const express = require('express');
const router = express.Router();
const { logger } = require('../services/logger');

// Mock security service for demonstration
// In production, this would be imported from the actual service
let securityService = {
  securityEvents: [],
  threats: [],
  blockedIPs: new Set(),
  securityMetrics: {
    failedLogins: 0,
    suspiciousIPs: 0,
    rateLimitViolations: 0,
    securityAlerts: 0,
    blockedRequests: 0
  },
  getSecurityMetrics: () => ({
    metrics: securityService.securityMetrics,
    recentEvents: securityService.securityEvents.slice(-50),
    activeThreats: securityService.threats.filter(t => t.status === 'active'),
    blockedIPs: Array.from(securityService.blockedIPs),
    suspiciousIPs: securityService.getSuspiciousIPs()
  }),
  getSuspiciousIPs: () => {
    const recentEvents = securityService.securityEvents.filter(event =>
      new Date(event.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );
    
    const ipActivity = {};
    recentEvents.forEach(event => {
      const ip = event.data.ip;
      ipActivity[ip] = (ipActivity[ip] || 0) + 1;
    });
    
    return Object.entries(ipActivity)
      .filter(([ip, count]) => count > 20)
      .map(([ip, count]) => ({ ip, activityCount: count }));
  },
  generateSecurityReport: () => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const events24h = securityService.securityEvents.filter(event =>
      new Date(event.timestamp) > last24Hours
    );
    
    return {
      period: '24 hours',
      totalEvents: events24h.length,
      eventsByType: securityService.groupEventsByType(events24h),
      threats: securityService.threats.filter(t => 
        new Date(t.timestamp) > last24Hours
      ),
      metrics: securityService.securityMetrics,
      recommendations: securityService.generateSecurityRecommendations()
    };
  },
  groupEventsByType: (events) => {
    const grouped = {};
    events.forEach(event => {
      grouped[event.type] = (grouped[event.type] || 0) + 1;
    });
    return grouped;
  },
  generateSecurityRecommendations: () => {
    const recommendations = [];
    
    if (securityService.securityMetrics.failedLogins > 10) {
      recommendations.push({
        type: 'AUTHENTICATION',
        priority: 'high',
        description: 'High number of failed login attempts detected. Consider implementing additional authentication measures.',
        action: 'Implement multi-factor authentication and account lockout policies.'
      });
    }
    
    if (securityService.securityMetrics.suspiciousIPs > 5) {
      recommendations.push({
        type: 'NETWORK',
        priority: 'medium',
        description: 'Multiple suspicious IP addresses detected.',
        action: 'Review and update firewall rules and implement IP reputation checking.'
      });
    }
    
    if (securityService.threats.filter(t => t.severity === 'critical').length > 0) {
      recommendations.push({
        type: 'CRITICAL',
        priority: 'critical',
        description: 'Critical security threats detected.',
        action: 'Immediate review and remediation required.'
      });
    }
    
    return recommendations;
  },
  unblockIP: (ip) => {
    securityService.blockedIPs.delete(ip);
    logger.info(`IP ${ip} unblocked`);
    return true;
  },
  acknowledgeThreat: (threatId) => {
    const threat = securityService.threats.find(t => t.id === threatId);
    if (threat) {
      threat.status = 'acknowledged';
      threat.acknowledgedAt = new Date().toISOString();
      logger.info(`Threat ${threatId} acknowledged`);
      return true;
    }
    return false;
  }
};

// Get security metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = securityService.getSecurityMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching security metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security metrics',
      message: error.message
    });
  }
});

// Get security events
router.get('/events', (req, res) => {
  try {
    const { limit = 50, severity, type } = req.query;
    let events = securityService.securityEvents;
    
    // Filter by severity
    if (severity) {
      events = events.filter(event => event.severity === severity);
    }
    
    // Filter by type
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    // Limit results
    events = events.slice(-parseInt(limit));
    
    res.json({
      success: true,
      data: events,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching security events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security events',
      message: error.message
    });
  }
});

// Get threats
router.get('/threats', (req, res) => {
  try {
    const { status = 'active' } = req.query;
    let threats = securityService.threats;
    
    if (status !== 'all') {
      threats = threats.filter(threat => threat.status === status);
    }
    
    res.json({
      success: true,
      data: threats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching threats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch threats',
      message: error.message
    });
  }
});

// Get blocked IPs
router.get('/blocked-ips', (req, res) => {
  try {
    const blockedIPs = Array.from(securityService.blockedIPs);
    res.json({
      success: true,
      data: blockedIPs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching blocked IPs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blocked IPs',
      message: error.message
    });
  }
});

// Get suspicious IPs
router.get('/suspicious-ips', (req, res) => {
  try {
    const suspiciousIPs = securityService.getSuspiciousIPs();
    res.json({
      success: true,
      data: suspiciousIPs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching suspicious IPs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suspicious IPs',
      message: error.message
    });
  }
});

// Unblock IP
router.post('/unblock-ip', (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'IP address is required',
        message: 'Please provide an IP address to unblock'
      });
    }
    
    const unblocked = securityService.unblockIP(ip);
    
    res.json({
      success: unblocked,
      message: unblocked ? `IP ${ip} unblocked successfully` : `IP ${ip} was not blocked`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error unblocking IP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unblock IP',
      message: error.message
    });
  }
});

// Acknowledge threat
router.post('/threats/:threatId/acknowledge', (req, res) => {
  try {
    const { threatId } = req.params;
    const acknowledged = securityService.acknowledgeThreat(threatId);
    
    res.json({
      success: acknowledged,
      message: acknowledged ? 'Threat acknowledged successfully' : 'Threat not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error acknowledging threat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge threat',
      message: error.message
    });
  }
});

// Get security report
router.get('/report', (req, res) => {
  try {
    const report = securityService.generateSecurityReport();
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating security report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate security report',
      message: error.message
    });
  }
});

// Get vulnerability scan results
router.get('/vulnerabilities', (req, res) => {
  try {
    // Mock vulnerability scan results
    const vulnerabilities = [
      {
        id: 'vuln-1',
        type: 'SQL_INJECTION',
        severity: 'high',
        description: 'Potential SQL injection vulnerability in user input',
        location: '/api/users/search',
        status: 'open',
        discoveredAt: new Date().toISOString()
      },
      {
        id: 'vuln-2',
        type: 'XSS',
        severity: 'medium',
        description: 'Cross-site scripting vulnerability in comment system',
        location: '/api/comments',
        status: 'fixed',
        discoveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'vuln-3',
        type: 'WEAK_PASSWORD_POLICY',
        severity: 'medium',
        description: 'Weak password policy allows common passwords',
        location: '/api/auth/register',
        status: 'open',
        discoveredAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: vulnerabilities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching vulnerabilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vulnerabilities',
      message: error.message
    });
  }
});

// Get security summary
router.get('/summary', (req, res) => {
  try {
    const metrics = securityService.getSecurityMetrics();
    const report = securityService.generateSecurityReport();
    
    const summary = {
      metrics: metrics.metrics,
      threats: {
        total: metrics.activeThreats.length,
        bySeverity: metrics.activeThreats.reduce((acc, threat) => {
          acc[threat.severity] = (acc[threat.severity] || 0) + 1;
          return acc;
        }, {})
      },
      events: {
        total: report.totalEvents,
        byType: report.eventsByType
      },
      blockedIPs: metrics.blockedIPs.length,
      suspiciousIPs: metrics.suspiciousIPs.length,
      recommendations: report.recommendations.length
    };
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching security summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security summary',
      message: error.message
    });
  }
});

// Get security trends
router.get('/trends', (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    // Generate mock trend data
    const trends = generateSecurityTrends(period);
    
    res.json({
      success: true,
      data: trends,
      period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching security trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security trends',
      message: error.message
    });
  }
});

// Generate security trends
function generateSecurityTrends(period) {
  const now = new Date();
  const data = [];
  
  let points = 24; // Default to 24 points
  let interval = 60 * 60 * 1000; // 1 hour in milliseconds
  
  switch (period) {
    case '1h':
      points = 60;
      interval = 60 * 1000; // 1 minute
      break;
    case '6h':
      points = 72;
      interval = 5 * 60 * 1000; // 5 minutes
      break;
    case '24h':
      points = 24;
      interval = 60 * 60 * 1000; // 1 hour
      break;
    case '7d':
      points = 168;
      interval = 60 * 60 * 1000; // 1 hour
      break;
    case '30d':
      points = 30;
      interval = 24 * 60 * 60 * 1000; // 1 day
      break;
  }
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * interval));
    
    data.push({
      timestamp: timestamp.toISOString(),
      failedLogins: Math.floor(Math.random() * 10),
      suspiciousIPs: Math.floor(Math.random() * 5),
      rateLimitViolations: Math.floor(Math.random() * 3),
      securityAlerts: Math.floor(Math.random() * 2),
      blockedRequests: Math.floor(Math.random() * 8)
    });
  }
  
  return data;
}

// Get security recommendations
router.get('/recommendations', (req, res) => {
  try {
    const recommendations = securityService.generateSecurityRecommendations();
    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching security recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security recommendations',
      message: error.message
    });
  }
});

// Export security data
router.get('/export', (req, res) => {
  try {
    const { format = 'json', type = 'all' } = req.query;
    
    let data;
    switch (type) {
      case 'events':
        data = securityService.securityEvents;
        break;
      case 'threats':
        data = securityService.threats;
        break;
      case 'report':
        data = securityService.generateSecurityReport();
        break;
      default:
        data = {
          events: securityService.securityEvents,
          threats: securityService.threats,
          metrics: securityService.getSecurityMetrics(),
          report: securityService.generateSecurityReport()
        };
    }
    
    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateSecurityCSV(data, type);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="security-${type}-${Date.now()}.csv"`);
      res.send(csvData);
    } else {
      // JSON format
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Error exporting security data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export security data',
      message: error.message
    });
  }
});

// Generate security CSV data
function generateSecurityCSV(data, type) {
  const headers = ['Timestamp', 'Type', 'Severity', 'Description', 'Status'];
  const rows = [headers.join(',')];
  
  if (Array.isArray(data)) {
    data.forEach(item => {
      rows.push([
        item.timestamp,
        item.type,
        item.severity || 'unknown',
        item.description || item.message || '',
        item.status || 'unknown'
      ].join(','));
    });
  }
  
  return rows.join('\n');
}

module.exports = router; 