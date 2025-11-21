-- Add permissions_granted column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS permissions_granted boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.permissions_granted IS 
'Tracks whether user has granted microphone and speaker permissions for voice onboarding';