import { supabase } from "@/integrations/supabase/client";

export interface ConversationConfig {
  agentId: string;
  onMessage?: (message: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  clientTools?: Record<string, (parameters: any) => string | void>;
}

export async function getSignedUrl(agentId: string): Promise<string> {
  console.log('Requesting signed URL for agent:', agentId);
  
  const { data, error } = await supabase.functions.invoke("generate-signed-url", {
    body: { agentId }
  });
  
  if (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
  
  if (!data?.signed_url) {
    throw new Error("Failed to get signed URL");
  }

  console.log('Signed URL received successfully');
  return data.signed_url;
}
