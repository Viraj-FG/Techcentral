import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useConversation } from "@11labs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { useNavigate } from "react-router-dom";
import { storeMessage as storeMessageUtil, generateConversationId } from "@/lib/conversationUtils";
import { createUpdateProfileTool, createCompleteConversationTool, createNavigateToTool } from "@/lib/voiceClientTools";
import {
  createCheckInventoryTool,
  createAddToCartTool,
  createLogMealTool,
  createSearchRecipesTool,
  createCheckAllergensTool,
} from "@/lib/assistantClientTools";

type VoiceMode = "onboarding" | "assistant";
type VoiceState = "idle" | "active" | "speaking";
type ApertureState = "idle" | "listening" | "thinking" | "speaking";

interface UseVoiceConversationProps {
  mode: VoiceMode;
  userProfile?: any;
  onProfileUpdate?: (profile: any) => void;
  onComplete?: (profile?: any) => void;
}

export const useVoiceConversation = ({
  mode,
  userProfile,
  onProfileUpdate,
  onComplete
}: UseVoiceConversationProps) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showConversation, setShowConversation] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);

  const { toast } = useToast();
  const navigate = useNavigate();
  
  const currentConversationIdRef = useRef<string>("");
  const conversationRef = useRef<any>(null);

  // Stable endConversation that accesses latest conversation via ref
  const endConversation = useCallback(async () => {
    console.log("🔚 Ending conversation");
    
    try {
      if (conversationRef.current?.status === "connected") {
        await conversationRef.current.endSession();
      }

      currentConversationIdRef.current = "";
      setUserTranscript("");
      setAiTranscript("");
      setShowConversation(false);
      setVoiceState("idle");
      setApertureState("idle");
      setAudioAmplitude(0);
    } catch (error) {
      console.error("Error ending conversation:", error);
    }
  }, []);

  // Memoize clientTools to prevent recreation on every render
  const clientTools = useMemo(() => {
    const isOnboarding = mode === "onboarding";
    
    if (isOnboarding) {
      return {
        // Onboarding tools with immediate persistence
        updateProfile: createUpdateProfileTool(onProfileUpdate),
        completeConversation: createCompleteConversationTool(
          async () => {
            if (conversationRef.current?.status === "connected") {
              await conversationRef.current.endSession();
            }
          },
          {
            setShowConversation,
            setUserTranscript,
            setAiTranscript,
            setVoiceState,
            setApertureState,
          },
          (reason: string) => {
            console.log("✅ Onboarding complete:", reason);
            // Mark onboarding as complete in database
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session?.user) {
                supabase
                  .from('profiles')
                  .update({ onboarding_completed: true })
                  .eq('id', session.user.id)
                  .then(() => {
                    if (onComplete) onComplete();
                  });
              }
            });
          }
        ),
        endConversation: async (parameters: { reason: string }) => {
          console.log("🔚 End conversation called:", parameters.reason);
          await endConversation();
          return "SUCCESS: Conversation ended";
        },
        navigateTo: createNavigateToTool(navigate)
      };
    } else {
      return {
        // Assistant tools
        check_inventory: createCheckInventoryTool(),
        add_to_cart: createAddToCartTool(),
        log_meal: createLogMealTool(),
        search_recipes: createSearchRecipesTool(),
        check_allergens: createCheckAllergensTool(),
        navigateTo: createNavigateToTool(navigate),
        end_conversation: async (parameters: { reason: string }) => {
          console.log("🔚 End conversation called:", parameters.reason);
          await endConversation();
          return "SUCCESS: Conversation ended";
        }
      };
    }
  }, [mode, endConversation, navigate, onProfileUpdate, onComplete]);

  const conversation = useConversation({
    onConnect: () => console.log("🔌 Connected to ElevenLabs"),
    onDisconnect: () => {
      console.log("🔌 Disconnected from ElevenLabs");
      setVoiceState("idle");
      setApertureState("idle");
    },
    onError: (error) => {
      console.error("❌ ElevenLabs error:", error);
      toast({
        title: "Connection Error",
        description: "Voice connection failed. Please try again.",
        variant: "destructive"
      });
      endConversation();
    },
    onMessage: (message) => {
      console.log("📨 Message received:", message);

      if (message.source === "user") {
        setUserTranscript(message.message);
        storeMessage("user", message.message);
      } else if (message.source === "ai") {
        setAiTranscript(message.message);
        storeMessage("assistant", message.message);
      }
    },
    clientTools
  });

  // Keep ref in sync with conversation
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Store message wrapper
  const storeMessage = (role: string, message: string) => {
    if (currentConversationIdRef.current) {
      storeMessageUtil(role, message, currentConversationIdRef.current);
    }
  };

  // Monitor conversation speaking state
  useEffect(() => {
    if (conversation.isSpeaking) {
      setVoiceState("speaking");
      setApertureState("speaking");
      setAudioAmplitude(0.8);
    } else if (conversation.status === "connected") {
      setVoiceState("active");
      setApertureState("listening");
      setAudioAmplitude(0);
    }
  }, [conversation.isSpeaking, conversation.status]);

  const startConversation = useCallback(async () => {
    console.log("🚀 Starting conversation in", mode, "mode");
    setShowConversation(true);
    setVoiceState("active");
    setApertureState("thinking");

    try {
      currentConversationIdRef.current = generateConversationId();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const agentId = mode === "onboarding"
        ? ELEVENLABS_CONFIG.onboarding.agentId 
        : ELEVENLABS_CONFIG.assistant.agentId;
      
      console.log('🔗 Connecting to agent:', agentId, 'Mode:', mode);

      const signedUrl = await getSignedUrl(agentId);

      // Log conversation start
      await supabase.from('conversation_events').insert({
        conversation_id: currentConversationIdRef.current,
        user_id: session.user.id,
        agent_type: mode,
        event_type: 'session_start',
        role: 'system',
        event_data: { agent_id: agentId, mode }
      });

      await conversationRef.current.startSession({ signedUrl });
      setApertureState("listening");
    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
      toast({
        title: "Connection Failed",
        description: "Could not start voice conversation",
        variant: "destructive"
      });
      endConversation();
    }
  }, [mode, endConversation, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current?.status === "connected") {
        conversationRef.current.endSession();
      }
    };
  }, []);

  return {
    conversation,
    voiceState,
    apertureState,
    audioAmplitude,
    userTranscript,
    aiTranscript,
    showConversation,
    startConversation,
    endConversation
  };
};
