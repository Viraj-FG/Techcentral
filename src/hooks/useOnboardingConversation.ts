import { useRef, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { calculateTDEE } from "@/lib/tdeeCalculator";
import { saveOnboardingData } from "@/lib/onboardingSave";
import { transformProfileData, ConversationState } from "@/lib/onboardingTransforms";
import { supabase } from "@/integrations/supabase/client";

interface UseOnboardingConversationProps {
  conversationState: ConversationState;
  setConversationState: (state: ConversationState | ((prev: ConversationState) => ConversationState)) => void;
  setApertureState: (state: any) => void;
  setUserTranscript: (text: string) => void;
  setAiTranscript: (text: string) => void;
  setShowSubtitles: (show: boolean) => void;
  setActiveVertical: (vertical: "food" | "beauty" | "pets" | null) => void;
  setDetectedKeywords: (keywords: string[]) => void;
  setShowSummary: (show: boolean) => void;
  onComplete: (profile: any) => void;
  permissionsGranted: boolean;
}

export const useOnboardingConversation = ({
  conversationState,
  setConversationState,
  setApertureState,
  setUserTranscript,
  setAiTranscript,
  setShowSubtitles,
  setActiveVertical,
  setDetectedKeywords,
  setShowSummary,
  onComplete,
  permissionsGranted
}: UseOnboardingConversationProps) => {
  const { toast } = useToast();
  const stateRef = useRef(conversationState);

  useEffect(() => {
    stateRef.current = conversationState;
  }, [conversationState]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs connected");
      setApertureState("listening");
      toast({
        title: "Connected",
        description: "Kaeva is ready to guide you",
      });
    },
    onDisconnect: () => {
      console.log("ElevenLabs disconnected");
      setApertureState("idle");
    },
    onMessage: (message) => {
      console.log("ElevenLabs message:", message);
      
      if (message.source === "user") {
        setUserTranscript(message.message || "");
        setShowSubtitles(true);
        setApertureState("thinking");
      }
      
      if (message.source === "ai") {
        const text = message.message?.toLowerCase() || "";
        
        if (text.includes("skin") || text.includes("hair") || text.includes("beauty")) {
          setActiveVertical("beauty");
        } else if (text.includes("pet") || text.includes("dog") || text.includes("cat")) {
          setActiveVertical("pets");
        } else if (text.includes("diet") || text.includes("food") || text.includes("allergy")) {
          setActiveVertical("food");
        }
        
        const keywords = [];
        if (text.includes("vegan")) keywords.push("vegan");
        if (text.includes("halal")) keywords.push("halal");
        if (text.includes("dog")) keywords.push("dog");
        if (text.includes("cat")) keywords.push("cat");
        if (text.includes("skin") || text.includes("hair")) keywords.push("beauty");
        setDetectedKeywords(keywords);
        
        setAiTranscript(message.message || "");
        setShowSubtitles(true);
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to voice service",
        variant: "destructive"
      });
    },
    clientTools: {
      updateProfile: (parameters: { field: string; value: any }) => {
        console.log("✅ Profile field update:", parameters.field, parameters.value);
        
        if (parameters.field === 'userBiometrics') {
          const tdee = calculateTDEE(parameters.value);
          setConversationState(prev => ({
            ...prev,
            userBiometrics: { ...parameters.value, calculatedTDEE: tdee }
          }));
          return `Biometrics saved. Your baseline is ${tdee} calories per day.`;
        }
        
        if (parameters.field === 'householdMembers') {
          setConversationState(prev => ({
            ...prev,
            householdMembers: parameters.value
          }));
          return `Household roster updated. ${parameters.value.length} members registered.`;
        }
        
        setConversationState(prev => ({
          ...prev,
          [parameters.field]: parameters.value
        }));
        return "Profile updated";
      },
      completeConversation: async (parameters: { reason: string }) => {
        console.log("🎉 Completing onboarding:", parameters.reason);
        
        try {
          if (conversation.status === "connected") {
            console.log("Ending ElevenLabs session");
            await conversation.endSession();
          }
          
          setApertureState("idle");
          setShowSubtitles(false);
          setUserTranscript("");
          setAiTranscript("");
          
          console.log("Showing summary screen");
          setShowSummary(true);
          
          return "SUCCESS: Showing profile summary. User can now review and enter the dashboard.";
        } catch (error) {
          return `ERROR: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      },
      navigateTo: (parameters: { page: string }) => {
        console.log("📍 Navigation requested:", parameters.page);
        return `Navigation to ${parameters.page} noted`;
      }
    }
  });

  useEffect(() => {
    if (conversation.isSpeaking) {
      setApertureState("speaking");
    } else if (conversation.status === "connected") {
      setApertureState("listening");
    }
  }, [conversation.isSpeaking, conversation.status]);

  useEffect(() => {
    if (!permissionsGranted) return;

    const initConversation = async () => {
      try {
        setApertureState("thinking");
        
        const agentId = ELEVENLABS_CONFIG.onboarding.agentId;
        const signedUrl = await getSignedUrl(agentId);
        
        await conversation.startSession({ signedUrl });
      } catch (error) {
        console.error("Error starting conversation:", error);
        setApertureState("idle");
        toast({
          title: "Connection Error",
          description: "Failed to start conversation. Please try again.",
          variant: "destructive"
        });
      }
    };

    initConversation();

    return () => {
      if (conversation.status === "connected") {
        console.log("🧹 Cleanup: Disconnecting ElevenLabs on unmount");
        conversation.endSession();
      }
    };
  }, [permissionsGranted]);

  return { conversation };
};
