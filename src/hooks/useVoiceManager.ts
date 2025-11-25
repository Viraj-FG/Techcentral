import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { useNavigate } from "react-router-dom";
import { storeMessage as storeMessageUtil, fetchRecentHistory, generateConversationId } from "@/lib/conversationUtils";
import { createUpdateProfileTool, createCompleteConversationTool, createNavigateToTool } from "@/lib/voiceClientTools";
import {
  createCheckInventoryTool,
  createAddToCartTool,
  createLogMealTool,
  createSearchRecipesTool,
  createCheckAllergensTool,
} from "@/lib/assistantClientTools";

type VoiceState = "idle" | "active" | "speaking";
type ApertureState = "idle" | "listening" | "thinking" | "speaking";

interface UseVoiceManagerProps {
  userProfile: any;
  onProfileUpdate?: (profile: any) => void;
}

export const useVoiceManager = ({ userProfile, onProfileUpdate }: UseVoiceManagerProps) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showConversation, setShowConversation] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();
  
  const currentConversationIdRef = useRef<string>("");

  // Define endConversation early for use in callbacks
  const endConversation = useCallback(async () => {
    console.log("🔚 Ending conversation");
    
    if (conversation.status === "connected") {
      await conversation.endSession();
    }

    currentConversationIdRef.current = "";
    setUserTranscript("");
    setAiTranscript("");
    setShowConversation(false);
    setVoiceState("idle");
    setApertureState("idle");
    setAudioAmplitude(0);
  }, []);

  // ElevenLabs conversation hook with dynamic client tools
  const isOnboardingComplete = userProfile?.onboarding_completed;
  
  const clientTools = isOnboardingComplete ? {
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
  } : {
    // Onboarding tools
    updateProfile: createUpdateProfileTool(onProfileUpdate),
    completeConversation: createCompleteConversationTool(
      async () => {
        if (conversation.status === "connected") {
          await conversation.endSession();
        }
      },
      {
        setShowConversation,
        setUserTranscript,
        setAiTranscript,
        setVoiceState,
        setApertureState,
      }
    ),
    navigateTo: createNavigateToTool(navigate)
  };

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

  // Store message wrapper
  const storeMessage = (role: string, message: string) => {
    if (currentConversationIdRef.current) {
      storeMessageUtil(role, message, currentConversationIdRef.current);
    }
  };

  // === CONVERSATION STATE MANAGEMENT ===

  // Monitor conversation speaking state
  useEffect(() => {
    if (conversation.isSpeaking) {
      setVoiceState("speaking");
      setApertureState("speaking");
      setAudioAmplitude(0.8); // Visual feedback during speech
    } else if (conversation.status === "connected") {
      setVoiceState("active");
      setApertureState("listening");
      setAudioAmplitude(0);
    }
  }, [conversation.isSpeaking, conversation.status]);

  // === CONVERSATION CONTROL ===

  // Remove duplicate endConversation definition
  
  const startConversation = useCallback(async () => {
    console.log("🚀 Starting conversation");
    setShowConversation(true);
    setVoiceState("active");
    setApertureState("thinking");

    try {
      currentConversationIdRef.current = generateConversationId();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const isOnboardingComplete = userProfile?.onboarding_completed;
      const mode = isOnboardingComplete ? "assistant" : "onboarding";
      
      const agentId = isOnboardingComplete 
        ? ELEVENLABS_CONFIG.assistant.agentId 
        : ELEVENLABS_CONFIG.onboarding.agentId;
      
      console.log('🔗 Connecting to agent:', agentId, 'Mode:', mode);

      const signedUrl = await getSignedUrl(agentId);
      console.log(`🤖 Starting in ${mode} mode`);

      await conversation.startSession({ signedUrl });
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
  }, [userProfile, onProfileUpdate, conversation, endConversation, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversation.status === "connected") {
        conversation.endSession();
      }
    };
  }, []);

  return {
    voiceState,
    apertureState,
    audioAmplitude,
    userTranscript,
    aiTranscript,
    showConversation,
    conversationHistory,
    startConversation,
    endConversation
  };
};
