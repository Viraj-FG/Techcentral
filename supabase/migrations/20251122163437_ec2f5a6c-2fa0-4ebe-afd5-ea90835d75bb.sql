-- Add retailer preference and location fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_retailer_id text,
ADD COLUMN IF NOT EXISTS preferred_retailer_name text,
ADD COLUMN IF NOT EXISTS user_zip_code text,
ADD COLUMN IF NOT EXISTS last_retailer_refresh timestamptz;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_retailer 
ON profiles(preferred_retailer_id) 
WHERE preferred_retailer_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.preferred_retailer_id IS 'Cached Instacart retailer ID for seamless checkout';
COMMENT ON COLUMN profiles.preferred_retailer_name IS 'Display name of preferred retailer (e.g., Safeway, Whole Foods)';
COMMENT ON COLUMN profiles.user_zip_code IS 'User zip code for nearby retailer lookup';
COMMENT ON COLUMN profiles.last_retailer_refresh IS 'Last time nearby retailers were fetched for cache invalidation';