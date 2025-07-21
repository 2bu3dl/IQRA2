# IQRA2 Admin Dashboard

A comprehensive admin dashboard for monitoring, testing, and securing the IQRA2 Quran memorization app. This dashboard provides real-time monitoring, load testing, security analytics, and performance insights.

## 🚀 Features

### 📊 **Real-time Monitoring**
- System metrics (CPU, Memory, Disk, Network)
- Performance metrics (Response time, Throughput, Error rate)
- Health checks for critical components
- Real-time alerts and notifications
- Historical data visualization

### 🧪 **Testing & Load Testing**
- Load testing with configurable parameters
- Stress testing for high-load scenarios
- Spike testing for sudden traffic bursts
- Failure simulation (timeouts, memory leaks, database failures)
- Performance testing for specific components
- Component-specific testing (audio playback, Quran loading, etc.)

### 🔒 **Security Dashboard**
- Real-time security monitoring
- Threat detection and analysis
- Vulnerability scanning
- Failed login tracking
- Suspicious IP detection
- Rate limiting and blocking
- Security event logging
- Security recommendations

### 📈 **Analytics & Insights**
- User activity analytics
- Performance analytics
- Content usage analytics
- Predictive analytics
- Comparative analytics
- Export capabilities (JSON/CSV)

### 👥 **User Management**
- Role-based access control
- JWT authentication
- User activity tracking
- Permission management

## 🛠️ Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- SQLite3 (included)

### Setup

1. **Clone and navigate to the admin dashboard directory:**
```bash
cd admin-dashboard
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp env.example .env
```

4. **Configure environment variables:**
Edit `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

5. **Start the server:**
```bash
npm start
```

The dashboard will be available at `http://localhost:5000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `JWT_SECRET` | JWT signing secret | your-secret-key |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `MONITORING_INTERVAL` | System monitoring interval (ms) | 5000 |

### Database

The dashboard uses SQLite for data persistence. The database file is automatically created at `./data/admin_dashboard.db`.

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Monitoring
- `GET /api/monitoring/metrics` - Get all metrics
- `GET /api/monitoring/system` - Get system metrics
- `GET /api/monitoring/performance` - Get performance metrics
- `GET /api/monitoring/alerts` - Get alerts
- `GET /api/monitoring/health-checks` - Get health checks
- `POST /api/monitoring/alerts/:id/acknowledge` - Acknowledge alert

### Testing
- `POST /api/testing/load-test` - Start load test
- `POST /api/testing/failure-simulation` - Start failure simulation
- `POST /api/testing/performance-test` - Start performance test
- `GET /api/testing/results` - Get test results
- `GET /api/testing/active` - Get active tests
- `POST /api/testing/stop/:id` - Stop test

### Security
- `GET /api/security/metrics` - Get security metrics
- `GET /api/security/events` - Get security events
- `GET /api/security/threats` - Get threats
- `GET /api/security/vulnerabilities` - Get vulnerabilities
- `POST /api/security/unblock-ip` - Unblock IP
- `POST /api/security/threats/:id/acknowledge` - Acknowledge threat

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/user-insights` - Get user insights
- `GET /api/analytics/performance` - Get performance analytics
- `GET /api/analytics/content` - Get content analytics
- `GET /api/analytics/trends` - Get usage trends
- `GET /api/analytics/predictions` - Get predictive analytics

## 🧪 Testing Features

### Load Testing
```bash
# Start a load test
curl -X POST http://localhost:5000/api/testing/load-test \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "loadTest",
    "customConfig": {
      "concurrentUsers": 100,
      "duration": 300,
      "targetRPS": 50
    }
  }'
```

### Failure Simulation
```bash
# Simulate database failure
curl -X POST http://localhost:5000/api/testing/failure-simulation \
  -H "Content-Type: application/json" \
  -d '{
    "failureType": "database_failure",
    "duration": 60
  }'
```

### Performance Testing
```bash
# Test audio playback component
curl -X POST http://localhost:5000/api/testing/performance-test \
  -H "Content-Type: application/json" \
  -d '{
    "component": "audio_playback",
    "testConfig": {
      "iterations": 100,
      "concurrency": 10
    }
  }'
```

## 🔒 Security Features

### Threat Detection
The dashboard automatically detects:
- Brute force attacks
- Suspicious IP activity
- Rate limit violations
- SQL injection attempts
- XSS attempts
- Unusual traffic patterns

### Security Monitoring
- Real-time security event logging
- IP blocking and unblocking
- Threat acknowledgment
- Security recommendations
- Vulnerability scanning

## 📊 Monitoring Features

### System Monitoring
- CPU usage monitoring
- Memory usage tracking
- Disk space monitoring
- Network latency tracking
- Uptime monitoring

### Performance Monitoring
- Response time tracking
- Throughput monitoring
- Error rate calculation
- Active connection tracking
- Component-specific monitoring

### Health Checks
- Database connectivity
- External API availability
- File system access
- Custom health checks

## 📈 Analytics Features

### User Analytics
- User demographics
- Usage patterns
- Device types
- Geographic distribution
- Retention rates

### Performance Analytics
- Response time trends
- Error rate analysis
- Throughput patterns
- Component performance
- Predictive analytics

### Content Analytics
- Most read Surahs
- Audio playback statistics
- Translation usage
- Feature adoption rates

## 🚀 Usage Examples

### 1. Monitor System Health
```bash
# Get system metrics
curl http://localhost:5000/api/monitoring/system

# Get health checks
curl http://localhost:5000/api/monitoring/health-checks
```

### 2. Run Load Tests
```bash
# Start stress test
curl -X POST http://localhost:5000/api/testing/load-test \
  -d '{"testType": "stressTest"}'

# Check test results
curl http://localhost:5000/api/testing/results
```

### 3. Security Monitoring
```bash
# Get security metrics
curl http://localhost:5000/api/security/metrics

# Get active threats
curl http://localhost:5000/api/security/threats
```

### 4. Analytics
```bash
# Get user insights
curl http://localhost:5000/api/analytics/user-insights

# Get performance analytics
curl http://localhost:5000/api/analytics/performance
```

## 🔧 Development

### Project Structure
```
admin-dashboard/
├── server.js              # Main server file
├── package.json           # Dependencies
├── env.example           # Environment template
├── routes/               # API routes
│   ├── auth.js          # Authentication routes
│   ├── monitoring.js    # Monitoring routes
│   ├── testing.js       # Testing routes
│   ├── security.js      # Security routes
│   └── analytics.js     # Analytics routes
├── services/            # Business logic
│   ├── logger.js        # Logging service
│   ├── monitoring.js    # Monitoring service
│   ├── testing.js       # Testing service
│   ├── security.js      # Security service
│   └── database.js      # Database service
├── data/                # Database files
└── logs/                # Log files
```

### Adding New Features

1. **Create a new service** in `services/`
2. **Add routes** in `routes/`
3. **Update database schema** if needed
4. **Add tests** for new functionality

### Testing
```bash
# Run tests
npm test

# Run load tests
npm run load-test

# Security scan
npm run security-scan
```

## 🔐 Security Considerations

### Production Deployment
1. Change default JWT secret
2. Use HTTPS in production
3. Configure proper CORS settings
4. Set up proper logging
5. Use environment variables for secrets
6. Implement proper backup strategies

### Access Control
- Default admin user: `admin` / `password`
- Role-based permissions
- JWT token authentication
- Rate limiting
- IP blocking capabilities

## 📝 Logging

The dashboard uses Winston for structured logging:
- Console logging in development
- File logging in production
- Error tracking and alerting
- Performance monitoring logs

## 🔄 Integration with IQRA2 App

### Mobile App Integration
Add telemetry to your React Native app:

```javascript
// In your React Native app
const sendTelemetry = async (event, data) => {
  try {
    await fetch('http://your-dashboard-url/api/analytics/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, timestamp: Date.now() })
    });
  } catch (error) {
    console.error('Telemetry error:', error);
  }
};
```

### Health Checks
Add health check endpoints to your app:

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
```

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in .env file
   PORT=5001
   ```

2. **Database errors**
   ```bash
   # Delete and recreate database
   rm data/admin_dashboard.db
   npm start
   ```

3. **Permission errors**
   ```bash
   # Check file permissions
   chmod 755 data/
   chmod 644 data/admin_dashboard.db
   ```

### Logs
Check logs in `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## 📞 Support

For issues and questions:
1. Check the logs in `logs/` directory
2. Review the API documentation
3. Check the troubleshooting section
4. Create an issue with detailed information

## 📄 License

This project is licensed under the MIT License.

---

**Built for IQRA2 - Making Quran memorization sustainable and efficient** 🕌 