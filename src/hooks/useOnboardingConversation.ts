import { useRef, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { calculateTDEE } from "@/lib/tdeeCalculator";
import { saveOnboardingData } from "@/lib/onboardingSave";
import { transformProfileData, ConversationState } from "@/lib/onboardingTransforms";
import { supabase } from "@/integrations/supabase/client";
import { logConversationEvent, generateConversationId } from "@/lib/conversationLogger";

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
  const conversationIdRef = useRef<string>(generateConversationId());

  useEffect(() => {
    stateRef.current = conversationState;
  }, [conversationState]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs connected");
      setApertureState("listening");
      
      // Log session start
      logConversationEvent({
        conversationId: conversationIdRef.current,
        agentType: 'onboarding',
        eventType: 'session_start',
        eventData: { timestamp: new Date().toISOString() },
        role: 'system'
      });
      
      toast({
        title: "Connected",
        description: "Kaeva is ready to guide you",
      });
    },
    onDisconnect: () => {
      console.log("ElevenLabs disconnected");
      setApertureState("idle");
      
      // Log session end
      logConversationEvent({
        conversationId: conversationIdRef.current,
        agentType: 'onboarding',
        eventType: 'session_end',
        eventData: { timestamp: new Date().toISOString() },
        role: 'system'
      });
    },
    onMessage: (message) => {
      console.log("ElevenLabs message:", message);
      
      if (message.source === "user") {
        setUserTranscript(message.message || "");
        setShowSubtitles(true);
        setApertureState("thinking");
        
        // Log user transcript
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'user_transcript',
          eventData: { text: message.message },
          role: 'user'
        });
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
        
        // Log agent transcript
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'agent_transcript',
          eventData: { text: message.message },
          role: 'assistant'
        });
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
      updateProfile: async (parameters: { field: string; value: any }) => {
        console.log("✅ Profile field update:", parameters.field, parameters.value);
        
        // Log tool call
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'tool_call',
          eventData: { 
            tool_name: 'updateProfile',
            parameters 
          },
          role: 'assistant'
        });
        
        try {
          let result = "";
          
          // 1. Update local state first (for UI feedback)
          if (parameters.field === 'userBiometrics') {
            const tdee = calculateTDEE(parameters.value);
            setConversationState(prev => ({
              ...prev,
              userBiometrics: { ...parameters.value, calculatedTDEE: tdee }
            }));
            result = `Biometrics saved. Your baseline is ${tdee} calories per day.`;
          } else if (parameters.field === 'householdMembers') {
            setConversationState(prev => ({
              ...prev,
              householdMembers: parameters.value
            }));
            result = `Household roster updated. ${parameters.value.length} members registered.`;
          } else {
            setConversationState(prev => ({
              ...prev,
              [parameters.field]: parameters.value
            }));
            result = "Profile updated";
          }
          
          // 2. Persist to database immediately
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            console.warn("No session found, skipping DB save");
            return result;
          }
          
          let updateData: any = {};
          
          switch (parameters.field) {
            case "userName":
              updateData.user_name = parameters.value;
              break;
            case "userBiometrics":
              const tdee = calculateTDEE(parameters.value);
              updateData = {
                user_age: parameters.value.age,
                user_weight: parameters.value.weight,
                user_height: parameters.value.height,
                user_gender: parameters.value.gender,
                user_activity_level: parameters.value.activityLevel,
                calculated_tdee: tdee
              };
              break;
            case "dietaryValues":
              updateData.dietary_preferences = parameters.value;
              break;
            case "allergies":
              updateData.allergies = parameters.value;
              break;
            case "beautyProfile":
              updateData.beauty_profile = parameters.value;
              break;
            case "householdMembers":
              // Use batch insert RPC for household members
              const { error: batchError } = await supabase.rpc('insert_household_batch', {
                p_user_id: session.user.id,
                p_members: parameters.value,
                p_pets: []
              });
              
              if (batchError) {
                console.error("Batch insert error:", batchError);
                throw batchError;
              }
              
              result = `Household members saved (${parameters.value.length} members)`;
              
              // Log tool response
              logConversationEvent({
                conversationId: conversationIdRef.current,
                agentType: 'onboarding',
                eventType: 'tool_response',
                eventData: { 
                  tool_name: 'updateProfile',
                  result 
                },
                role: 'system'
              });
              
              return result;
            case "healthGoals":
              updateData.health_goals = parameters.value;
              break;
            case "lifestyleGoals":
              updateData.lifestyle_goals = parameters.value;
              break;
          }
          
          if (Object.keys(updateData).length > 0) {
            const { error } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', session.user.id);
            
            if (error) {
              console.error("Profile update error:", error);
              throw error;
            }
            
            console.log(`💾 Saved ${parameters.field} to database`);
          }
          
          // Log tool response
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'onboarding',
            eventType: 'tool_response',
            eventData: { 
              tool_name: 'updateProfile',
              result 
            },
            role: 'system'
          });
          
          return result;
        } catch (error) {
          console.error("updateProfile error:", error);
          const errorResult = `ERROR: ${error instanceof Error ? error.message : "Failed to update"}`;
          
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'onboarding',
            eventType: 'tool_response',
            eventData: { 
              tool_name: 'updateProfile',
              result: errorResult,
              error: true
            },
            role: 'system'
          });
          
          return errorResult;
        }
      },
      completeConversation: async (parameters: { reason: string }) => {
        console.log("🎉 Completing onboarding:", parameters.reason);
        
        // Log tool call
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'tool_call',
          eventData: { 
            tool_name: 'completeConversation',
            parameters 
          },
          role: 'assistant'
        });
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            return "ERROR: Not authenticated";
          }
          
          // 1. Mark onboarding as complete (data already saved incrementally)
          console.log("✅ Marking onboarding as complete");
          const { error } = await supabase
            .from('profiles')
            .update({ onboarding_completed: true })
            .eq('id', session.user.id);
            
          if (error) {
            console.error("Failed to mark onboarding complete:", error);
            throw error;
          }
          
          // 2. Log completion to conversation_history
          await supabase.from('conversation_history').insert([{
            conversation_id: conversationIdRef.current,
            role: 'system',
            message: 'Onboarding completed successfully',
            user_id: session.user.id,
            metadata: { 
              reason: parameters.reason,
              timestamp: new Date().toISOString()
            }
          }]);
          
          // 3. End ElevenLabs session
          if (conversation.status === "connected") {
            console.log("Ending ElevenLabs session");
            await conversation.endSession();
          }
          
          // 4. Update UI states
          setApertureState("idle");
          setShowSubtitles(false);
          setUserTranscript("");
          setAiTranscript("");
          
          console.log("Showing summary screen");
          setShowSummary(true);
          
          const successResult = "SUCCESS: Onboarding complete, showing summary";
          
          // Log tool response
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'onboarding',
            eventType: 'tool_response',
            eventData: { 
              tool_name: 'completeConversation',
              result: successResult 
            },
            role: 'system'
          });
          
          return successResult;
        } catch (error) {
          console.error("completeConversation error:", error);
          const errorResult = `ERROR: ${error instanceof Error ? error.message : "Unknown error"}`;
          
          // Log error response
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'onboarding',
            eventType: 'tool_response',
            eventData: { 
              tool_name: 'completeConversation',
              result: errorResult,
              error: true
            },
            role: 'system'
          });
          
          return errorResult;
        }
      },
      endConversation: async (parameters: { reason: string }) => {
        console.log("🚪 Ending conversation early:", parameters.reason);
        
        // Log tool call
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'tool_call',
          eventData: { 
            tool_name: 'endConversation',
            parameters 
          },
          role: 'assistant'
        });
        
        try {
          if (conversation.status === "connected") {
            await conversation.endSession();
          }
          
          setApertureState("idle");
          setShowSubtitles(false);
          setUserTranscript("");
          setAiTranscript("");
          
          const successResult = "SUCCESS: Conversation ended";
          
          // Log tool response
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'onboarding',
            eventType: 'tool_response',
            eventData: { 
              tool_name: 'endConversation',
              result: successResult 
            },
            role: 'system'
          });
          
          return successResult;
        } catch (error) {
          console.error("endConversation error:", error);
          const errorResult = `ERROR: ${error instanceof Error ? error.message : "Failed to end conversation"}`;
          
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'onboarding',
            eventType: 'tool_response',
            eventData: { 
              tool_name: 'endConversation',
              result: errorResult,
              error: true
            },
            role: 'system'
          });
          
          return errorResult;
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
