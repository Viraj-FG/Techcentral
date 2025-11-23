-- Fix service role blocking issues and secure product cache read access

-- ============================================
-- 1. PRODUCT_CACHE - Fix service role blocking
-- ============================================

-- Drop the blocking policies that prevent service role operations
DROP POLICY IF EXISTS "Service can insert product cache" ON public.product_cache;
DROP POLICY IF EXISTS "Service can update product cache" ON public.product_cache;
DROP POLICY IF EXISTS "Service can delete product cache" ON public.product_cache;

-- No INSERT/UPDATE/DELETE policies needed - service role bypasses RLS
-- Regular authenticated users are blocked by absence of policies
-- Edge functions using service role can freely manage the cache

-- Fix SELECT policy - restrict to service role operations only
-- Drop the public read policy
DROP POLICY IF EXISTS "Users can view product cache" ON public.product_cache;

-- No SELECT policy for regular users - only edge functions (service role) can read
-- This prevents competitors from scraping cached product data

-- ============================================
-- 2. NOTIFICATIONS - Fix service role blocking  
-- ============================================

-- Drop the blocking INSERT policy
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;

-- No INSERT policy needed - service role bypasses RLS
-- Regular authenticated users cannot create notifications (blocked by absence of policy)
-- Edge functions using service role can create notifications for users

-- ============================================
-- ARCHITECTURE EXPLANATION
-- ============================================
-- 
-- Service Role Bypass: When edge functions use SUPABASE_SERVICE_ROLE_KEY,
-- they completely bypass Row Level Security policies.
--
-- Security Model:
-- 1. Regular authenticated users: Restricted by RLS policies
-- 2. Edge functions (service role): Bypass RLS, full access
--
-- Tables with service-only operations:
-- - product_cache: Only edge functions read/write (no user policies)
-- - notifications: Only edge functions create (users can view/update/delete their own)
--
-- This approach:
-- ✅ Prevents cache pollution by users
-- ✅ Prevents data scraping by competitors  
-- ✅ Allows edge functions to manage cache and notifications
-- ✅ Maintains user privacy and data isolation