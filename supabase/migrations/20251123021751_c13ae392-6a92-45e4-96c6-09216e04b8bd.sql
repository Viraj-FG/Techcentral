-- Fix all missing RLS policies for complete data access control

-- ============================================
-- 1. CONVERSATION_HISTORY - Add UPDATE policy
-- ============================================
CREATE POLICY "Users can update own conversation history"
ON public.conversation_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. MEAL_LOGS - Add DELETE policy
-- ============================================
CREATE POLICY "Users can delete own meal logs"
ON public.meal_logs
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. PRODUCT_CACHE - Secure and add maintenance policies
-- ============================================

-- Drop the insecure INSERT policy that allows anyone to pollute cache
DROP POLICY IF EXISTS "Users can insert product cache" ON public.product_cache;

-- Create secure policy: Only service role (edge functions) can insert
-- Note: Service role bypasses RLS, so this policy won't affect edge functions
-- This policy blocks regular authenticated users from polluting the cache
CREATE POLICY "Service can insert product cache"
ON public.product_cache
FOR INSERT
WITH CHECK (false); -- Block all regular users; edge functions use service role

-- Add UPDATE policy for cache maintenance (service role only)
CREATE POLICY "Service can update product cache"
ON public.product_cache
FOR UPDATE
USING (false); -- Block all regular users; edge functions use service role

-- Add DELETE policy for cache cleanup (service role only)
CREATE POLICY "Service can delete product cache"
ON public.product_cache
FOR DELETE
USING (false); -- Block all regular users; edge functions use service role

-- ============================================
-- 4. PROFILES - Add INSERT and DELETE policies
-- ============================================

-- Allow users to create their own profile (required for onboarding)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile (GDPR compliance)
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- ============================================
-- 5. NOTIFICATIONS - Secure INSERT policy
-- ============================================

-- Drop existing policies to recreate with proper security
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Recreate SELECT policy
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Recreate UPDATE policy  
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Recreate DELETE policy
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Add INSERT policy: Only service role (edge functions) can create notifications
CREATE POLICY "Service can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (false); -- Block regular users; edge functions use service role to create notifications

-- ============================================
-- SUMMARY OF CHANGES
-- ============================================
-- ✅ conversation_history: Added UPDATE policy
-- ✅ meal_logs: Added DELETE policy  
-- ✅ product_cache: Secured INSERT, added UPDATE/DELETE (service-role only)
-- ✅ profiles: Added INSERT policy (onboarding), DELETE policy (GDPR)
-- ✅ notifications: Secured INSERT (service-role only)