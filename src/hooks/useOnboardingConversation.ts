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
      
      // Log session start (non-blocking)
      logConversationEvent({
        conversationId: conversationIdRef.current,
        agentType: 'onboarding',
        eventType: 'session_start',
        eventData: { timestamp: new Date().toISOString() },
        role: 'system'
      }).catch(err => console.warn('[Onboarding] Failed to log session start:', err));
      
      toast({
        title: "Connected",
        description: "Kaeva is ready to guide you",
      });
    },
    onDisconnect: () => {
      console.log("ElevenLabs disconnected");
      setApertureState("idle");
      
      // Log session end (non-blocking)
      logConversationEvent({
        conversationId: conversationIdRef.current,
        agentType: 'onboarding',
        eventType: 'session_end',
        eventData: { timestamp: new Date().toISOString() },
        role: 'system'
      }).catch(err => console.warn('[Onboarding] Failed to log session end:', err));
    },
    onMessage: (message) => {
      console.log("ElevenLabs message:", message);
      
      if (message.source === "user") {
        setUserTranscript(message.message || "");
        setShowSubtitles(true);
        setApertureState("thinking");
        
        // Log user transcript (non-blocking)
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'user_transcript',
          eventData: { text: message.message },
          role: 'user'
        }).catch(err => console.warn('[Onboarding] Failed to log user transcript:', err));
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
        
        // Log agent transcript (non-blocking)
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'agent_transcript',
          eventData: { text: message.message },
          role: 'assistant'
        }).catch(err => console.warn('[Onboarding] Failed to log agent transcript:', err));
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
        
        // Log tool call (non-blocking)
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'tool_call',
          eventData: { 
            tool_name: 'updateProfile',
            parameters 
          },
          role: 'assistant'
        }).catch(err => console.warn('[Onboarding] Failed to log tool call:', err));
        
        let result = "";
        
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
        
        // Log tool response (non-blocking)
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'tool_response',
          eventData: { 
            tool_name: 'updateProfile',
            result 
          },
          role: 'system'
        }).catch(err => console.warn('[Onboarding] Failed to log tool response:', err));
        
        return result;
      },
      completeConversation: async (parameters: { reason: string }) => {
        console.log("🎉 Completing onboarding:", parameters.reason);
        
        // Log tool call (non-blocking)
        logConversationEvent({
          conversationId: conversationIdRef.current,
          agentType: 'onboarding',
          eventType: 'tool_call',
          eventData: { 
            tool_name: 'completeConversation',
            parameters 
          },
          role: 'assistant'
        }).catch(err => console.warn('[Onboarding] Failed to log tool call:', err));
        
        try {
          // 1. Save onboarding data to database
          console.log("💾 Saving onboarding data...");
          const success = await saveOnboardingData(stateRef.current);
          
          if (!success) {
            console.error("❌ Failed to save onboarding data");
            
            // CRITICAL: Ensure onboarding_completed stays false on failure
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              await supabase
                .from('profiles')
                .update({ onboarding_completed: false })
                .eq('id', session.user.id);
            }
            
            return "ERROR: Failed to save onboarding data - let's try that again";
          }
          
          // 2. Mark onboarding as complete in database
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log("✅ Marking onboarding as complete in database");
            const { error } = await supabase
              .from('profiles')
              .update({ onboarding_completed: true })
              .eq('id', session.user.id);
              
            if (error) {
              console.error("Failed to mark onboarding complete:", error);
              return "ERROR: Failed to mark onboarding complete";
            }
            
            // 3. Log completion to conversation_history
            await supabase.from('conversation_history').insert([{
              conversation_id: crypto.randomUUID(),
              role: 'system',
              message: 'Onboarding completed successfully',
              user_id: session.user.id,
              metadata: { 
                reason: parameters.reason,
                timestamp: new Date().toISOString()
              }
            }]);
            
            console.log("✅ Onboarding completion logged");
          }
          
          // 4. End ElevenLabs session
          if (conversation.status === "connected") {
            console.log("Ending ElevenLabs session");
            await conversation.endSession();
          }
          
          // 5. Update UI states
          setApertureState("idle");
          setShowSubtitles(false);
          setUserTranscript("");
          setAiTranscript("");
          
          console.log("Showing summary screen");
          setShowSummary(true);
          
          const successResult = "SUCCESS: Onboarding complete, showing summary";
          
          // Log tool response (non-blocking)
          logConversationEvent({
            conversationId: conversationIdRef.current,
            agentType: 'onboarding',
            eventType: 'tool_response',
            eventData: { 
              tool_name: 'completeConversation',
              result: successResult 
            },
            role: 'system'
          }).catch(err => console.warn('[Onboarding] Failed to log tool response:', err));
          
          return successResult;
        } catch (error) {
          console.error("❌ completeConversation error:", error);
          
          // CRITICAL: Rollback on error
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase
              .from('profiles')
              .update({ onboarding_completed: false })
              .eq('id', session.user.id);
          }
          
          const errorResult = `ERROR: ${error instanceof Error ? error.message : "Unknown error"}`;
          
          // Log error response (non-blocking)
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
          }).catch(err => console.warn('[Onboarding] Failed to log error response:', err));
          
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
