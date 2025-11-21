import { useState, useEffect, useRef, useCallback } from "react";
import { useConversation } from "@11labs/react";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      updateProfile: async (parameters: { field: string; value: any }) => {
        console.log("🔄 Update profile:", parameters.field, parameters.value);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return "Profile update failed - not authenticated";

          // Map field names to database columns
          const fieldMap: Record<string, string> = {
            userName: 'user_name',
            dietaryValues: 'dietary_preferences',
            beautyProfile: 'beauty_profile',
            healthGoals: 'health_goals',
            lifestyleGoals: 'lifestyle_goals',
            household: 'household_adults' // Will handle separately
          };

          const dbField = fieldMap[parameters.field] || parameters.field;
          const updateData: any = {};

          if (parameters.field === 'household') {
            // Handle household as a special case
            const household = parameters.value;
            updateData.household_adults = household.adults || 1;
            updateData.household_kids = household.kids || 0;

            // Save pets if any
            if (household.dogs || household.cats) {
              const pets = [];
              for (let i = 0; i < (household.dogs || 0); i++) {
                pets.push({
                  user_id: session.user.id,
                  species: 'Dog',
                  name: `Dog ${i + 1}`,
                  toxic_flags_enabled: true
                });
              }
              for (let i = 0; i < (household.cats || 0); i++) {
                pets.push({
                  user_id: session.user.id,
                  species: 'Cat',
                  name: `Cat ${i + 1}`,
                  toxic_flags_enabled: true
                });
              }
              if (pets.length > 0) {
                await supabase.from('pets').insert(pets);
              }
            }
          } else {
            updateData[dbField] = parameters.value;
          }

          const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', session.user.id);

          if (error) throw error;

          // Trigger callback if provided
          if (onProfileUpdate) {
            onProfileUpdate({ ...userProfile, ...updateData });
          }

          return "Profile updated successfully";
        } catch (error) {
          console.error("Profile update error:", error);
          return "Profile update failed";
        }
      },
      completeConversation: () => {
        console.log("🎯 Complete conversation");
        endConversation();
        return "Conversation ended";
      },
      navigateTo: (parameters: { page: string }) => {
        console.log("🧭 Navigate to:", parameters.page);
        // Could implement navigation logic here
        return `Navigating to ${parameters.page}`;
      }
    }
  });

  // Store message to database
  const storeMessage = async (role: "user" | "assistant", message: string) => {
    if (!currentConversationIdRef.current || !message.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('conversation_history')
        .insert({
          user_id: session.user.id,
          conversation_id: currentConversationIdRef.current,
          role,
          message: message.trim()
        });

      if (error) {
        console.error("Failed to store message:", error);
      } else {
        console.log(`✅ Stored ${role} message`);
      }
    } catch (error) {
      console.error("Error storing message:", error);
    }
  };

  // Fetch recent conversation history
  const fetchRecentHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];

      const { data, error } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10); // Last 10 messages

      if (error) {
        console.error("Failed to fetch history:", error);
        return [];
      }

      // Reverse to get chronological order
      const history = (data || []).reverse();
      console.log(`📚 Loaded ${history.length} recent messages`);
      setConversationHistory(history);
      return history;
    } catch (error) {
      console.error("Error fetching history:", error);
      return [];
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
      // Generate new conversation ID
      currentConversationIdRef.current = crypto.randomUUID();
      console.log("🆔 Conversation ID:", currentConversationIdRef.current);

      // Fetch recent conversation history
      const recentHistory = await fetchRecentHistory();

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
