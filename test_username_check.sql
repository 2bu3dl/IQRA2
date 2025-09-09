-- Test script to check username availability functionality
-- Run this in Supabase SQL Editor

-- Check if user_profiles table has any data
SELECT COUNT(*) as total_users FROM public.user_profiles;

-- Check if there are any usernames
SELECT username FROM public.user_profiles LIMIT 5;

-- Test the exact query that the app uses
SELECT username FROM public.user_profiles WHERE username = 'testuser';

-- Test with a username that might exist
SELECT username FROM public.user_profiles WHERE username = 'admin';

-- Check the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public';
