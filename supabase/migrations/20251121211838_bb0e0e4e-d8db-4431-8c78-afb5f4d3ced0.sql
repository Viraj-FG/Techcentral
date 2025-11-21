-- ============================================
-- PHASE 1: DATABASE SCHEMA FOUNDATION
-- ============================================

-- Helper function for updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Personal
  user_name TEXT,
  language TEXT DEFAULT 'English',
  
  -- Food Vertical
  dietary_preferences JSONB DEFAULT '[]'::JSONB,
  allergies JSONB DEFAULT '[]'::JSONB,
  
  -- Beauty Vertical
  beauty_profile JSONB DEFAULT '{}'::JSONB,
  
  -- Goals
  health_goals JSONB DEFAULT '[]'::JSONB,
  lifestyle_goals JSONB DEFAULT '[]'::JSONB,
  
  -- Household
  household_adults INTEGER DEFAULT 1,
  household_kids INTEGER DEFAULT 0,
  
  CONSTRAINT valid_household CHECK (household_adults >= 0 AND household_kids >= 0)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-update timestamp trigger for profiles
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- PETS TABLE
-- ============================================
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('Dog', 'Cat')),
  breed TEXT,
  age INTEGER,
  notes TEXT,
  toxic_flags_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  CONSTRAINT valid_age CHECK (age IS NULL OR age >= 0)
);

-- Enable RLS on pets
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pets
CREATE POLICY "Users can view own pets"
  ON public.pets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pets"
  ON public.pets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pets"
  ON public.pets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pets"
  ON public.pets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_pets_user_id ON public.pets(user_id);

-- ============================================
-- INVENTORY TABLE
-- ============================================
CREATE TYPE public.inventory_category AS ENUM ('fridge', 'pantry', 'beauty', 'pets');
CREATE TYPE public.inventory_status AS ENUM ('sufficient', 'low', 'critical', 'out');

CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  name TEXT NOT NULL,
  category public.inventory_category NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 0,
  unit TEXT,
  fill_level INTEGER CHECK (fill_level >= 0 AND fill_level <= 100),
  expiry_date DATE,
  status public.inventory_status DEFAULT 'sufficient',
  auto_order_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reorder_threshold INTEGER DEFAULT 20,
  
  CONSTRAINT valid_quantity CHECK (quantity >= 0)
);

-- Enable RLS on inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory
CREATE POLICY "Users can view own inventory"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON public.inventory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON public.inventory FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON public.inventory FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX idx_inventory_category ON public.inventory(category);
CREATE INDEX idx_inventory_status ON public.inventory(status);

-- Auto-update timestamp trigger for inventory
CREATE TRIGGER set_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- CRITICAL: AUTO-PROFILE CREATION TRIGGER
-- Prevents "User Not Found" errors after signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger fires AFTER user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();