-- Create household_activity table
CREATE TABLE public.household_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  actor_name TEXT,
  activity_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.household_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Household members can view activity"
  ON public.household_activity
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert activity"
  ON public.household_activity
  FOR INSERT
  WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.household_activity;

-- Create function to log household activity
CREATE OR REPLACE FUNCTION public.log_household_activity(
  p_household_id UUID,
  p_activity_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name TEXT;
BEGIN
  -- Get actor name from profiles
  SELECT user_name INTO v_actor_name
  FROM public.profiles
  WHERE id = auth.uid();

  -- Insert activity record
  INSERT INTO public.household_activity (
    household_id,
    actor_id,
    actor_name,
    activity_type,
    entity_type,
    entity_id,
    entity_name,
    metadata
  ) VALUES (
    p_household_id,
    auth.uid(),
    COALESCE(v_actor_name, 'Unknown User'),
    p_activity_type,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_metadata
  );
END;
$$;

-- Trigger function for member joins
CREATE OR REPLACE FUNCTION public.log_member_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name TEXT;
BEGIN
  -- Get member name from profiles
  SELECT user_name INTO v_actor_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Log the activity
  INSERT INTO public.household_activity (
    household_id,
    actor_id,
    actor_name,
    activity_type,
    entity_type,
    entity_id,
    entity_name
  ) VALUES (
    NEW.household_id,
    NEW.user_id,
    COALESCE(v_actor_name, 'Unknown User'),
    'member_joined',
    'member',
    NEW.id,
    COALESCE(v_actor_name, 'A new member')
  );

  RETURN NEW;
END;
$$;

-- Trigger for member joins
CREATE TRIGGER on_member_joined
  AFTER INSERT ON public.household_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.log_member_joined();

-- Trigger function for inventory changes
CREATE OR REPLACE FUNCTION public.log_inventory_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_type TEXT;
  v_metadata JSONB;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_activity_type := 'inventory_added';
    v_metadata := jsonb_build_object(
      'category', NEW.category,
      'quantity', NEW.quantity,
      'unit', NEW.unit
    );
    
    PERFORM public.log_household_activity(
      NEW.household_id,
      v_activity_type,
      'inventory',
      NEW.id,
      NEW.name,
      v_metadata
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    v_activity_type := 'inventory_updated';
    v_metadata := jsonb_build_object(
      'old_quantity', OLD.quantity,
      'new_quantity', NEW.quantity,
      'old_status', OLD.status,
      'new_status', NEW.status
    );
    
    PERFORM public.log_household_activity(
      NEW.household_id,
      v_activity_type,
      'inventory',
      NEW.id,
      NEW.name,
      v_metadata
    );
  ELSIF (TG_OP = 'DELETE') THEN
    v_activity_type := 'inventory_removed';
    v_metadata := jsonb_build_object(
      'category', OLD.category
    );
    
    PERFORM public.log_household_activity(
      OLD.household_id,
      v_activity_type,
      'inventory',
      OLD.id,
      OLD.name,
      v_metadata
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers for inventory changes
CREATE TRIGGER on_inventory_change
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.log_inventory_change();

-- Trigger function for recipe additions
CREATE OR REPLACE FUNCTION public.log_recipe_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metadata JSONB;
BEGIN
  v_metadata := jsonb_build_object(
    'difficulty', NEW.difficulty,
    'cooking_time', NEW.cooking_time,
    'servings', NEW.servings
  );

  PERFORM public.log_household_activity(
    NEW.household_id,
    'recipe_added',
    'recipe',
    NEW.id,
    NEW.name,
    v_metadata
  );

  RETURN NEW;
END;
$$;

-- Trigger for recipe additions
CREATE TRIGGER on_recipe_added
  AFTER INSERT ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_recipe_added();