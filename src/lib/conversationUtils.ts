import { logger } from "./logger";

/**
 * Store a message in the conversation history
 */
export const storeMessage = async (
  role: string,
  message: string,
  conversationId: string
) => {
  try {
    logger.debug('Storing conversation message', { role, conversationId, messageLength: message.length });
    
    // Use the logged wrapper
    const { supabase } = await import('@/lib/supabaseLogger');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || !conversationId || !message.trim()) {
      logger.warn('Cannot store message - missing required data', {
        hasSession: !!session,
        hasConversationId: !!conversationId,
        hasMessage: !!message.trim(),
      });
      return;
    }

    const { error } = await supabase.from('conversation_history').insert({
      user_id: session.user.id,
      conversation_id: conversationId,
      role,
      message: message.trim()
    });

    if (error) {
      logger.error('Failed to store conversation message', error, { role, conversationId });
      throw error;
    }

    logger.info('Stored conversation message', { role, conversationId });
  } catch (error) {
    logger.error('Error storing message', error as Error, { role, conversationId });
  }
};

/**
 * Fetch recent conversation history for the current user
 */
export const fetchRecentHistory = async (limit: number = 10) => {
  try {
    logger.debug('Fetching recent conversation history', { limit });
    
    const { supabase } = await import('@/lib/supabaseLogger');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      logger.warn('Cannot fetch history - no active session');
      return [];
    }

    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch conversation history', error, { limit, userId: session.user.id });
      throw error;
    }

    const history = (data || []).reverse();
    logger.info('Loaded conversation history', { count: history.length, limit });
    return history;
  } catch (error) {
    logger.error('Error fetching history', error as Error, { limit });
    return [];
  }
};

/**
 * Generate a unique conversation ID
 */
export const generateConversationId = (): string => {
  return crypto.randomUUID();
};
