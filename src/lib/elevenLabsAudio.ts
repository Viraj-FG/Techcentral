import { supabase } from "@/integrations/supabase/client";
import { voiceLog } from "@/lib/voiceLogger";

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
  const timer = voiceLog.startTimer();
  
  voiceLog.info('connection', 'Requesting signed URL from edge function', { agentId });
  console.log('Requesting signed URL for agent:', agentId);
  
  try {
    const { data, error } = await supabase.functions.invoke("generate-signed-url", {
      body: { agentId }
    });
    
    if (error) {
      voiceLog.error('connection', 'Signed URL request failed', {
        agentId,
        error: error.message,
        duration: timer.elapsed()
      });
      console.error('Error getting signed URL:', error);
      throw error;
    }
    
    if (!data?.signed_url) {
      voiceLog.error('connection', 'No signed URL in response', {
        agentId,
        duration: timer.elapsed()
      });
      throw new Error("Failed to get signed URL");
    }

    voiceLog.info('connection', 'Signed URL received successfully', {
      agentId,
      duration: timer.elapsed(),
      urlLength: data.signed_url?.length
    });
    console.log('Signed URL received successfully');
    
    return data.signed_url;
  } catch (error) {
    voiceLog.logError('connection', 'Exception in getSignedUrl', error);
    throw error;
  }
}
