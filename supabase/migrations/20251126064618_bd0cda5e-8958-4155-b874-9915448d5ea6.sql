-- Create meal_plans table for weekly meal planning
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Policies for meal_plans
CREATE POLICY "Household members can view meal plans"
ON public.meal_plans FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM household_memberships
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can insert meal plans"
ON public.meal_plans FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id FROM household_memberships
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can update meal plans"
ON public.meal_plans FOR UPDATE
USING (
  household_id IN (
    SELECT household_id FROM household_memberships
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Household members can delete meal plans"
ON public.meal_plans FOR DELETE
USING (
  household_id IN (
    SELECT household_id FROM household_memberships
    WHERE user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_meal_plans_updated_at
BEFORE UPDATE ON public.meal_plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();