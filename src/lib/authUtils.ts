import { logger } from "./logger";

type AdminCheckResult = 
  | { success: true; isAdmin: boolean }
  | { success: false; error: string };

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
    const timeoutPromise = new Promise<AdminCheckResult>((resolve) => 
      setTimeout(() => {
        logger.warn('Admin check timed out');
        resolve({ success: false, error: 'Timeout after 5 seconds' });
      }, 5000)
    );

    const checkPromise = supabase.functions
      .invoke("check-admin", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      .then((response): AdminCheckResult => {
        if (response.error) {
          return { success: false, error: response.error.message };
        }
        return { 
          success: true, 
          isAdmin: response.data?.isAdmin || false 
        };
      });

    const result = await Promise.race([checkPromise, timeoutPromise]);

    if (result.success === false) {
      logger.warn('Admin check failed - defaulting to non-admin', { 
        error: result.error,
        userId: session.user.id 
      });
      return false;
    }

    logger.info('Admin status checked', { 
      isAdmin: result.isAdmin, 
      userId: session.user.id 
    });
    return result.isAdmin;
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
