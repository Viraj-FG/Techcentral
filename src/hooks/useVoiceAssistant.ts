import { useState, useEffect, useRef, useCallback } from "react";
import { useConversation } from "@11labs/react";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { storeMessage as storeMessageUtil, fetchRecentHistory, generateConversationId } from "@/lib/conversationUtils";
import { createUpdateProfileTool } from "@/lib/voiceClientTools";

type VoiceState = "sleeping" | "listening" | "thinking" | "speaking";
type ApertureState = "idle" | "wakeword" | "listening" | "thinking" | "speaking";

interface UseVoiceAssistantProps {
  userProfile: any;
  onProfileUpdate?: (profile: any) => void;
}

export const useVoiceAssistant = ({ userProfile, onProfileUpdate }: UseVoiceAssistantProps) => {
  const { toast } = useToast();
  const [voiceState, setVoiceState] = useState<VoiceState>("sleeping");
  const [apertureState, setApertureState] = useState<ApertureState>("wakeword");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showConversation, setShowConversation] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const currentConversationIdRef = useRef<string | null>(null);

  // ElevenLabs Conversation
  const conversation = useConversation({
    onConnect: () => {
      console.log("✅ ElevenLabs connected");
      setVoiceState("listening");
      setApertureState("listening");
    },
    onDisconnect: () => {
      console.log("❌ ElevenLabs disconnected");
      returnToSleeping();
    },
    onMessage: async (message) => {
      console.log("📩 Message:", message);
      
      if (message.source === "user") {
        setUserTranscript(message.message || "");
        setVoiceState("thinking");
        setApertureState("thinking");
        
        // Store user message
        await storeMessage("user", message.message || "");
      }
      
      if (message.source === "ai") {
        setAiTranscript(message.message || "");
        setVoiceState("speaking");
        
        // Store AI message
        await storeMessage("assistant", message.message || "");
      }
    },
    onError: (error) => {
      console.error("❌ ElevenLabs error:", error);
      toast({
        title: "Connection Error",
        description: "Voice service error. Returning to sleep mode.",
        variant: "destructive"
      });
      returnToSleeping();
    },
    clientTools: {
      updateProfile: createUpdateProfileTool(onProfileUpdate),
      completeConversation: () => {
        console.log("🎯 Complete conversation");
        endConversation();
        return "Conversation ended";
      },
      navigateTo: (parameters: { page: string }) => {
        console.log("🧭 Navigate to:", parameters.page);
        return `Navigating to ${parameters.page}`;
      }
    }
  });

  // Store message wrapper
  const storeMessage = (role: "user" | "assistant", message: string) => {
    if (currentConversationIdRef.current) {
      storeMessageUtil(role, message, currentConversationIdRef.current);
    }
  };

  // Track speaking state
  useEffect(() => {
    if (conversation.isSpeaking) {
      setApertureState("speaking");
      setVoiceState("speaking");
      
      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    } else if (conversation.status === "connected" && voiceState !== "thinking") {
      setApertureState("listening");
      setVoiceState("listening");
      
      // Start silence timeout (5 seconds after speaking ends)
      silenceTimeoutRef.current = setTimeout(() => {
        console.log("⏱️ Silence timeout - ending conversation");
        endConversation();
      }, 5000);
    }
  }, [conversation.isSpeaking, conversation.status]);

  // Wake word detection
  const startWakeWordDetection = useCallback(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("⚠️ Speech recognition not supported");
      return;
    }

    if (recognitionRef.current) {
      console.log("🔄 Wake word detection already running");
      return;
    }

    console.log("👂 Starting wake word detection");
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("✅ Wake word detection active");
      setIsWakeWordActive(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      console.log("🎤 Heard:", transcript);
      
      if (transcript.includes('kaeva') || transcript.includes('hey kaeva')) {
        console.log("✨ Wake word detected!");
        stopWakeWordDetection();
        startConversation();
      }
    };

    recognition.onerror = (event: any) => {
      console.error("❌ Wake word error:", event.error);
      if (event.error === 'no-speech') {
        // Restart on no-speech error
        setTimeout(() => {
          if (voiceState === "sleeping") {
            startWakeWordDetection();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log("🔚 Wake word detection ended");
      setIsWakeWordActive(false);
      // Auto-restart if still in sleeping state
      if (voiceState === "sleeping") {
        setTimeout(() => startWakeWordDetection(), 1000);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error("Failed to start recognition:", error);
    }
  }, [voiceState]);

  const stopWakeWordDetection = useCallback(() => {
    if (recognitionRef.current) {
      console.log("🛑 Stopping wake word detection");
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
      recognitionRef.current = null;
      setIsWakeWordActive(false);
    }
  }, []);

  const startConversation = useCallback(async () => {
    console.log("🚀 Starting conversation");
    stopWakeWordDetection();
    setShowConversation(true);
    setVoiceState("thinking");
    setApertureState("thinking");

    try {
      currentConversationIdRef.current = generateConversationId();
      console.log("🆔 Conversation ID:", currentConversationIdRef.current);

      const recentHistory = await fetchRecentHistory();
      setConversationHistory(recentHistory);

      const agentId = "agent_0501kakwnx5rffaby5rx9y1pskkb";
      const signedUrl = await getSignedUrl(agentId);
      
      // Determine mode based on onboarding status
      const isOnboardingComplete = userProfile?.onboarding_completed;
      const mode = isOnboardingComplete ? "assistant" : "onboarding";
      
      console.log(`🤖 Starting in ${mode} mode`);

      // Build context with recent history
      let contextPrompt = "";
      if (mode === "assistant") {
        contextPrompt = `You are Kaeva in ASSISTANT MODE. User profile: ${JSON.stringify(userProfile)}.`;
        
        if (recentHistory.length > 0) {
          contextPrompt += "\n\nRECENT CONVERSATION HISTORY (for context):\n";
          recentHistory.forEach((msg: any) => {
            contextPrompt += `${msg.role === "user" ? "User" : "Kaeva"}: ${msg.message}\n`;
          });
          contextPrompt += "\nUse this history to provide contextual responses. Reference past conversations naturally.";
        }
        
        contextPrompt += "\n\nHelp the user with questions, profile updates, or navigation. Call completeConversation() when they're done.";
      } else {
        contextPrompt = "You are Kaeva in ONBOARDING MODE. New user - follow the structured interview to collect all required information.";
      }

      await conversation.startSession({ 
        signedUrl,
        overrides: {
          agent: {
            prompt: {
              prompt: contextPrompt
            }
          }
        }
      });
    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
      toast({
        title: "Connection Failed",
        description: "Could not start conversation. Please try again.",
        variant: "destructive"
      });
      returnToSleeping();
    }
  }, [userProfile, conversation, toast, fetchRecentHistory]);

  const endConversation = useCallback(() => {
    console.log("🔚 Ending conversation");
    
    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    if (conversation.status === "connected") {
      conversation.endSession();
    }

    // Clear current conversation ID
    currentConversationIdRef.current = null;

    setUserTranscript("");
    setAiTranscript("");
    setShowConversation(false);
    
    // Return to sleeping mode after a brief delay
    setTimeout(() => {
      returnToSleeping();
    }, 500);
  }, [conversation]);

  const returnToSleeping = useCallback(() => {
    console.log("😴 Returning to sleeping mode");
    setVoiceState("sleeping");
    setApertureState("wakeword");
    setShowConversation(false);
    setUserTranscript("");
    setAiTranscript("");
    
    // Restart wake word detection
    setTimeout(() => {
      startWakeWordDetection();
    }, 1000);
  }, [startWakeWordDetection]);

  // Initialize wake word detection on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startWakeWordDetection();
    }, 2000); // 2 second delay after mount

    return () => {
      clearTimeout(timer);
      stopWakeWordDetection();
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  return {
    voiceState,
    apertureState,
    userTranscript,
    aiTranscript,
    showConversation,
    isWakeWordActive,
    conversationHistory,
    startConversation,
    endConversation
  };
};
