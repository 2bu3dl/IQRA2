-- Debug script to check user_profiles table
-- Run this in Supabase SQL Editor to diagnose the issue

-- Check if user_profiles table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public';

-- Check if there are any user_settings tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%user%';

-- Test a simple query on user_profiles
SELECT COUNT(*) FROM public.user_profiles;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';
