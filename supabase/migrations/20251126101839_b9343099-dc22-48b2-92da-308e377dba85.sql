-- Add onboarding_modules JSONB column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_modules JSONB DEFAULT '{
  "core": false,
  "nutrition": false,
  "pantry": false,
  "beauty": false,
  "pets": false,
  "household": false
}'::jsonb;

-- Migrate existing users with completed onboarding to new module system
UPDATE profiles 
SET onboarding_modules = '{
  "core": true,
  "nutrition": true,
  "pantry": true,
  "beauty": true,
  "pets": true,
  "household": true
}'::jsonb
WHERE onboarding_completed = true 
AND (onboarding_modules IS NULL OR onboarding_modules = '{}');