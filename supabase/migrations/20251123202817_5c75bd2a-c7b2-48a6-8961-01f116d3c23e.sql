-- PHASE 1: Create Households Infrastructure

-- Create households table
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on households
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- Add household_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN current_household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_household ON public.profiles(current_household_id);

-- Add household_id to inventory (nullable during migration)
ALTER TABLE public.inventory 
ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- Add household_id to shopping_list
ALTER TABLE public.shopping_list 
ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- Add household_id to recipes
ALTER TABLE public.recipes 
ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- Migration: Create households for existing users and migrate their data
DO $$
DECLARE
  user_record RECORD;
  new_household_id UUID;
BEGIN
  FOR user_record IN SELECT id, user_name FROM public.profiles LOOP
    -- Create household for this user
    INSERT INTO public.households (name, owner_id)
    VALUES (COALESCE(user_record.user_name || '''s Household', 'My Household'), user_record.id)
    RETURNING id INTO new_household_id;
    
    -- Link user to their new household
    UPDATE public.profiles 
    SET current_household_id = new_household_id
    WHERE id = user_record.id;
    
    -- Migrate their inventory
    UPDATE public.inventory
    SET household_id = new_household_id
    WHERE user_id = user_record.id;
    
    -- Migrate their shopping list
    UPDATE public.shopping_list
    SET household_id = new_household_id
    WHERE user_id = user_record.id;
    
    -- Migrate their recipes
    UPDATE public.recipes
    SET household_id = new_household_id
    WHERE user_id = user_record.id;
  END LOOP;
END $$;

-- Make household_id NOT NULL
ALTER TABLE public.inventory ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE public.shopping_list ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE public.recipes ALTER COLUMN household_id SET NOT NULL;

-- DROP OLD RLS POLICIES FIRST (before dropping columns)
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.inventory;

DROP POLICY IF EXISTS "Users can view own shopping list" ON public.shopping_list;
DROP POLICY IF EXISTS "Users can insert own shopping list" ON public.shopping_list;
DROP POLICY IF EXISTS "Users can update own shopping list" ON public.shopping_list;
DROP POLICY IF EXISTS "Users can delete own shopping list" ON public.shopping_list;

DROP POLICY IF EXISTS "Users can view own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON public.recipes;

-- Now drop old user_id columns
ALTER TABLE public.inventory DROP COLUMN user_id;
ALTER TABLE public.shopping_list DROP COLUMN user_id;

-- Create RLS policies for households table
CREATE POLICY "Owners can manage own household"
  ON public.households
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Members can view their household"
  ON public.households
  FOR SELECT
  USING (
    id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Create NEW inventory RLS policies for household-based access
CREATE POLICY "Household members can view inventory"
  ON public.inventory
  FOR SELECT
  USING (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household members can insert inventory"
  ON public.inventory
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household members can update inventory"
  ON public.inventory
  FOR UPDATE
  USING (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household members can delete inventory"
  ON public.inventory
  FOR DELETE
  USING (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Create NEW shopping_list RLS policies
CREATE POLICY "Household members can view shopping list"
  ON public.shopping_list
  FOR SELECT
  USING (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household members can insert shopping list"
  ON public.shopping_list
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household members can update shopping list"
  ON public.shopping_list
  FOR UPDATE
  USING (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household members can delete shopping list"
  ON public.shopping_list
  FOR DELETE
  USING (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Create NEW recipes RLS policies
CREATE POLICY "Household members can view recipes"
  ON public.recipes
  FOR SELECT
  USING (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household members can insert recipes"
  ON public.recipes
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household members can update recipes"
  ON public.recipes
  FOR UPDATE
  USING (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household members can delete recipes"
  ON public.recipes
  FOR DELETE
  USING (
    household_id IN (
      SELECT current_household_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Add trigger for households updated_at
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();