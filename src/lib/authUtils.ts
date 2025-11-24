import { logger } from "./logger";

/**
 * Check if the current user has admin role
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

    const { data, error } = await supabase.functions.invoke("check-admin", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) {
      logger.error('Admin check failed', error, { userId: session.user.id });
      return false;
    }

    const isAdmin = data?.isAdmin || false;
    logger.info('Admin status checked', { isAdmin, userId: session.user.id });
    return isAdmin;
  } catch (error) {
    logger.error('Error checking admin status', error as Error);
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
