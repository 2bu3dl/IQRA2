-- Fix missing user profiles for existing auth.users
-- Run this in Supabase SQL Editor

-- Check what auth.users exist without profiles
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  up.username,
  up.created_at as profile_created
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- Create profiles for users who don't have them
INSERT INTO public.user_profiles (id, username, email, display_name, profile_letter, letter_color, background_color)
SELECT 
  au.id,
  CASE 
    WHEN au.email IS NOT NULL THEN 
      generate_unique_username(split_part(au.email, '@', 1))
    ELSE 
      generate_unique_username('user' || substr(au.id::TEXT, 1, 8))
  END as username,
  au.email,
  CASE 
    WHEN au.email IS NOT NULL THEN 
      split_part(au.email, '@', 1)
    ELSE 
      'user' || substr(au.id::TEXT, 1, 8)
  END as display_name,
  'ء' as profile_letter,
  '#6BA368' as letter_color,
  '#F5E6C8' as background_color
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Also create user_progress and leaderboard_stats for these users
INSERT INTO public.user_progress (user_id, progress_data)
SELECT 
  au.id,
  '{}'::jsonb
FROM auth.users au
LEFT JOIN public.user_progress up ON au.id = up.user_id
WHERE up.user_id IS NULL;

INSERT INTO public.leaderboard_stats (user_id, username, total_hasanat, streak, memorized_ayahs, total_ayaat_memorized, current_streak)
SELECT 
  au.id,
  up.username,
  0, 0, 0, 0, 0
FROM auth.users au
JOIN public.user_profiles up ON au.id = up.id
LEFT JOIN public.leaderboard_stats ls ON au.id = ls.user_id
WHERE ls.user_id IS NULL;

-- Verify the results
SELECT 'After fix - user profiles:' as info;
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

SELECT 'Sample profiles:' as info;
SELECT id, username, display_name, email FROM public.user_profiles LIMIT 5;
