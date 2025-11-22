-- Add biometric columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_weight NUMERIC; -- in kg
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_height NUMERIC; -- in cm
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_gender TEXT; -- 'male', 'female', 'other'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_activity_level TEXT; -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calculated_tdee INTEGER; -- Total Daily Energy Expenditure

-- Create household_members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  member_type TEXT NOT NULL, -- 'adult', 'child', 'elderly', 'toddler'
  name TEXT, -- Optional nickname like "Mom", "Toddler Emma"
  age INTEGER,
  age_group TEXT, -- 'infant', 'toddler', 'child', 'teen', 'adult', 'elderly'
  
  -- Biometrics (optional for dependents)
  weight NUMERIC,
  height NUMERIC,
  gender TEXT,
  activity_level TEXT,
  calculated_tdee INTEGER,
  
  -- Medical/Safety Profile
  dietary_restrictions JSONB DEFAULT '[]'::jsonb,
  allergies JSONB DEFAULT '[]'::jsonb,
  health_conditions JSONB DEFAULT '[]'::jsonb, -- ['diabetes', 'hypertension', 'celiac']
  medication_interactions JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own household members"
  ON household_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own household members"
  ON household_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own household members"
  ON household_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own household members"
  ON household_members FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_household_members_updated_at
  BEFORE UPDATE ON household_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();