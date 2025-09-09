-- Fix missing columns in user_profiles table
-- Run this in Supabase SQL Editor

-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS profile_letter TEXT DEFAULT 'ء',
ADD COLUMN IF NOT EXISTS letter_color TEXT DEFAULT '#6BA368',
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#F5E6C8';

-- Update existing records to have the new columns with default values
UPDATE public.user_profiles 
SET 
  profile_letter = COALESCE(profile_letter, 'ء'),
  letter_color = COALESCE(letter_color, '#6BA368'),
  background_color = COALESCE(background_color, '#F5E6C8')
WHERE profile_letter IS NULL OR letter_color IS NULL OR background_color IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
