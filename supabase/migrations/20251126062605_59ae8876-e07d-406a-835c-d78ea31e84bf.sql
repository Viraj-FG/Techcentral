-- Create meal_templates table for saving frequently eaten meals
CREATE TABLE public.meal_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  items JSONB NOT NULL,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  total_fiber NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for meal_templates
CREATE POLICY "Users can view own meal templates"
ON public.meal_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal templates"
ON public.meal_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal templates"
ON public.meal_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal templates"
ON public.meal_templates FOR DELETE
USING (auth.uid() = user_id);

-- Add nutrition goal columns to profiles
ALTER TABLE public.profiles
ADD COLUMN daily_calorie_goal INTEGER DEFAULT 2000,
ADD COLUMN daily_protein_goal INTEGER DEFAULT 150,
ADD COLUMN daily_carbs_goal INTEGER DEFAULT 200,
ADD COLUMN daily_fat_goal INTEGER DEFAULT 65;

-- Add trigger for updated_at on meal_templates
CREATE TRIGGER update_meal_templates_updated_at
BEFORE UPDATE ON public.meal_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();