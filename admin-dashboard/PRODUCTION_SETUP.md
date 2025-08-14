# IQRA2 Admin Dashboard Production Setup Guide

## 🚀 **Production Environment Configuration**

### **Critical Changes Required for Production:**

#### **1. Environment Variables (.env.production)**
```bash
# Server Configuration
PORT=80
HTTPS_PORT=443
NODE_ENV=production
SSL_ENABLED=true
SSL_CERT_PATH=/path/to/ssl/certificate.crt
SSL_KEY_PATH=/path/to/ssl/private.key

# Security Configuration (CHANGE THESE!)
JWT_SECRET=your-production-jwt-secret-here
SESSION_SECRET=your-production-session-secret-here
REFRESH_TOKEN_SECRET=your-production-refresh-token-secret-here
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# CORS Configuration (PRODUCTION DOMAINS ONLY)
ALLOWED_ORIGINS=https://admin.iqra2.app,https://iqra2.app

# Rate Limiting (STRICTER FOR PRODUCTION)
RATE_LIMIT_MAX_REQUESTS=50
AUTH_RATE_LIMIT_MAX_REQUESTS=5
REFRESH_RATE_LIMIT_MAX_REQUESTS=3

# Security Settings (STRICTER FOR PRODUCTION)
MAX_LOGIN_ATTEMPTS=3
LOCKOUT_DURATION_MS=1800000
SESSION_TIMEOUT_MS=900000

# Production Settings
DEBUG_MODE=false
LOG_LEVEL=warn
ENABLE_TESTING=false
```

#### **2. SSL/TLS Configuration**
```bash
# SSL Configuration
SSL_ENABLED=true
SSL_CERT_PATH=/path/to/ssl/certificate.crt
SSL_KEY_PATH=/path/to/ssl/private.key
```

#### **3. Database Configuration**
```bash
# Use PostgreSQL or MySQL for production
DB_TYPE=postgresql
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=iqra2_admin
DB_USER=admin_user
DB_PASSWORD=secure-db-password
```

## 🔒 **Security Checklist for Production**

### **✅ Pre-Deployment**
- [ ] **Change Default Passwords**: Admin password changed from `password`
- [ ] **Generate New Secrets**: JWT, Session, and Refresh Token secrets
- [ ] **Update CORS Origins**: Only production domains allowed
- [ ] **Configure SSL/TLS**: HTTPS certificates installed
- [ ] **Database Security**: Use production database with proper credentials
- [ ] **Rate Limiting**: Stricter limits for production
- [ ] **Logging**: Configure production logging levels

### **✅ Post-Deployment**
- [ ] **Test Authentication**: Verify login/logout works
- [ ] **Test Refresh Tokens**: Verify token refresh flow
- [ ] **Monitor Logs**: Check for security events
- [ ] **Backup Setup**: Configure automated backups
- [ ] **Monitoring**: Set up health checks and alerts
- [ ] **Firewall**: Configure firewall rules

## 🛡️ **Production Security Features**

### **Enhanced Rate Limiting**
- **General Requests**: 50 requests per 15 minutes
- **Authentication**: 5 attempts per 5 minutes
- **Token Refresh**: 3 attempts per minute
- **Account Lockout**: 3 failed attempts = 30-minute lockout

### **Stricter Session Management**
- **Session Timeout**: 15 minutes of inactivity
- **Token Expiration**: 24 hours for access tokens
- **Refresh Token Expiration**: 7 days
- **Maximum Active Tokens**: 5 per user

### **Production Logging**
- **Log Level**: Warning and above only
- **Security Events**: All authentication events logged
- **Performance Monitoring**: Request timing and errors
- **Audit Trail**: Complete user action logging

## 📊 **Monitoring and Alerts**

### **Security Monitoring**
```bash
# Monitor failed login attempts
grep "Failed login attempt" logs/combined.log

# Monitor rate limit violations
grep "Rate limit exceeded" logs/combined.log

# Monitor token refresh activity
grep "Token refreshed" logs/combined.log

# Monitor logout events
grep "User logged out" logs/combined.log
```

### **Performance Monitoring**
```bash
# Monitor response times
grep "Request completed" logs/combined.log | grep "duration"

# Monitor memory usage
grep "HIGH_MEMORY_USAGE" logs/combined.log

# Monitor database connections
grep "Database connection" logs/combined.log
```

## 🔧 **Deployment Commands**

### **1. Production Setup**
```bash
# Copy production environment
cp .env.production .env

# Install production dependencies
npm ci --only=production

# Start production server
NODE_ENV=production npm start
```

### **2. SSL/TLS Setup**
```bash
# Generate SSL certificate (Let's Encrypt)
sudo certbot certonly --standalone -d admin.iqra2.app

# Update SSL paths in .env
SSL_CERT_PATH=/etc/letsencrypt/live/admin.iqra2.app/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/admin.iqra2.app/privkey.pem
```

### **3. Process Management**
```bash
# Using PM2 for production
npm install -g pm2
pm2 start server.js --name "iqra2-admin"
pm2 save
pm2 startup
```

## 📋 **Maintenance Tasks**

### **Daily**
- [ ] Review security logs
- [ ] Check for failed login attempts
- [ ] Monitor system performance
- [ ] Verify backup completion

### **Weekly**
- [ ] Review rate limit violations
- [ ] Check token usage patterns
- [ ] Update security patches
- [ ] Review user permissions

### **Monthly**
- [ ] Rotate admin passwords
- [ ] Review and update secrets
- [ ] Conduct security audit
- [ ] Update SSL certificates

## 🆘 **Emergency Procedures**

### **Security Incident Response**
1. **Immediate Actions**:
   - Lock affected accounts
   - Review recent logs
   - Check for data breaches
   - Notify security team

2. **Investigation**:
   - Analyze attack vectors
   - Review affected systems
   - Document incident details
   - Implement immediate fixes

3. **Recovery**:
   - Reset compromised credentials
   - Restore from secure backups
   - Update security measures
   - Monitor for recurrence

### **Contact Information**
- **Security Team**: security@iqra2.app
- **System Admin**: admin@iqra2.app
- **Emergency**: +1-XXX-XXX-XXXX

---

**Last Updated**: December 2024  
**Security Level**: Production Ready  
**Next Review**: Monthly security assessment
