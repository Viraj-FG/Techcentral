-- Fix household_invites RLS policy security issue
-- Remove the overly permissive update policy that allows any authenticated user to modify invites
-- The accept-household-invite edge function uses service role key, so it bypasses RLS

DROP POLICY IF EXISTS "Authenticated users can update invite usage" ON public.household_invites;

-- Create a restricted policy that only allows updates through service role
-- This policy will never match for regular users, only for service role operations
CREATE POLICY "Service can update invite usage"
ON public.household_invites
FOR UPDATE
USING (false)
WITH CHECK (false);

-- Add a comment explaining the security model
COMMENT ON POLICY "Service can update invite usage" ON public.household_invites IS 
  'This policy blocks all client-side updates. Invite usage is only updated via the accept-household-invite edge function using service role credentials, which bypasses RLS entirely.';