-- Fix RLS policies to allow username availability checking
-- Run this in Supabase SQL Editor

-- 1. Create a policy that allows anyone to check username availability
-- This allows the app to check if usernames exist without being logged in
DROP POLICY IF EXISTS "Anyone can check username availability" ON public.user_profiles;
CREATE POLICY "Anyone can check username availability" ON public.user_profiles
  FOR SELECT USING (true);

-- 2. Alternative approach: Create a function that bypasses RLS for username checking
CREATE OR REPLACE FUNCTION check_username_exists(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE username = check_username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION check_username_exists(TEXT) TO anon;

-- 4. Test the function
SELECT 'Testing username check function:' as test;
SELECT check_username_exists('2bu3dl') as username_exists;

-- 5. Test the direct query (should now work)
SELECT 'Testing direct query:' as test;
SELECT username FROM public.user_profiles WHERE username = '2bu3dl';

-- 6. Show all usernames (should now work)
SELECT 'All usernames:' as test;
SELECT username FROM public.user_profiles WHERE username IS NOT NULL;
