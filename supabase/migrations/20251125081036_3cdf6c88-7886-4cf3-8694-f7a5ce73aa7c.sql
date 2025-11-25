-- Create household_invites table
CREATE TABLE public.household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create household_memberships table
CREATE TABLE public.household_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- Enable RLS on household_invites
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;

-- Enable RLS on household_memberships
ALTER TABLE public.household_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for household_invites
CREATE POLICY "Household owners can create invites"
ON public.household_invites
FOR INSERT
TO authenticated
WITH CHECK (
  household_id IN (
    SELECT id FROM public.households WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Household owners can view their invites"
ON public.household_invites
FOR SELECT
TO authenticated
USING (
  household_id IN (
    SELECT id FROM public.households WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Household owners can delete their invites"
ON public.household_invites
FOR DELETE
TO authenticated
USING (
  household_id IN (
    SELECT id FROM public.households WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can update invite usage"
ON public.household_invites
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for household_memberships
CREATE POLICY "Users can view their own memberships"
ON public.household_memberships
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Household owners can view members"
ON public.household_memberships
FOR SELECT
TO authenticated
USING (
  household_id IN (
    SELECT id FROM public.households WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Service can insert memberships"
ON public.household_memberships
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Household owners can delete members"
ON public.household_memberships
FOR DELETE
TO authenticated
USING (
  household_id IN (
    SELECT id FROM public.households WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own membership"
ON public.household_memberships
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Migrate existing households to memberships (owners become members)
INSERT INTO public.household_memberships (household_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM public.households
ON CONFLICT (household_id, user_id) DO NOTHING;

-- Update RLS policies for inventory to include memberships
DROP POLICY IF EXISTS "Household members can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Household members can insert inventory" ON public.inventory;
DROP POLICY IF EXISTS "Household members can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Household members can delete inventory" ON public.inventory;

CREATE POLICY "Household members can view inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can insert inventory"
ON public.inventory
FOR INSERT
TO authenticated
WITH CHECK (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can update inventory"
ON public.inventory
FOR UPDATE
TO authenticated
USING (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can delete inventory"
ON public.inventory
FOR DELETE
TO authenticated
USING (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

-- Update RLS policies for recipes to include memberships
DROP POLICY IF EXISTS "Household members can view recipes" ON public.recipes;
DROP POLICY IF EXISTS "Household members can insert recipes" ON public.recipes;
DROP POLICY IF EXISTS "Household members can update recipes" ON public.recipes;
DROP POLICY IF EXISTS "Household members can delete recipes" ON public.recipes;

CREATE POLICY "Household members can view recipes"
ON public.recipes
FOR SELECT
TO authenticated
USING (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can insert recipes"
ON public.recipes
FOR INSERT
TO authenticated
WITH CHECK (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can update recipes"
ON public.recipes
FOR UPDATE
TO authenticated
USING (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can delete recipes"
ON public.recipes
FOR DELETE
TO authenticated
USING (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

-- Update RLS policies for shopping_list to include memberships
DROP POLICY IF EXISTS "Household members can view shopping list" ON public.shopping_list;
DROP POLICY IF EXISTS "Household members can insert shopping list" ON public.shopping_list;
DROP POLICY IF EXISTS "Household members can update shopping list" ON public.shopping_list;
DROP POLICY IF EXISTS "Household members can delete shopping list" ON public.shopping_list;

CREATE POLICY "Household members can view shopping list"
ON public.shopping_list
FOR SELECT
TO authenticated
USING (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can insert shopping list"
ON public.shopping_list
FOR INSERT
TO authenticated
WITH CHECK (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can update shopping list"
ON public.shopping_list
FOR UPDATE
TO authenticated
USING (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can delete shopping list"
ON public.shopping_list
FOR DELETE
TO authenticated
USING (
  household_id IN (
    SELECT household_id FROM public.household_memberships WHERE user_id = auth.uid()
  )
);