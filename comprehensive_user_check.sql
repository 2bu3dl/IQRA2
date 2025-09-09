-- Comprehensive check of user_profiles table
-- Run this in Supabase SQL Editor

-- 1. Count total records
SELECT COUNT(*) as total_user_profiles FROM public.user_profiles;

-- 2. Show all usernames (not just one)
SELECT username FROM public.user_profiles WHERE username IS NOT NULL AND username != '' ORDER BY created_at;

-- 3. Show all user profiles with details
SELECT id, username, display_name, email, created_at 
FROM public.user_profiles 
ORDER BY created_at DESC;

-- 4. Check for any NULL or empty usernames
SELECT COUNT(*) as null_usernames FROM public.user_profiles WHERE username IS NULL OR username = '';

-- 5. Test the exact query the app uses for a specific username
SELECT username FROM public.user_profiles WHERE username = '2bu3dl';

-- 6. Test with a different username (if you have others)
SELECT username FROM public.user_profiles WHERE username = 'testuser';

-- 7. Check if there are any duplicate usernames
SELECT username, COUNT(*) as count 
FROM public.user_profiles 
WHERE username IS NOT NULL 
GROUP BY username 
HAVING COUNT(*) > 1;
