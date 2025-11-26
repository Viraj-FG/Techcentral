-- Create daily_digests table for AI-generated personalized insights
CREATE TABLE public.daily_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  household_id UUID REFERENCES public.households(id),
  digest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  UNIQUE(user_id, digest_date)
);

-- Enable RLS
ALTER TABLE public.daily_digests ENABLE ROW LEVEL SECURITY;

-- Users can view their own digests
CREATE POLICY "Users can view own daily digests"
ON public.daily_digests
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert digests (for edge function)
CREATE POLICY "Service can insert digests"
ON public.daily_digests
FOR INSERT
WITH CHECK (true);

-- Users can update viewed_at
CREATE POLICY "Users can update own digest viewed_at"
ON public.daily_digests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_daily_digests_user_date ON public.daily_digests(user_id, digest_date DESC);