import { supabase as baseSupabase } from '@/integrations/supabase/client';
import { logger } from './logger';

/**
 * Logged wrapper around Supabase client
 * Adds verbose logging to all Supabase operations
 */

// Auth state change logging
baseSupabase.auth.onAuthStateChange((event, session) => {
  logger.info('Auth state changed', {
    event,
    userId: session?.user?.id,
    email: session?.user?.email,
    hasSession: !!session,
  });
});

// Export the base client with logging already attached
export const supabase = baseSupabase;

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
