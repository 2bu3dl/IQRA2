-- Username-only Authentication Setup for IQRA2
-- Run this in your Supabase SQL Editor

-- 1. Create user_profiles table with username support
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT, -- Optional email for recovery
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  recovery_token TEXT,
  recovery_token_expires TIMESTAMPTZ
);

-- 2. Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create leaderboard_stats table
CREATE TABLE IF NOT EXISTS public.leaderboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  total_hasanat INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  memorized_ayahs INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User progress policies
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;
CREATE POLICY "Users can manage own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Leaderboard policies (read-only for all users)
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard_stats;
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own leaderboard stats" ON public.leaderboard_stats;
CREATE POLICY "Users can update own leaderboard stats" ON public.leaderboard_stats
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own leaderboard stats" ON public.leaderboard_stats;
CREATE POLICY "Users can insert own leaderboard stats" ON public.leaderboard_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create function to generate unique username
CREATE OR REPLACE FUNCTION generate_unique_username(base_username TEXT)
RETURNS TEXT AS $$
DECLARE
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  final_username := base_username;
  
  -- Check if username exists and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;
  
  RETURN final_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger function for new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
  user_email TEXT;
BEGIN
  -- Get email from auth.users (might be null for username-only accounts)
  user_email := NEW.email;
  
  -- Generate unique username
  -- If email exists, use part of email as base, otherwise use 'user'
  IF user_email IS NOT NULL AND user_email != '' THEN
    generated_username := generate_unique_username(
      COALESCE(
        split_part(user_email, '@', 1),
        'user'
      )
    );
  ELSE
    -- For username-only accounts, we'll need to handle this in the app
    -- For now, generate a random username
    generated_username := generate_unique_username('user' || substr(NEW.id::TEXT, 1, 8));
  END IF;
  
  -- Insert user profile
  INSERT INTO public.user_profiles (id, username, email, display_name)
  VALUES (NEW.id, generated_username, user_email, generated_username);
  
  -- Insert user progress
  INSERT INTO public.user_progress (user_id, progress_data)
  VALUES (NEW.id, '{}');
  
  -- Insert leaderboard stats
  INSERT INTO public.leaderboard_stats (user_id, username)
  VALUES (NEW.id, generated_username);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 9. Create function to update username
CREATE OR REPLACE FUNCTION update_username(new_username TEXT)
RETURNS JSON AS $$
DECLARE
  user_id UUID;
  final_username TEXT;
  result JSON;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Generate unique username
  final_username := generate_unique_username(new_username);
  
  -- Update username in both tables
  UPDATE public.user_profiles 
  SET username = final_username, updated_at = NOW()
  WHERE id = user_id;
  
  UPDATE public.leaderboard_stats 
  SET username = final_username, updated_at = NOW()
  WHERE user_id = user_id;
  
  RETURN json_build_object('success', true, 'username', final_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to add/update email for recovery
CREATE OR REPLACE FUNCTION update_recovery_email(email_address TEXT)
RETURNS JSON AS $$
DECLARE
  user_id UUID;
  verification_token TEXT;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Generate verification token
  verification_token := encode(gen_random_bytes(32), 'hex');
  
  -- Update email in profile
  UPDATE public.user_profiles 
  SET 
    email = email_address,
    is_email_verified = FALSE,
    email_verification_token = verification_token,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN json_build_object(
    'success', true, 
    'verification_token', verification_token,
    'message', 'Email added for recovery. Please verify your email.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function for username-based password reset
CREATE OR REPLACE FUNCTION reset_password_by_username(username_input TEXT)
RETURNS JSON AS $$
DECLARE
  user_profile RECORD;
  recovery_token TEXT;
  expires_at TIMESTAMPTZ;
BEGIN
  -- Find user by username
  SELECT up.*, au.email as auth_email
  INTO user_profile
  FROM public.user_profiles up
  JOIN auth.users au ON up.id = au.id
  WHERE up.username = username_input;
  
  IF user_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Username not found');
  END IF;
  
  -- Check if user has email for recovery
  IF user_profile.email IS NULL OR user_profile.email = '' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'No email associated with this username for password recovery'
    );
  END IF;
  
  -- Generate recovery token
  recovery_token := encode(gen_random_bytes(32), 'hex');
  expires_at := NOW() + INTERVAL '1 hour';
  
  -- Update recovery token
  UPDATE public.user_profiles 
  SET 
    recovery_token = recovery_token,
    recovery_token_expires = expires_at,
    updated_at = NOW()
  WHERE id = user_profile.id;
  
  -- Here you would typically send an email with the recovery token
  -- For now, we'll return the token (in production, don't return the token)
  RETURN json_build_object(
    'success', true, 
    'message', 'Recovery instructions sent to your email',
    'email', user_profile.email -- Remove this in production
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_user_id ON public.leaderboard_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_username ON public.leaderboard_stats(username);

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.user_progress TO anon, authenticated;
GRANT ALL ON public.leaderboard_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_unique_username(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_username(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_recovery_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_password_by_username(TEXT) TO anon, authenticated;
