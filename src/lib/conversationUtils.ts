import { supabase } from "@/integrations/supabase/client";

/**
 * Store a message in the conversation history
 */
export const storeMessage = async (
  role: string,
  message: string,
  conversationId: string
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || !conversationId || !message.trim()) return;

    await supabase.from('conversation_history').insert({
      user_id: session.user.id,
      conversation_id: conversationId,
      role,
      message: message.trim()
    });

    console.log(`✅ Stored ${role} message`);
  } catch (error) {
    console.error("Error storing message:", error);
  }
};

/**
 * Fetch recent conversation history for the current user
 */
export const fetchRecentHistory = async (limit: number = 10) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const history = (data || []).reverse();
    console.log(`📚 Loaded ${history.length} recent messages`);
    return history;
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};

/**
 * Generate a unique conversation ID
 */
export const generateConversationId = (): string => {
  return crypto.randomUUID();
};
