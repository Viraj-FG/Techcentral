-- Create shopping_list table
CREATE TABLE public.shopping_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  source TEXT NOT NULL, -- 'manual', 'replenishment', 'spoilage'
  priority TEXT DEFAULT 'normal', -- 'high', 'normal', 'low'
  status TEXT DEFAULT 'pending', -- 'pending', 'added_to_cart', 'purchased'
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

-- RLS policies for shopping_list
CREATE POLICY "Users can view own shopping list"
  ON public.shopping_list FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping list"
  ON public.shopping_list FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping list"
  ON public.shopping_list FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping list"
  ON public.shopping_list FOR DELETE
  USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'spoilage_warning', 'out_of_stock', 'recipe_cooked'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Extend inventory_status enum
ALTER TYPE inventory_status ADD VALUE IF NOT EXISTS 'out_of_stock';
ALTER TYPE inventory_status ADD VALUE IF NOT EXISTS 'likely_spoiled';

-- Add activity_timestamp to inventory for spoilage tracking
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to check for spoilage
CREATE OR REPLACE FUNCTION public.check_spoilage()
RETURNS TABLE(
  inventory_id UUID,
  item_name TEXT,
  days_old INTEGER,
  category inventory_category
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    EXTRACT(DAY FROM (now() - i.created_at))::INTEGER as days_old,
    i.category
  FROM public.inventory i
  WHERE i.category IN ('fridge', 'pantry')
    AND i.status NOT IN ('out_of_stock', 'likely_spoiled')
    AND (
      -- Fresh produce: 14 days
      (i.category = 'fridge' AND EXTRACT(DAY FROM (now() - i.last_activity_at)) > 14)
      OR
      -- Pantry items: 90 days
      (i.category = 'pantry' AND EXTRACT(DAY FROM (now() - i.last_activity_at)) > 90)
    );
END;
$$;

-- Create function to mark spoilage
CREATE OR REPLACE FUNCTION public.mark_spoilage(_inventory_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.inventory
  SET status = 'likely_spoiled',
      updated_at = now()
  WHERE id = _inventory_id;
END;
$$;

-- Create trigger for shopping_list updated_at
CREATE TRIGGER update_shopping_list_updated_at
  BEFORE UPDATE ON public.shopping_list
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to update inventory last_activity_at
CREATE OR REPLACE FUNCTION public.update_inventory_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_inventory_activity_trigger
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
  EXECUTE FUNCTION public.update_inventory_activity();