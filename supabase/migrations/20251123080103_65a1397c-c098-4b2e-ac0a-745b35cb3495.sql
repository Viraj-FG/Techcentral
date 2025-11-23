-- Phase 1: Database Schema Updates for Kaeva Command Center

-- Add consumption tracking to inventory table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS consumption_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS original_quantity DECIMAL(10,2);

-- Add pet feeding data to pets table
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS daily_serving_size DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS food_brand TEXT;

-- Create recipes cache table for storing generated recipes
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  cooking_time INTEGER,
  difficulty TEXT,
  required_appliances TEXT[],
  estimated_calories INTEGER,
  servings INTEGER,
  match_score INTEGER, -- % of ingredients user has
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on recipes table
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- RLS policies for recipes
CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_match ON recipes(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_cached ON recipes(cached_at DESC);