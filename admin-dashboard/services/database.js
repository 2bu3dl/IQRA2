const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger } = require('./logger');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../data/admin_dashboard.db');
  }

  // Initialize database
  async initialize() {
    try {
      // Create database directory if it doesn't exist
      const dbDir = path.dirname(this.dbPath);
      const fs = require('fs');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Create database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Error opening database:', err);
          throw err;
        }
        logger.info('Database connection established');
      });

      // Create tables
      await this.createTables();
      
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  // Create database tables
  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        permissions TEXT NOT NULL DEFAULT '["read"]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,

      // System metrics table
      `CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        cpu_usage REAL,
        memory_usage REAL,
        disk_usage REAL,
        network_latency REAL,
        uptime REAL
      )`,

      // Performance metrics table
      `CREATE TABLE IF NOT EXISTS performance_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        response_time REAL,
        throughput REAL,
        error_rate REAL,
        active_connections INTEGER
      )`,

      // Security events table
      `CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'info',
        ip_address TEXT,
        user_agent TEXT,
        description TEXT,
        data TEXT
      )`,

      // Threats table
      `CREATE TABLE IF NOT EXISTS threats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        threat_type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'active',
        description TEXT,
        data TEXT,
        acknowledged_at DATETIME,
        acknowledged_by INTEGER,
        FOREIGN KEY (acknowledged_by) REFERENCES users (id)
      )`,

      // Test results table
      `CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT UNIQUE NOT NULL,
        test_type TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time DATETIME,
        end_time DATETIME,
        duration REAL,
        results TEXT,
        config TEXT
      )`,

      // Alerts table
      `CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        category TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium',
        acknowledged BOOLEAN DEFAULT 0,
        acknowledged_at DATETIME,
        acknowledged_by INTEGER,
        data TEXT,
        FOREIGN KEY (acknowledged_by) REFERENCES users (id)
      )`,

      // Analytics data table
      `CREATE TABLE IF NOT EXISTS analytics_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metric_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        value REAL,
        metadata TEXT
      )`,

      // User activity table
      `CREATE TABLE IF NOT EXISTS user_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    logger.info('Database tables created successfully');
  }

  // Run SQL query
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Database query error:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Database query error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get multiple rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Database query error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Insert system metrics
  async insertSystemMetrics(metrics) {
    const sql = `
      INSERT INTO system_metrics (cpu_usage, memory_usage, disk_usage, network_latency, uptime)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return await this.run(sql, [
      metrics.cpuUsage,
      metrics.memoryUsage,
      metrics.diskUsage,
      metrics.networkLatency,
      metrics.uptime
    ]);
  }

  // Insert performance metrics
  async insertPerformanceMetrics(metrics) {
    const sql = `
      INSERT INTO performance_metrics (response_time, throughput, error_rate, active_connections)
      VALUES (?, ?, ?, ?)
    `;
    
    return await this.run(sql, [
      metrics.responseTime,
      metrics.throughput,
      metrics.errorRate,
      metrics.activeConnections
    ]);
  }

  // Insert security event
  async insertSecurityEvent(event) {
    const sql = `
      INSERT INTO security_events (event_type, severity, ip_address, user_agent, description, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    return await this.run(sql, [
      event.type,
      event.severity,
      event.ip,
      event.userAgent,
      event.description,
      JSON.stringify(event.data)
    ]);
  }

  // Insert threat
  async insertThreat(threat) {
    const sql = `
      INSERT INTO threats (threat_type, severity, status, description, data)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return await this.run(sql, [
      threat.type,
      threat.severity,
      threat.status,
      threat.description,
      JSON.stringify(threat.data)
    ]);
  }

  // Insert test result
  async insertTestResult(test) {
    const sql = `
      INSERT INTO test_results (test_id, test_type, status, start_time, end_time, duration, results, config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return await this.run(sql, [
      test.id,
      test.type,
      test.status,
      test.startTime,
      test.endTime,
      test.duration,
      JSON.stringify(test.results),
      JSON.stringify(test.config)
    ]);
  }

  // Insert alert
  async insertAlert(alert) {
    const sql = `
      INSERT INTO alerts (category, alert_type, message, severity, data)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return await this.run(sql, [
      alert.category,
      alert.type,
      alert.message,
      alert.severity,
      JSON.stringify(alert.data)
    ]);
  }

  // Insert analytics data
  async insertAnalyticsData(metricType, metricName, value, metadata = {}) {
    const sql = `
      INSERT INTO analytics_data (metric_type, metric_name, value, metadata)
      VALUES (?, ?, ?, ?)
    `;
    
    return await this.run(sql, [
      metricType,
      metricName,
      value,
      JSON.stringify(metadata)
    ]);
  }

  // Insert user activity
  async insertUserActivity(userId, action, details = {}, ipAddress = null, userAgent = null) {
    const sql = `
      INSERT INTO user_activity (user_id, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return await this.run(sql, [
      userId,
      action,
      JSON.stringify(details),
      ipAddress,
      userAgent
    ]);
  }

  // Get system metrics
  async getSystemMetrics(limit = 100) {
    const sql = `
      SELECT * FROM system_metrics 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    
    return await this.all(sql, [limit]);
  }

  // Get performance metrics
  async getPerformanceMetrics(limit = 100) {
    const sql = `
      SELECT * FROM performance_metrics 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    
    return await this.all(sql, [limit]);
  }

  // Get security events
  async getSecurityEvents(limit = 100, severity = null) {
    let sql = `
      SELECT * FROM security_events 
      ORDER BY timestamp DESC 
    `;
    
    const params = [];
    if (severity) {
      sql += ' WHERE severity = ?';
      params.push(severity);
    }
    
    sql += ' LIMIT ?';
    params.push(limit);
    
    return await this.all(sql, params);
  }

  // Get threats
  async getThreats(status = 'active') {
    const sql = `
      SELECT * FROM threats 
      WHERE status = ?
      ORDER BY timestamp DESC
    `;
    
    return await this.all(sql, [status]);
  }

  // Get test results
  async getTestResults(limit = 50) {
    const sql = `
      SELECT * FROM test_results 
      ORDER BY start_time DESC 
      LIMIT ?
    `;
    
    return await this.all(sql, [limit]);
  }

  // Get alerts
  async getAlerts(acknowledged = null, limit = 100) {
    let sql = `
      SELECT * FROM alerts 
      ORDER BY timestamp DESC 
    `;
    
    const params = [];
    if (acknowledged !== null) {
      sql += ' WHERE acknowledged = ?';
      params.push(acknowledged ? 1 : 0);
    }
    
    sql += ' LIMIT ?';
    params.push(limit);
    
    return await this.all(sql, params);
  }

  // Get analytics data
  async getAnalyticsData(metricType = null, limit = 100) {
    let sql = `
      SELECT * FROM analytics_data 
      ORDER BY timestamp DESC 
    `;
    
    const params = [];
    if (metricType) {
      sql += ' WHERE metric_type = ?';
      params.push(metricType);
    }
    
    sql += ' LIMIT ?';
    params.push(limit);
    
    return await this.all(sql, params);
  }

  // Get user activity
  async getUserActivity(userId = null, limit = 100) {
    let sql = `
      SELECT * FROM user_activity 
      ORDER BY timestamp DESC 
    `;
    
    const params = [];
    if (userId) {
      sql += ' WHERE user_id = ?';
      params.push(userId);
    }
    
    sql += ' LIMIT ?';
    params.push(limit);
    
    return await this.all(sql, params);
  }

  // Update threat status
  async updateThreatStatus(threatId, status, acknowledgedBy = null) {
    const sql = `
      UPDATE threats 
      SET status = ?, acknowledged_at = ?, acknowledged_by = ?
      WHERE id = ?
    `;
    
    const acknowledgedAt = status === 'acknowledged' ? new Date().toISOString() : null;
    
    return await this.run(sql, [status, acknowledgedAt, acknowledgedBy, threatId]);
  }

  // Update alert status
  async updateAlertStatus(alertId, acknowledged, acknowledgedBy = null) {
    const sql = `
      UPDATE alerts 
      SET acknowledged = ?, acknowledged_at = ?, acknowledged_by = ?
      WHERE id = ?
    `;
    
    const acknowledgedAt = acknowledged ? new Date().toISOString() : null;
    
    return await this.run(sql, [acknowledged ? 1 : 0, acknowledgedAt, acknowledgedBy, alertId]);
  }

  // Clean old data
  async cleanOldData(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const tables = [
      'system_metrics',
      'performance_metrics', 
      'security_events',
      'analytics_data',
      'user_activity'
    ];
    
    for (const table of tables) {
      const sql = `DELETE FROM ${table} WHERE timestamp < ?`;
      await this.run(sql, [cutoffDate.toISOString()]);
    }
    
    logger.info(`Cleaned data older than ${days} days`);
  }

  // Get database statistics
  async getDatabaseStats() {
    const tables = [
      'users',
      'system_metrics',
      'performance_metrics',
      'security_events',
      'threats',
      'test_results',
      'alerts',
      'analytics_data',
      'user_activity'
    ];
    
    const stats = {};
    
    for (const table of tables) {
      const result = await this.get(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = result.count;
    }
    
    return stats;
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
        } else {
          logger.info('Database connection closed');
        }
      });
    }
  }
}

// Initialize database service
async function initializeDatabase() {
  const dbService = new DatabaseService();
  await dbService.initialize();
  
  // Insert default admin user if not exists
  const adminUser = await dbService.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!adminUser) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password', 10);
    
    await dbService.run(`
      INSERT INTO users (username, email, password, role, permissions)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'admin',
      'admin@iqra2.com',
      hashedPassword,
      'admin',
      JSON.stringify(['read', 'write', 'delete', 'admin'])
    ]);
    
    logger.info('Default admin user created');
  }
  
  return dbService;
}

module.exports = { initializeDatabase, DatabaseService }; 