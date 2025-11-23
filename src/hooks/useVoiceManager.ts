import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { useNavigate } from "react-router-dom";
import { storeMessage as storeMessageUtil, fetchRecentHistory, generateConversationId } from "@/lib/conversationUtils";
import { createUpdateProfileTool, createCompleteConversationTool, createNavigateToTool } from "@/lib/voiceClientTools";

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

  // ElevenLabs conversation hook
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
    clientTools: {
      updateProfile: createUpdateProfileTool(onProfileUpdate),
      completeConversation: async (parameters: { reason: string }) => {
        console.log("🎯 Complete conversation:", parameters.reason);
        
        try {
          await conversation.endSession();
          
          setShowConversation(false);
          setUserTranscript("");
          setAiTranscript("");
          setVoiceState("idle");
          setApertureState("idle");
          
          if (parameters.reason === "onboarding_complete") {
            toast({
              title: "Onboarding Complete!",
              description: "Welcome to your Kaeva dashboard",
            });
          }
          
          return "SUCCESS: Conversation ended";
        } catch (error) {
          console.error("completeConversation error:", error);
          return `ERROR: ${error instanceof Error ? error.message : "Failed to complete"}`;
        }
      },
      endConversation: async (parameters: { reason: string }) => {
        console.log("🔚 End conversation called:", parameters.reason);
        
        try {
          await conversation.endSession();
          
          setShowConversation(false);
          setUserTranscript("");
          setAiTranscript("");
          setVoiceState("idle");
          setApertureState("idle");
          
          if (parameters.reason === "user_exit") {
            toast({
              title: "Conversation Ended",
              description: "You can continue onboarding anytime",
            });
          }
          
          return "SUCCESS: Conversation ended by user";
        } catch (error) {
          console.error("endConversation error:", error);
          return `ERROR: ${error instanceof Error ? error.message : "Failed to end"}`;
        }
      },
      navigateTo: createNavigateToTool(navigate)
    }
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
      const recentHistory = await fetchRecentHistory();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      // Fetch context data
      const { data: householdMembers } = await supabase
        .from('household_members')
        .select('*')
        .eq('user_id', session.user.id);

      const { data: pets } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', session.user.id);

      const { data: inventory } = await supabase
        .from('inventory')
        .select('name, category, quantity, unit, status, expiry_date')
        .eq('user_id', session.user.id)
        .order('last_activity_at', { ascending: false })
        .limit(20);

      const agentId = ELEVENLABS_CONFIG.agentId;
      console.log('🔗 Connecting to agent:', agentId);
      const signedUrl = await getSignedUrl(agentId);
      
      const isOnboardingComplete = userProfile?.onboarding_completed;
      const mode = isOnboardingComplete ? "assistant" : "onboarding";
      
      console.log(`🤖 Starting in ${mode} mode`);

      // Build dynamic variables for assistant mode
      const variables: Record<string, string> = {};
      if (mode === "assistant") {
        variables.user_name = userProfile.user_name || 'User';
        variables.calculated_tdee = userProfile.calculated_tdee?.toString() || 'Not calculated';
        variables.allergies = JSON.stringify(userProfile.allergies || []);
        variables.household_summary = householdMembers?.map(m => 
          `${m.name || m.member_type} (${m.age_group}): ${JSON.stringify(m.allergies || [])}`
        ).join(', ') || 'None';
        variables.pets_summary = pets?.map(p => 
          `${p.name} (${p.species})`
        ).join(', ') || 'None';
        variables.recent_inventory = inventory?.slice(0, 10).map(i => 
          `${i.name} (${i.quantity} ${i.unit || ''})`
        ).join(', ') || 'No inventory';
      }

      await conversation.startSession({ 
        signedUrl,
        ...(mode === "assistant" ? { variables } : {})
      });

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
  }, [userProfile, onProfileUpdate, conversation, endConversation]);

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
