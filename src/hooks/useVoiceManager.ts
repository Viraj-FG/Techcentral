import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { useNavigate } from "react-router-dom";

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

      // Handle different message formats from ElevenLabs
      if (message.source === "user") {
        setUserTranscript(message.message);
        storeMessage("user", message.message);
      } else if (message.source === "ai") {
        setAiTranscript(message.message);
        storeMessage("assistant", message.message);
      }
    },
    clientTools: {
      updateProfile: async (parameters: { field: string; value: any }) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return "Not authenticated";

          console.log("💾 Updating profile:", parameters.field, parameters.value);

          let updateData: any = {};

          // Handle household members as structured data
          if (parameters.field === "householdMembers" && Array.isArray(parameters.value)) {
            // Store each household member in household_members table
            for (const member of parameters.value) {
              const { error } = await supabase.from('household_members').insert({
                user_id: session.user.id,
                member_type: member.type || 'other',
                name: member.name || null,
                age: member.age || null,
                age_group: member.ageGroup || null,
                allergies: member.allergies || [],
                dietary_restrictions: member.dietaryRestrictions || [],
                health_conditions: member.healthConditions || [],
                gender: member.gender || null,
                weight: member.weight || null,
                height: member.height || null,
                activity_level: member.activityLevel || null
              });

              if (error) console.error("Error storing household member:", error);
            }
            return "Household members saved";
          }

          // Handle pets
          if (parameters.field === "household" && parameters.value.petDetails) {
            for (const pet of parameters.value.petDetails) {
              const { error } = await supabase.from('pets').insert({
                user_id: session.user.id,
                name: pet.name,
                species: pet.type,
                breed: pet.breed || null,
                age: pet.age || null,
                toxic_flags_enabled: true
              });

              if (error) console.error("Error storing pet:", error);
            }
          }

          // Map fields to profile columns
          switch (parameters.field) {
            case "userName":
              updateData.user_name = parameters.value;
              break;
            case "userBiometrics":
              updateData = {
                user_age: parameters.value.age,
                user_weight: parameters.value.weight,
                user_height: parameters.value.height,
                user_gender: parameters.value.gender,
                user_activity_level: parameters.value.activityLevel
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
            case "household":
              updateData = {
                household_adults: parameters.value.adults || 1,
                household_kids: parameters.value.kids || 0
              };
              break;
            case "healthGoals":
              updateData.health_goals = parameters.value;
              break;
            case "lifestyleGoals":
              updateData.lifestyle_goals = parameters.value;
              break;
            default:
              console.warn("Unknown field:", parameters.field);
              return "Unknown field";
          }

          const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', session.user.id);

          if (error) throw error;

          if (onProfileUpdate) {
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (updatedProfile) onProfileUpdate(updatedProfile);
          }

          return `Updated ${parameters.field}`;
        } catch (error) {
          console.error("updateProfile error:", error);
          return "Failed to update profile";
        }
      },
      completeConversation: async (parameters: { reason: string }) => {
        console.log("🎯 Complete conversation:", parameters.reason);
        
        try {
          // 1. Stop ElevenLabs session
          await conversation.endSession();
          
          // 2. Reset all state
          setShowConversation(false);
          setUserTranscript("");
          setAiTranscript("");
          setVoiceState("idle");
          setApertureState("idle");
          
          // 3. If onboarding complete, navigate to dashboard
          if (parameters.reason === "onboarding_complete") {
            toast({
              title: "Onboarding Complete!",
              description: "Welcome to your Kaeva dashboard",
            });
            // Parent component handles navigation
          }
          
          // 4. Return blocking response
          return "SUCCESS: Conversation ended. Returning to dashboard.";
        } catch (error) {
          console.error("completeConversation error:", error);
          return `ERROR: ${error instanceof Error ? error.message : "Failed to complete"}`;
        }
      },
      navigateTo: (parameters: { page: string }) => {
        console.log("🧭 Navigate to:", parameters.page);
        navigate(`/${parameters.page}`);
        return `Navigating to ${parameters.page}`;
      }
    }
  });

  // Store message in conversation history
  const storeMessage = async (role: string, message: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !currentConversationIdRef.current) return;

      await supabase.from('conversation_history').insert({
        user_id: session.user.id,
        conversation_id: currentConversationIdRef.current,
        role,
        message
      });
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
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching history:", error);
      return [];
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

  const startConversation = useCallback(async () => {
    console.log("🚀 Starting conversation");
    setShowConversation(true);
    setVoiceState("active");
    setApertureState("thinking");

    try {
      currentConversationIdRef.current = crypto.randomUUID();
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
  }, [userProfile, onProfileUpdate]);

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
  }, [conversation]);

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
