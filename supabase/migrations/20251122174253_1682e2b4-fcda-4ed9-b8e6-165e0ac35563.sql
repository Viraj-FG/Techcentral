-- Add agent configuration tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS agent_last_configured_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS agent_prompt_version TEXT DEFAULT 'v1.0';

-- Add helpful comment
COMMENT ON COLUMN profiles.agent_last_configured_at IS 'Timestamp when the ElevenLabs agent was last configured';
COMMENT ON COLUMN profiles.agent_prompt_version IS 'Version identifier for the prompt currently deployed to the agent';