-- Add streak tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_log_date date,
ADD COLUMN IF NOT EXISTS streak_start_date date;