-- Comprehensive fix for all database issues
-- Run this in Supabase SQL Editor

-- 1. Fix missing columns in leaderboard_stats table
ALTER TABLE public.leaderboard_stats 
ADD COLUMN IF NOT EXISTS total_ayaat_memorized INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

-- 2. Update existing records to have the new columns
UPDATE public.leaderboard_stats 
SET 
  total_ayaat_memorized = COALESCE(memorized_ayahs, 0),
  current_streak = COALESCE(streak, 0)
WHERE total_ayaat_memorized IS NULL OR current_streak IS NULL;

-- 3. Fix the trigger function to handle username-only registration properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
  user_email TEXT;
BEGIN
  -- Get email from auth.users (might be null for username-only accounts)
  user_email := NEW.email;
  
  -- For username-only accounts, we'll let the app handle username creation
  -- This trigger will only create the basic profile structure
  IF user_email IS NOT NULL AND user_email != '' THEN
    -- Email-based account - generate username from email
    generated_username := generate_unique_username(
      COALESCE(
        split_part(user_email, '@', 1),
        'user'
      )
    );
  ELSE
    -- Username-only account - create temporary username, app will update it
    generated_username := 'temp_' || substr(NEW.id::TEXT, 1, 8);
  END IF;
  
  -- Insert user profile
  INSERT INTO public.user_profiles (id, username, email, display_name)
  VALUES (NEW.id, generated_username, user_email, generated_username);
  
  -- Insert user progress
  INSERT INTO public.user_progress (user_id, progress_data)
  VALUES (NEW.id, '{}');
  
  -- Insert leaderboard stats with all required columns
  INSERT INTO public.leaderboard_stats (
    user_id, 
    username, 
    total_hasanat, 
    streak, 
    memorized_ayahs,
    total_ayaat_memorized,
    current_streak
  )
  VALUES (
    NEW.id, 
    generated_username, 
    0, 
    0, 
    0,
    0,
    0
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verify the table structures
SELECT 'user_profiles columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'leaderboard_stats columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'leaderboard_stats' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Test username availability query
SELECT 'Testing username availability query:' as info;
SELECT username FROM public.user_profiles WHERE username = 'testuser';
