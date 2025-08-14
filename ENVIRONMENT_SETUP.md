# Environment Setup Guide

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cp env.example .env
   ```

2. **Fill in your actual values in `.env`:**
   - Get your Supabase credentials from your Supabase project dashboard
   - Set up your API endpoints
   - Configure feature flags as needed

3. **Never commit `.env` to version control:**
   - The `.env` file is already in `.gitignore`
   - Only `env.example` should be committed

## Required Environment Variables

### Supabase Configuration
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY`: Your Supabase service key (for admin functions)

### API Configuration
- `API_BASE_URL`: Your main API endpoint
- `ADMIN_DASHBOARD_URL`: Your admin dashboard URL
- `TELEMETRY_URL`: Your telemetry endpoint

### App Configuration
- `NODE_ENV`: Environment (development, staging, production)
- `DEBUG_MODE`: Enable debug mode (true/false)
- `ENABLE_LOGGING`: Enable logging (true/false)

### Feature Flags
- `ENABLE_TELEMETRY`: Enable telemetry collection
- `ENABLE_ADMIN_DASHBOARD`: Enable admin dashboard integration
- `ENABLE_LEADERBOARD`: Enable leaderboard features
- `ENABLE_RECORDING`: Enable audio recording features

## Environment-Specific Configurations

### Development
```bash
NODE_ENV=development
DEBUG_MODE=true
ENABLE_LOGGING=true
API_BASE_URL=http://localhost:5001
```

### Production
```bash
NODE_ENV=production
DEBUG_MODE=false
ENABLE_LOGGING=false
API_BASE_URL=https://api.iqra2.app
```

## Security Notes

1. **Never hardcode credentials** in your source code
2. **Use different keys** for different environments
3. **Rotate keys regularly** for production
4. **Limit permissions** of keys to minimum required access
5. **Monitor key usage** for suspicious activity

## Troubleshooting

### Configuration Validation Errors
If you see configuration validation errors:
1. Check that all required environment variables are set
2. Ensure URLs are correct for your environment
3. Verify Supabase credentials are valid

### Build Errors
If you get build errors related to environment variables:
1. Make sure `react-native-dotenv` is installed
2. Check that `.env` file exists and is properly formatted
3. Restart the Metro bundler after changing environment variables

## Example .env File

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Configuration
API_BASE_URL=https://api.iqra2.app
ADMIN_DASHBOARD_URL=https://admin.iqra2.app
TELEMETRY_URL=https://api.iqra2.app/telemetry

# App Configuration
NODE_ENV=development
DEBUG_MODE=false
ENABLE_LOGGING=false

# Feature Flags
ENABLE_TELEMETRY=false
ENABLE_ADMIN_DASHBOARD=false
ENABLE_LEADERBOARD=true
ENABLE_RECORDING=true
```
