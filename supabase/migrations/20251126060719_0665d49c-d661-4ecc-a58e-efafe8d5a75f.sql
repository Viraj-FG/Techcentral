-- Create water_logs table for tracking daily water intake
CREATE TABLE public.water_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for water_logs
CREATE POLICY "Users can view own water logs"
ON public.water_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs"
ON public.water_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs"
ON public.water_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Add water_goal_ml to profiles table
ALTER TABLE public.profiles
ADD COLUMN water_goal_ml INTEGER DEFAULT 2000;

-- Create index for faster queries
CREATE INDEX idx_water_logs_user_logged ON public.water_logs(user_id, logged_at DESC);