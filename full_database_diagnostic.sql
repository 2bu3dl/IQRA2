-- FULL DATABASE DIAGNOSTIC - Run this in Supabase SQL Editor
-- This will check everything comprehensively

-- ===========================================
-- 1. CHECK AUTH.USERS TABLE
-- ===========================================
SELECT '=== AUTH.USERS TABLE ===' as section;
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- ===========================================
-- 2. CHECK PUBLIC.USER_PROFILES TABLE
-- ===========================================
SELECT '=== PUBLIC.USER_PROFILES TABLE ===' as section;
SELECT COUNT(*) as total_user_profiles FROM public.user_profiles;

-- Show ALL user profiles (not just usernames)
SELECT id, username, display_name, email, created_at, updated_at 
FROM public.user_profiles 
ORDER BY created_at DESC;

-- Check for NULL usernames
SELECT COUNT(*) as null_usernames FROM public.user_profiles WHERE username IS NULL;
SELECT COUNT(*) as empty_usernames FROM public.user_profiles WHERE username = '';

-- ===========================================
-- 3. CHECK RELATIONSHIP BETWEEN TABLES
-- ===========================================
SELECT '=== RELATIONSHIP CHECK ===' as section;

-- Users in auth.users but NOT in user_profiles
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.created_at as auth_created,
  'MISSING PROFILE' as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Users in user_profiles but NOT in auth.users (shouldn't happen)
SELECT 
  up.id as profile_id,
  up.username,
  up.email as profile_email,
  'ORPHANED PROFILE' as status
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL;

-- ===========================================
-- 4. CHECK OTHER TABLES
-- ===========================================
SELECT '=== USER_PROGRESS TABLE ===' as section;
SELECT COUNT(*) as total_progress_records FROM public.user_progress;

SELECT '=== LEADERBOARD_STATS TABLE ===' as section;
SELECT COUNT(*) as total_leaderboard_records FROM public.leaderboard_stats;

-- ===========================================
-- 5. TEST SPECIFIC QUERIES
-- ===========================================
SELECT '=== TESTING SPECIFIC QUERIES ===' as section;

-- Test the exact query the app uses
SELECT 'Testing username query for 2bu3dl:' as test;
SELECT username FROM public.user_profiles WHERE username = '2bu3dl';

-- Test with a non-existent username
SELECT 'Testing username query for nonexistent:' as test;
SELECT username FROM public.user_profiles WHERE username = 'nonexistentuser123';

-- Test with NULL username
SELECT 'Testing username query for NULL:' as test;
SELECT username FROM public.user_profiles WHERE username IS NULL;

-- ===========================================
-- 6. CHECK TABLE PERMISSIONS
-- ===========================================
SELECT '=== TABLE PERMISSIONS ===' as section;
SELECT table_name, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name IN ('user_profiles', 'user_progress', 'leaderboard_stats')
AND grantee = 'anon'
ORDER BY table_name, privilege_type;

-- ===========================================
-- 7. CHECK RLS POLICIES
-- ===========================================
SELECT '=== RLS POLICIES ===' as section;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_progress', 'leaderboard_stats')
ORDER BY tablename, policyname;
