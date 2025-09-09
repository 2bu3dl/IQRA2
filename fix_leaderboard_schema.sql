-- Fix missing columns in leaderboard_stats table
-- Run this in Supabase SQL Editor

-- Add missing columns to leaderboard_stats table
ALTER TABLE public.leaderboard_stats 
ADD COLUMN IF NOT EXISTS total_ayaat_memorized INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

-- Update existing records to have the new columns
UPDATE public.leaderboard_stats 
SET 
  total_ayaat_memorized = COALESCE(memorized_ayahs, 0),
  current_streak = COALESCE(streak, 0)
WHERE total_ayaat_memorized IS NULL OR current_streak IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'leaderboard_stats' 
AND table_schema = 'public'
ORDER BY ordinal_position;
