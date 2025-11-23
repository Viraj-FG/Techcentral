-- Create table for real-time conversation monitoring
CREATE TABLE IF NOT EXISTS public.conversation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  agent_type text NOT NULL, -- 'onboarding' or 'assistant'
  event_type text NOT NULL, -- 'user_transcript', 'agent_transcript', 'tool_call', 'tool_response', 'session_start', 'session_end'
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  role text, -- 'user', 'assistant', 'system'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all conversation events"
  ON public.conversation_events
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own conversation events"
  ON public.conversation_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation events"
  ON public.conversation_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_conversation_events_conversation_id ON public.conversation_events(conversation_id);
CREATE INDEX idx_conversation_events_user_id ON public.conversation_events(user_id);
CREATE INDEX idx_conversation_events_created_at ON public.conversation_events(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_events;