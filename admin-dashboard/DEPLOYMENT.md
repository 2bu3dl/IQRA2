# IQRA2 Admin Dashboard - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### 1. Local Development Setup

```bash
# Clone the repository (if not already done)
cd admin-dashboard

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit environment variables
nano .env

# Start the development server
npm run dev
```

The dashboard will be available at `http://localhost:5000`

### 2. Production Deployment

#### Option A: Traditional VPS/Server

```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repository
git clone <your-repo-url>
cd admin-dashboard

# Install dependencies
npm install --production

# Create environment file
cp env.example .env

# Edit production environment variables
nano .env

# Start with PM2 for process management
npm install -g pm2
pm2 start server.js --name "iqra2-admin-dashboard"
pm2 save
pm2 startup
```

#### Option B: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  admin-dashboard:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
```

Deploy with Docker:

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Option C: Cloud Deployment

##### Heroku
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create app
heroku create iqra2-admin-dashboard

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-key

# Deploy
git push heroku main
```

##### DigitalOcean App Platform
1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Deploy with one click

##### AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_PATH=./data/admin_dashboard.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SLOW_DOWN_DELAY_AFTER=50
SLOW_DOWN_DELAY_MS=500

# Frontend URL (for CORS)
FRONTEND_URL=https://your-domain.com

# API Base URL (for testing)
API_BASE_URL=https://your-api-domain.com

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Monitoring Configuration
MONITORING_INTERVAL=5000
PERFORMANCE_MONITORING_INTERVAL=10000
SECURITY_MONITORING_INTERVAL=30000

# Testing Configuration
LOAD_TEST_DURATION=300
STRESS_TEST_DURATION=600
SPIKE_TEST_DURATION=60

# Analytics Configuration
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_CLEANUP_INTERVAL=86400000

# Security Configuration
MAX_FAILED_LOGINS=5
MAX_REQUESTS_PER_MINUTE=100
SUSPICIOUS_ACTIVITY_THRESHOLD=50

# Email Configuration (for alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis Configuration (optional, for caching)
REDIS_URL=redis://localhost:6379

# External Services
EXTERNAL_API_TIMEOUT=5000
HEALTH_CHECK_INTERVAL=30000
```

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique JWT secrets
- Rotate secrets regularly

### 2. Network Security
```bash
# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Use HTTPS in production
# Install SSL certificate with Let's Encrypt
sudo apt install certbot
sudo certbot --nginx -d your-domain.com
```

### 3. Process Management
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name "iqra2-admin-dashboard"
pm2 save
pm2 startup

# Monitor processes
pm2 monit
pm2 logs iqra2-admin-dashboard
```

### 4. Database Security
```bash
# Backup database regularly
cp ./data/admin_dashboard.db ./backups/admin_dashboard_$(date +%Y%m%d_%H%M%S).db

# Set up automated backups
crontab -e
# Add: 0 2 * * * cp /path/to/admin-dashboard/data/admin_dashboard.db /path/to/backups/admin_dashboard_$(date +\%Y\%m\%d_\%H\%M\%S).db
```

## 📊 Monitoring & Maintenance

### 1. Health Checks
```bash
# Check if service is running
curl http://localhost:5000/health

# Check logs
tail -f logs/app.log

# Monitor system resources
htop
df -h
free -h
```

### 2. Performance Monitoring
```bash
# Monitor Node.js performance
node --inspect server.js

# Use New Relic or DataDog for APM
npm install newrelic
```

### 3. Log Management
```bash
# Rotate logs
sudo logrotate /etc/logrotate.d/iqra2-admin-dashboard

# Monitor log size
du -sh logs/
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Admin Dashboard

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Deploy to server
      run: |
        # Add your deployment commands here
        echo "Deploying to production..."
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

2. **Permission denied**
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/admin-dashboard
chmod +x server.js
```

3. **Database locked**
```bash
# Check if another process is using the database
fuser ./data/admin_dashboard.db
# Kill the process if needed
kill -9 <PID>
```

4. **Memory issues**
```bash
# Monitor memory usage
node --max-old-space-size=4096 server.js
```

### Log Analysis
```bash
# Search for errors
grep -i error logs/app.log

# Search for specific patterns
grep "load test" logs/app.log

# Monitor real-time logs
tail -f logs/app.log | grep -i error
```

## 📈 Scaling Considerations

### 1. Load Balancing
```nginx
# Nginx configuration
upstream admin_dashboard {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://admin_dashboard;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Database Scaling
- Consider migrating to PostgreSQL or MySQL for larger datasets
- Implement database clustering for high availability
- Use Redis for caching frequently accessed data

### 3. Monitoring Scaling
- Implement distributed tracing with Jaeger or Zipkin
- Use Prometheus and Grafana for metrics visualization
- Set up alerting with PagerDuty or OpsGenie

## 🎯 Integration with IQRA2 App

### 1. API Integration
```javascript
// In your IQRA2 React Native app
const API_BASE_URL = 'https://your-admin-dashboard.com/api';

// Send metrics to admin dashboard
const sendMetrics = async (metrics) => {
  try {
    await fetch(`${API_BASE_URL}/monitoring/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    });
  } catch (error) {
    console.error('Failed to send metrics:', error);
  }
};
```

### 2. Real-time Monitoring
```javascript
// Connect to admin dashboard WebSocket
const socket = io('https://your-admin-dashboard.com');

socket.on('connect', () => {
  console.log('Connected to admin dashboard');
});

// Send real-time events
socket.emit('app-event', {
  type: 'user_action',
  data: { action: 'memorize_ayah', surah: 1, ayah: 1 }
});
```

## 📞 Support

For deployment issues or questions:
1. Check the logs: `tail -f logs/app.log`
2. Verify environment variables: `cat .env`
3. Test connectivity: `curl http://localhost:5000/health`
4. Check system resources: `htop`, `df -h`, `free -h`

## 🔄 Updates & Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Review logs and clean up old data
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Review and update environment variables
4. **Annually**: Full security audit and performance review

### Update Process
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart the service
pm2 restart iqra2-admin-dashboard

# Verify deployment
curl http://localhost:5000/health
``` 