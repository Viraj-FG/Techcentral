import { logger } from "./logger";

export type ConversationEventType = 
  | 'session_start'
  | 'session_end'
  | 'user_transcript'
  | 'agent_transcript'
  | 'tool_call'
  | 'tool_response';

interface LogEventParams {
  conversationId: string;
  agentType: 'onboarding' | 'assistant';
  eventType: ConversationEventType;
  eventData: any;
  role?: 'user' | 'assistant' | 'system';
}

/**
 * Log a conversation event to the database for real-time monitoring
 * Now with proper error handling and UUID generation
 */
export const logConversationEvent = async ({
  conversationId,
  agentType,
  eventType,
  eventData,
  role
}: LogEventParams): Promise<boolean> => {
  try {
    logger.debug('Logging conversation event', { conversationId, agentType, eventType, role });
    
    const { supabase } = await import('@/lib/supabaseLogger');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      logger.warn('Cannot log conversation event - no active session', { conversationId, eventType });
      return false;
    }

    const { error } = await supabase
      .from('conversation_events')
      .insert({
        conversation_id: conversationId,
        user_id: session.user.id,
        agent_type: agentType,
        event_type: eventType,
        event_data: eventData,
        role
      });

    if (error) {
      logger.error('Failed to log conversation event', error, {
        conversationId,
        agentType,
        eventType,
        userId: session.user.id,
      });
      return false;
    }

    logger.debug('Conversation event logged successfully', { conversationId, eventType });
    return true;
  } catch (error) {
    logger.error('Error logging conversation event', error as Error, {
      conversationId,
      agentType,
      eventType,
    });
    return false;
  }
};

/**
 * Generate a unique conversation ID using proper UUID format
 */
export const generateConversationId = (): string => {
  return crypto.randomUUID();
};
