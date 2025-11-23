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
      console.warn('No user session, skipping conversation log');
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
      console.error('Failed to log conversation event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging conversation event:', error);
    return false;
  }
};

/**
 * Generate a unique conversation ID
 */
export const generateConversationId = (): string => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
