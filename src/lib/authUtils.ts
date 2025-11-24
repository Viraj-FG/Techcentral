import { logger } from "./logger";

/**
 * Check if the current user has admin role
 * Non-blocking with timeout and graceful error handling
 */
export const checkAdminStatus = async (): Promise<boolean> => {
  try {
    logger.debug('Checking admin status');
    
    const { supabase } = await import('@/lib/supabaseLogger');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      logger.debug('No active session - not admin');
      return false;
    }

    // Add 5-second timeout to prevent blocking
    const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => 
      setTimeout(() => reject(new Error('Admin check timeout after 5 seconds')), 5000)
    );

    const checkPromise = supabase.functions.invoke("check-admin", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const result = await Promise.race([checkPromise, timeoutPromise])
      .catch((error) => {
        logger.warn('Admin check timed out or failed', { error: error.message });
        return { data: null, error };
      });

    if (result.error) {
      logger.warn('Admin check failed - defaulting to non-admin', { 
        error: result.error.message || result.error,
        userId: session.user.id 
      });
      return false;
    }

    const isAdmin = (result.data as any)?.isAdmin || false;
    logger.info('Admin status checked', { isAdmin, userId: session.user.id });
    return isAdmin;
  } catch (error) {
    logger.warn('Error checking admin status - defaulting to non-admin', { 
      error: (error as Error).message 
    });
    return false;
  }
};

/**
 * Get current user session
 */
export const getCurrentSession = async () => {
  const { supabase } = await import('@/lib/supabaseLogger');
  const { data: { session } } = await supabase.auth.getSession();
  logger.debug('Retrieved current session', { hasSession: !!session, userId: session?.user?.id });
  return session;
};

/**
 * Get current user ID
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const session = await getCurrentSession();
  return session?.user?.id || null;
};
