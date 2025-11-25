import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { useNavigate } from "react-router-dom";
import { generateConversationId, storeMessage } from "@/lib/conversationUtils";
import { logConversationEvent } from "@/lib/conversationLogger";
import { calculateTDEE } from "@/lib/tdeeCalculator";

type ApertureState = "idle" | "listening" | "thinking" | "speaking";

interface UseOnboardingVoiceProps {
  onProfileUpdate?: (profile: any) => void;
  onComplete?: () => void;
}

export const useOnboardingVoice = ({ onProfileUpdate, onComplete }: UseOnboardingVoiceProps) => {
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showConversation, setShowConversation] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);

  const { toast } = useToast();
  const navigate = useNavigate();
  const conversationIdRef = useRef<string>("");
  const audioIntervalRef = useRef<NodeJS.Timeout>();

  // Define clientTools INLINE to avoid stale closures
  const conversation = useConversation({
    onConnect: () => {
      console.log("🔌 Onboarding agent connected");
      logConversationEvent({
        conversationId: conversationIdRef.current,
        agentType: 'onboarding',
        eventType: 'session_start',
        eventData: { timestamp: new Date().toISOString() }
      });
    },
    onDisconnect: () => {
      console.log("🔌 Onboarding agent disconnected");
      setApertureState("idle");
      logConversationEvent({
        conversationId: conversationIdRef.current,
        agentType: 'onboarding',
        eventType: 'session_end',
        eventData: { timestamp: new Date().toISOString() }
      });
    },
    onError: (error) => {
      console.error("❌ Onboarding agent error:", error);
      toast({
        title: "Connection Error",
        description: "Voice connection failed. Please try again.",
        variant: "destructive"
      });
      endConversation();
    },
    onMessage: (message) => {
      console.log("📨 Onboarding message:", message);
      
      if (message.source === "user") {
        setUserTranscript(message.message);
        storeMessage("user", message.message, conversationIdRef.current);
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'user_transcript',
          eventData: { message: message.message },
          role: 'user'
        });
      } else if (message.source === "ai") {
        setAiTranscript(message.message);
        storeMessage("assistant", message.message, conversationIdRef.current);
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'agent_transcript',
          eventData: { message: message.message },
          role: 'assistant'
        });
      }
    },
    
    // CLIENT TOOLS DEFINED INLINE - No stale closures!
    clientTools: {
      updateProfile: async (parameters: {
        userName?: string;
        userAge?: number;
        userWeight?: number;
        userHeight?: number;
        userGender?: string;
        userActivityLevel?: string;
        dietaryPreferences?: string[];
        allergies?: string[];
        skinType?: string;
        hairType?: string;
        householdAdults?: number;
        householdKids?: number;
        healthGoals?: string[];
        lifestyleGoals?: string[];
      }) => {
        console.log("🔧 updateProfile called:", parameters);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            console.error("No session for updateProfile");
            return "ERROR: Not authenticated";
          }

          // Calculate TDEE if biometrics provided
          let calculatedTdee = null;
          if (parameters.userAge && parameters.userWeight && parameters.userHeight && 
              parameters.userGender && parameters.userActivityLevel) {
            calculatedTdee = calculateTDEE({
              age: parameters.userAge,
              weight: parameters.userWeight,
              height: parameters.userHeight,
              gender: parameters.userGender as any,
              activityLevel: parameters.userActivityLevel as any
            });
          }

          // Build update object
          const updateData: any = {
            updated_at: new Date().toISOString()
          };

          if (parameters.userName) updateData.user_name = parameters.userName;
          if (parameters.userAge) updateData.user_age = parameters.userAge;
          if (parameters.userWeight) updateData.user_weight = parameters.userWeight;
          if (parameters.userHeight) updateData.user_height = parameters.userHeight;
          if (parameters.userGender) updateData.user_gender = parameters.userGender;
          if (parameters.userActivityLevel) updateData.user_activity_level = parameters.userActivityLevel;
          if (calculatedTdee) updateData.calculated_tdee = calculatedTdee;
          if (parameters.dietaryPreferences) updateData.dietary_preferences = parameters.dietaryPreferences;
          if (parameters.allergies) updateData.allergies = parameters.allergies;
          if (parameters.healthGoals) updateData.health_goals = parameters.healthGoals;
          if (parameters.lifestyleGoals) updateData.lifestyle_goals = parameters.lifestyleGoals;
          if (parameters.householdAdults) updateData.household_adults = parameters.householdAdults;
          if (parameters.householdKids) updateData.household_kids = parameters.householdKids;
          
          if (parameters.skinType || parameters.hairType) {
            updateData.beauty_profile = {
              skinType: parameters.skinType || null,
              hairType: parameters.hairType || null
            };
          }

          // Save to database IMMEDIATELY
          const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', session.user.id);

          if (error) {
            console.error("❌ updateProfile error:", error);
            return `ERROR: ${error.message}`;
          }

          console.log("✅ Profile updated in database:", updateData);
          
          // Log tool call
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'onboarding',
            eventType: 'tool_call',
            eventData: { tool: 'updateProfile', parameters, result: 'success' }
          });

          // Callback for local state update
          if (onProfileUpdate) {
            onProfileUpdate(updateData);
          }

          return "SUCCESS: Profile updated";
        } catch (error) {
          console.error("❌ updateProfile exception:", error);
          return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },

      completeConversation: async (parameters: { summary: string }) => {
        console.log("🎉 completeConversation called:", parameters);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            return "ERROR: Not authenticated";
          }

          // Create household if doesn't exist
          const { data: profile } = await supabase
            .from('profiles')
            .select('current_household_id, user_name')
            .eq('id', session.user.id)
            .single();

          if (!profile?.current_household_id) {
            const householdName = `${profile?.user_name || 'My'} Household`;
            
            const { data: household, error: householdError } = await supabase
              .from('households')
              .insert({
                owner_id: session.user.id,
                name: householdName
              })
              .select()
              .single();

            if (!householdError && household) {
              await supabase
                .from('profiles')
                .update({ current_household_id: household.id })
                .eq('id', session.user.id);
              
              console.log("✅ Household created:", household.id);
            }
          }

          // Mark onboarding complete
          const { error } = await supabase
            .from('profiles')
            .update({ 
              onboarding_completed: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);

          if (error) {
            console.error("❌ completeConversation error:", error);
            return `ERROR: ${error.message}`;
          }

          console.log("✅ Onboarding marked complete");

          // Log completion
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'onboarding',
            eventType: 'tool_call',
            eventData: { tool: 'completeConversation', summary: parameters.summary }
          });

          // End session and trigger completion callback
          setTimeout(async () => {
            if (conversation.status === "connected") {
              await conversation.endSession();
            }
            if (onComplete) {
              onComplete();
            }
          }, 1000);

          return "SUCCESS: Onboarding completed";
        } catch (error) {
          console.error("❌ completeConversation exception:", error);
          return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },

      navigateTo: async (parameters: { route: string }) => {
        console.log("🧭 navigateTo called:", parameters);
        
        try {
          navigate(parameters.route);
          return `SUCCESS: Navigated to ${parameters.route}`;
        } catch (error) {
          console.error("❌ navigateTo error:", error);
          return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    }
  });

  // Real-time audio visualization from SDK
  useEffect(() => {
    if (conversation.status === "connected") {
      audioIntervalRef.current = setInterval(() => {
        if (conversation.isSpeaking) {
          const outputVolume = conversation.getOutputVolume?.() || 0;
          setAudioAmplitude(outputVolume);
        } else {
          const inputVolume = conversation.getInputVolume?.() || 0;
          setAudioAmplitude(inputVolume);
        }
      }, 50);
    } else {
      setAudioAmplitude(0);
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, [conversation.status, conversation.isSpeaking]);

  // Update aperture state based on conversation status
  useEffect(() => {
    if (conversation.isSpeaking) {
      setApertureState("speaking");
    } else if (conversation.status === "connected") {
      setApertureState("listening");
    } else {
      setApertureState("idle");
    }
  }, [conversation.isSpeaking, conversation.status]);

  const startConversation = useCallback(async () => {
    console.log("🚀 Starting onboarding conversation");
    setShowConversation(true);
    setApertureState("thinking");

    try {
      conversationIdRef.current = generateConversationId();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const signedUrl = await getSignedUrl(ELEVENLABS_CONFIG.onboarding.agentId);
      console.log("🤖 Starting onboarding agent");

      await conversation.startSession({ signedUrl });
      setApertureState("listening");
    } catch (error) {
      console.error("❌ Failed to start onboarding:", error);
      toast({
        title: "Connection Failed",
        description: "Could not start voice onboarding",
        variant: "destructive"
      });
      endConversation();
    }
  }, [conversation, toast]);

  const endConversation = useCallback(async () => {
    console.log("🔚 Ending onboarding conversation");
    
    if (conversation.status === "connected") {
      await conversation.endSession();
    }

    conversationIdRef.current = "";
    setUserTranscript("");
    setAiTranscript("");
    setShowConversation(false);
    setApertureState("idle");
    setAudioAmplitude(0);
  }, [conversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversation.status === "connected") {
        conversation.endSession();
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, []);

  return {
    apertureState,
    audioAmplitude,
    userTranscript,
    aiTranscript,
    showConversation,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    startConversation,
    endConversation
  };
};
