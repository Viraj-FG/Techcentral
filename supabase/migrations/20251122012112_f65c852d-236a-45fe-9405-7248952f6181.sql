-- Add FatSecret enrichment columns to inventory table (one at a time)
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS fatsecret_id text;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS product_image_url text;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS nutrition_data jsonb;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS allergens jsonb;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS dietary_flags jsonb;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS brand_name text;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_enriched_at timestamptz;

-- Create product_cache table for FatSecret API response caching
CREATE TABLE IF NOT EXISTS product_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_term text NOT NULL,
  fatsecret_response jsonb NOT NULL,
  image_url text,
  nutrition_summary jsonb,
  cached_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_cache_search ON product_cache(search_term);
CREATE INDEX IF NOT EXISTS idx_product_cache_expires ON product_cache(expires_at);

-- Enable RLS on product_cache
ALTER TABLE product_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read from cache
CREATE POLICY "Users can view product cache"
  ON product_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert cache entries
CREATE POLICY "Users can insert product cache"
  ON product_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);