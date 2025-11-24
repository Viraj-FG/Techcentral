import { supabase } from "@/integrations/supabase/client";

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      // Silent fail - user might not be logged in yet
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
      // Log error but don't throw - prevents crashing the conversation
      console.warn('[ConversationLogger] Failed to log event:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    // Catch all errors to prevent conversation crashes
    console.warn('[ConversationLogger] Error logging event:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

/**
 * Generate a unique conversation ID using proper UUID format
 */
export const generateConversationId = (): string => {
  return crypto.randomUUID();
};
