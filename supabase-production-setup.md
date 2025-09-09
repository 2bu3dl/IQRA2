# Supabase Production Environment Setup Guide

## Current Status
Your app is currently using a Supabase project with these credentials:
- **URL**: `https://baimixtdewflnnyudhwz.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Environment**: Production (configured in `src/utils/config.js`)

## ✅ Production Checklist

### 1. Supabase Dashboard Configuration

#### Database Setup
- [ ] **Row Level Security (RLS)**: Enable RLS on all tables
- [ ] **Policies**: Create proper access policies for user data
- [ ] **Backups**: Set up automated backups
- [ ] **Monitoring**: Enable database monitoring

#### Authentication Setup
- [ ] **Email Templates**: Customize email templates for your app
- [ ] **Redirect URLs**: Add `iqra2://auth/callback` to allowed redirects
- [ ] **OAuth Providers**: Configure if using social login
- [ ] **Session Management**: Set appropriate session timeouts

#### Storage Setup
- [ ] **Bucket Policies**: Configure storage bucket permissions
- [ ] **File Size Limits**: Set appropriate limits for audio files
- [ ] **CORS Settings**: Configure for your app domain

### 2. Environment Variables (Recommended)

Create a `.env` file for production:

```bash
# Supabase Configuration
SUPABASE_URL=https://baimixtdewflnnyudhwz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=your_service_key_here

# App Configuration
NODE_ENV=production
```

### 3. Database Schema Verification

Ensure your Supabase database has these tables:

```sql
-- User progress table
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_hasanat INTEGER DEFAULT 0,
  today_hasanat INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  memorized_ayahs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User recordings table
CREATE TABLE user_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_name TEXT NOT NULL,
  ayah_number INTEGER,
  recording_url TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recordings ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Similar policies for recordings table
CREATE POLICY "Users can view own recordings" ON user_recordings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings" ON user_recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. Performance Optimization

#### Database Indexes
```sql
-- Add indexes for better performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_last_activity ON user_progress(last_activity_date);
CREATE INDEX idx_user_recordings_user_id ON user_recordings(user_id);
CREATE INDEX idx_user_recordings_surah ON user_recordings(surah_name);
```

#### Connection Pooling
- [ ] Configure connection pooling in Supabase dashboard
- [ ] Set appropriate pool size for your expected user load

### 5. Security Hardening

#### API Security
- [ ] **Rate Limiting**: Enable rate limiting on API endpoints
- [ ] **CORS**: Configure CORS for your app domain only
- [ ] **API Keys**: Rotate API keys regularly

#### Data Security
- [ ] **Encryption**: Ensure data is encrypted at rest
- [ ] **Backups**: Test backup and restore procedures
- [ ] **Audit Logs**: Enable audit logging for sensitive operations

### 6. Monitoring & Analytics

#### Supabase Dashboard
- [ ] **Database Performance**: Monitor query performance
- [ ] **Storage Usage**: Track storage growth
- [ ] **API Usage**: Monitor API call patterns
- [ ] **Error Logs**: Set up error alerting

#### Custom Analytics
- [ ] **User Engagement**: Track user activity patterns
- [ ] **Feature Usage**: Monitor which features are most used
- [ ] **Performance Metrics**: Track app performance

### 7. Testing Production Environment

#### Before TestFlight Release
- [ ] **Load Testing**: Test with multiple concurrent users
- [ ] **Data Migration**: Test data migration from development
- [ ] **Backup/Restore**: Test backup and restore procedures
- [ ] **Error Handling**: Test error scenarios

#### TestFlight Testing
- [ ] **User Registration**: Test user signup flow
- [ ] **Data Sync**: Test cloud sync functionality
- [ ] **Audio Upload**: Test audio recording upload
- [ ] **Offline Mode**: Test offline functionality

## 🚨 Critical Actions Required

### 1. Get Service Key
1. Go to Supabase Dashboard > Settings > API
2. Copy the `service_role` key
3. Add it to your config file (for admin operations)

### 2. Test Database Connection
```javascript
// Test in your app
import { supabase } from './src/utils/supabase';

// Test connection
const { data, error } = await supabase
  .from('user_progress')
  .select('*')
  .limit(1);

if (error) {
  console.error('Database connection failed:', error);
}
```

### 3. Verify RLS Policies
Test that users can only access their own data:
```javascript
// This should only return current user's data
const { data, error } = await supabase
  .from('user_progress')
  .select('*');
```

## 📊 Current App Size Analysis

Your app currently contains:
- **174 MP3 files** (37+ MB total)
- **Multiple reciters** (Al-Fatiha, Al-Mulk)
- **High-quality audio** (affecting app size)

## 🎵 Audio File Optimization Strategies

### Option 1: Cloud Storage (RECOMMENDED)
**Pros:**
- Reduces app size by ~37MB
- Faster app downloads
- Better user experience
- Scalable solution

**Implementation:**
```javascript
// Store audio files in Supabase Storage
const { data, error } = await supabase.storage
  .from('audio-files')
  .download('surah/001/001001.mp3');
```

### Option 2: Progressive Download
**Pros:**
- Users download only what they need
- Reduces initial app size
- Better for users with limited storage

**Implementation:**
```javascript
// Download audio files on-demand
const downloadAudio = async (surah, ayah) => {
  const fileName = `${surah}/${ayah}.mp3`;
  const { data, error } = await supabase.storage
    .from('audio-files')
    .download(fileName);
  
  if (data) {
    // Save to local storage
    await saveToLocalStorage(fileName, data);
  }
};
```

### Option 3: Audio Compression
**Pros:**
- Reduces file sizes by 50-70%
- Keeps files local
- Faster loading

**Implementation:**
```bash
# Compress MP3 files
ffmpeg -i input.mp3 -b:a 64k output.mp3
```

### Option 4: Hybrid Approach (BEST)
**Recommended Strategy:**
1. **Keep essential audio local** (Al-Fatiha only)
2. **Store additional audio in cloud** (other surahs)
3. **Implement progressive download**
4. **Add audio compression**

## 🎯 Recommended Implementation

### Step 1: Immediate (For TestFlight)
1. Keep current setup for TestFlight
2. Add audio compression to reduce size
3. Document the optimization plan

### Step 2: Post-TestFlight
1. Implement cloud storage for audio files
2. Add progressive download functionality
3. Optimize user experience

### Step 3: Long-term
1. Implement audio streaming
2. Add offline caching
3. Optimize based on user feedback

## 📱 App Store Considerations

### Current App Size Impact
- **Base app**: ~30-50MB
- **Audio files**: +37MB
- **Total**: ~67-87MB

### App Store Limits
- **Cellular download limit**: 200MB
- **WiFi download limit**: No limit
- **Your app**: Well within limits

### User Experience
- **Download time**: ~2-3 minutes on 4G
- **Storage usage**: ~87MB on device
- **Acceptable for Quran app**: Yes

## 🔧 Implementation Priority

### High Priority (Before TestFlight)
1. ✅ Fix bundle identifier
2. ✅ Update version numbers
3. ✅ Configure production environment
4. ⏳ Test Supabase production setup
5. ⏳ Verify database schema

### Medium Priority (Post-TestFlight)
1. Implement audio cloud storage
2. Add progressive download
3. Optimize app size
4. Add analytics

### Low Priority (Future releases)
1. Audio streaming
2. Advanced caching
3. Performance optimization

---

**Next Steps:**
1. Complete Supabase production setup
2. Test database connectivity
3. Run TestFlight build
4. Collect user feedback
5. Plan audio optimization for next release
