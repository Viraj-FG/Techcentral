-- Create bookmarks table for universal favoriting across all domains
CREATE TABLE bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('food', 'recipe', 'product', 'pet_food', 'beauty_product')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_bookmark UNIQUE(user_id, item_id, item_type)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks"
  ON bookmarks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_bookmarks_user_type ON bookmarks(user_id, item_type);

-- Create saved_foods table for nutrition library quick access
CREATE TABLE saved_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  food_name text NOT NULL,
  nutrition_data jsonb NOT NULL,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_saved_food UNIQUE(user_id, food_name)
);

ALTER TABLE saved_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved foods"
  ON saved_foods
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_saved_foods_user ON saved_foods(user_id, last_used_at DESC);