import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { VoiceActivityDetector, BargeInDetector } from "@/lib/audioMonitoring";
import { useNavigate } from "react-router-dom";

type VoiceState = "idle" | "sleeping" | "listening" | "processing" | "speaking";
type ApertureState = "idle" | "wakeword" | "listening" | "thinking" | "speaking";

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
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();
  
  const recognitionRef = useRef<any>(null);
  const currentConversationIdRef = useRef<string>("");
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const bargeInRef = useRef<BargeInDetector | null>(null);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => console.log("🔌 Connected to ElevenLabs"),
    onDisconnect: () => console.log("🔌 Disconnected from ElevenLabs"),
    onError: (error) => {
      console.error("❌ ElevenLabs error:", error);
      toast({
        title: "Connection Error",
        description: "Voice connection failed. Please try again.",
        variant: "destructive"
      });
      returnToSleeping();
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
      completeConversation: () => {
        console.log("🎯 Complete conversation called");
        endConversation();
        return "Conversation ended";
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

  // === STATE TRANSITIONS ===

  const transitionToListening = useCallback(() => {
    console.log("🎤 → LISTENING");
    stopWakeWordDetection();
    
    // Play wake sound
    const audio = new Audio('/sounds/wake.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Wake sound failed:", e));
    
    setVoiceState("listening");
    setApertureState("listening");
    setShowConversation(true);
    
    // Start VAD monitoring
    vadRef.current = new VoiceActivityDetector();
    vadRef.current.start(
      () => {
        console.log("🔇 Silence detected - transitioning to processing");
        transitionToProcessing();
      },
      (level) => {
        setAudioAmplitude(level);
      }
    ).catch(err => {
      console.error("VAD start failed:", err);
      transitionToProcessing(); // Fallback
    });
  }, []);

  const transitionToProcessing = useCallback(() => {
    console.log("⚙️ → PROCESSING");
    
    // Stop VAD
    if (vadRef.current) {
      vadRef.current.stop();
      vadRef.current = null;
    }
    
    setVoiceState("processing");
    setApertureState("thinking");
    setAudioAmplitude(0);
  }, []);

  const transitionToSpeaking = useCallback(() => {
    console.log("🗣️ → SPEAKING");
    setVoiceState("speaking");
    setApertureState("speaking");
    
    // Start barge-in detection
    bargeInRef.current = new BargeInDetector();
    bargeInRef.current.start(() => {
      console.log("🛑 Barge-in detected!");
      conversation.endSession();
      setTimeout(() => transitionToListening(), 100);
    }).catch(err => console.error("Barge-in start failed:", err));
  }, [conversation, transitionToListening]);

  const returnToSleeping = useCallback(() => {
    console.log("😴 → SLEEPING");
    
    // Cleanup all monitors
    if (vadRef.current) {
      vadRef.current.stop();
      vadRef.current = null;
    }
    if (bargeInRef.current) {
      bargeInRef.current.stop();
      bargeInRef.current = null;
    }
    
    setVoiceState("sleeping");
    setApertureState("wakeword");
    setShowConversation(false);
    setUserTranscript("");
    setAiTranscript("");
    setAudioAmplitude(0);
    
    startWakeWordDetection();
  }, []);

  // Monitor conversation speaking state
  useEffect(() => {
    if (conversation.isSpeaking && voiceState !== "speaking") {
      transitionToSpeaking();
    } else if (!conversation.isSpeaking && voiceState === "speaking") {
      // AI finished speaking - back to listening
      if (bargeInRef.current) {
        bargeInRef.current.stop();
        bargeInRef.current = null;
      }
      transitionToListening();
    }
  }, [conversation.isSpeaking, voiceState, transitionToSpeaking, transitionToListening]);

  // === WAKE WORD DETECTION ===

  const startWakeWordDetection = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn("Speech recognition not supported");
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        console.log("👂 Wake word detection started");
        setIsWakeWordActive(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("")
          .toLowerCase();

        if (transcript.includes("kaeva") || transcript.includes("hey kaeva")) {
          console.log("🎤 Wake word detected:", transcript);
          startConversation();
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "aborted") {
          setTimeout(() => startWakeWordDetection(), 1000);
        }
      };

      recognitionRef.current.onend = () => {
        if (voiceState === "sleeping") {
          console.log("🔄 Restarting wake word detection");
          setTimeout(() => recognitionRef.current?.start(), 500);
        }
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error("Wake word detection error:", error);
    }
  }, [voiceState]);

  const stopWakeWordDetection = useCallback(() => {
    if (recognitionRef.current) {
      console.log("🛑 Stopping wake word detection");
      setIsWakeWordActive(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Already stopped");
      }
      recognitionRef.current = null;
    }
  }, []);

  // === CONVERSATION CONTROL ===

  const startConversation = useCallback(async () => {
    console.log("🚀 Starting conversation");
    transitionToListening();

    try {
      currentConversationIdRef.current = crypto.randomUUID();
      const recentHistory = await fetchRecentHistory();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      // Fetch context
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

      const agentId = "agent_0501kakwnx5rffaby5rx9y1pskkb";
      const signedUrl = await getSignedUrl(agentId);
      
      const isOnboardingComplete = userProfile?.onboarding_completed;
      const mode = isOnboardingComplete ? "assistant" : "onboarding";
      
      console.log(`🤖 Starting in ${mode} mode`);

      let contextPrompt = "";
      if (mode === "assistant") {
        contextPrompt = `You are Kaeva in ASSISTANT MODE.

**VOICE BEHAVIOR RULES**:
- Keep responses under 30 seconds unless user asks for details
- If user interrupts you (barge-in), immediately stop and listen
- Acknowledge interruptions: "Yes?" or "Go ahead"
- For quick confirmations, use 1-2 words: "Done", "Added", "Got it"

**USER PROFILE**:
- Name: ${userProfile.user_name || 'User'}
- Age: ${userProfile.user_age || 'Unknown'}
- Gender: ${userProfile.user_gender || 'Unknown'}
- TDEE: ${userProfile.calculated_tdee || 'Not calculated'} cal/day
- Activity Level: ${userProfile.user_activity_level || 'Unknown'}
- Dietary Preferences: ${JSON.stringify(userProfile.dietary_preferences || [])}
- Allergies: ${JSON.stringify(userProfile.allergies || [])}
- Health Goals: ${JSON.stringify(userProfile.health_goals || [])}
- Lifestyle Goals: ${JSON.stringify(userProfile.lifestyle_goals || [])}

**HOUSEHOLD MEMBERS** (${householdMembers?.length || 0} members):
${householdMembers?.map(m => `- ${m.name || m.member_type} (${m.age_group}): Allergies: ${JSON.stringify(m.allergies || [])}, Dietary: ${JSON.stringify(m.dietary_restrictions || [])}, Health: ${JSON.stringify(m.health_conditions || [])}`).join('\n') || 'None'}

**PETS** (${pets?.length || 0} pets):
${pets?.map(p => `- ${p.name} (${p.species}, ${p.breed || 'breed unknown'}): Toxic flags ${p.toxic_flags_enabled ? 'ENABLED' : 'disabled'}`).join('\n') || 'None'}

**RECENT INVENTORY** (Top 20 active items):
${inventory?.map(i => `- ${i.name} (${i.category}): ${i.quantity} ${i.unit || ''}, Status: ${i.status}${i.expiry_date ? `, Expires: ${i.expiry_date}` : ''}`).join('\n') || 'No inventory data'}

**RECENT CONVERSATION HISTORY**:
${recentHistory.length > 0 ? recentHistory.map((msg: any) => `${msg.role === "user" ? "User" : "Kaeva"}: ${msg.message}`).join('\n') : 'No recent history'}

**INSTRUCTIONS**:
- Be proactive: Use this context to suggest actions
- Safety-first: Check allergies and pet toxicity before recommending food
- Reference inventory: "You have X in your pantry, so I suggest Y"
- Know the household: "Since Emma has a peanut allergy, avoid recipes with nuts"
- Call completeConversation() when user is done
`;
      } else {
        contextPrompt = "You are Kaeva in ONBOARDING MODE. New user - follow the structured interview to collect all required information.";
      }

      await conversation.startSession({ 
        signedUrl,
        overrides: {
          agent: {
            prompt: { prompt: contextPrompt }
          }
        }
      });

      transitionToProcessing();
    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
      toast({
        title: "Connection Failed",
        description: "Could not start conversation. Please try again.",
        variant: "destructive"
      });
      returnToSleeping();
    }
  }, [userProfile, conversation, toast, transitionToListening, transitionToProcessing, returnToSleeping]);

  const endConversation = useCallback(async () => {
    console.log("👋 Ending conversation");
    
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Error ending conversation:", error);
    }

    returnToSleeping();
  }, [conversation, returnToSleeping]);

  // Initialize wake word detection on mount
  useEffect(() => {
    // Request notification permissions for timers
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const timer = setTimeout(() => {
      setVoiceState("sleeping");
      setApertureState("wakeword");
      startWakeWordDetection();
    }, 2000);

    return () => {
      clearTimeout(timer);
      stopWakeWordDetection();
      if (vadRef.current) vadRef.current.stop();
      if (bargeInRef.current) bargeInRef.current.stop();
    };
  }, []);

  return {
    voiceState,
    apertureState,
    audioAmplitude,
    userTranscript,
    aiTranscript,
    showConversation,
    isWakeWordActive,
    conversationHistory,
    startConversation,
    endConversation
  };
};
