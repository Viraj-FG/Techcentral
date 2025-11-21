-- Create conversation_history table
CREATE TABLE public.conversation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversation history
CREATE POLICY "Users can view own conversation history"
  ON public.conversation_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own conversation history
CREATE POLICY "Users can insert own conversation history"
  ON public.conversation_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own conversation history
CREATE POLICY "Users can delete own conversation history"
  ON public.conversation_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_conversation_history_user_id ON public.conversation_history(user_id);
CREATE INDEX idx_conversation_history_conversation_id ON public.conversation_history(conversation_id);
CREATE INDEX idx_conversation_history_created_at ON public.conversation_history(created_at DESC);