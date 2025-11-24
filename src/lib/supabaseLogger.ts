import { supabase as baseSupabase } from '@/integrations/supabase/client';
import { logger } from './logger';

/**
 * Logged wrapper around Supabase client
 * Adds verbose logging to all Supabase operations
 */

// Export the base client with logging
export const supabase = baseSupabase;

/**
 * Initialize auth state logging
 * Call this explicitly after app initialization to avoid conflicts
 */
export const initializeAuthLogging = () => {
  logger.info('Initializing auth state logging');
  baseSupabase.auth.onAuthStateChange((event, session) => {
    logger.info('Auth state changed', {
      event,
      userId: session?.user?.id,
      email: session?.user?.email,
      hasSession: !!session,
    });
  });
};

// Helper to log database operations
export const logDatabaseOperation = (
  operation: string,
  table: string,
  data?: any,
  error?: any
) => {
  if (error) {
    logger.error(`Database ${operation} failed`, error, { table, data });
  } else {
    logger.debug(`Database ${operation} succeeded`, { table, data });
  }
};
