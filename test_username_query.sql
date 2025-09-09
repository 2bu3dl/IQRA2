-- Test the exact query that the app uses for username availability
-- Run this in Supabase SQL Editor

-- Test the exact query format the app uses
SELECT username FROM public.user_profiles WHERE username = 'testuser';

-- Test with a username that should exist (replace 'your_username' with an actual username from your table)
SELECT username FROM public.user_profiles WHERE username = 'your_username';

-- Show all usernames to see what exists
SELECT username FROM public.user_profiles WHERE username IS NOT NULL AND username != '';

-- Test the query with a username that definitely exists
SELECT username FROM public.user_profiles LIMIT 1;
