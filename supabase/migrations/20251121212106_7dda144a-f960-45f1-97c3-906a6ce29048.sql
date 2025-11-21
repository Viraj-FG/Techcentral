-- ============================================
-- PHASE 4: CONFIGURATION STATE PERSISTENCE
-- ============================================

-- Add agent configuration tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN agent_configured BOOLEAN DEFAULT FALSE,
ADD COLUMN agent_configured_at TIMESTAMPTZ;