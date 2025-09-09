-- Check what's in the user_profiles table
-- Run this in Supabase SQL Editor

-- Check if user_profiles table has any data
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- Show all user profiles
SELECT id, username, display_name, email, created_at 
FROM public.user_profiles 
ORDER BY created_at DESC;

-- Check if there are any usernames
SELECT username FROM public.user_profiles WHERE username IS NOT NULL AND username != '';

-- Check the relationship between auth.users and user_profiles
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  up.username,
  up.display_name,
  up.created_at as profile_created
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;
