import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConversation } from "@11labs/react";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { supabase } from "@/integrations/supabase/client";
import KaevaAperture from "./KaevaAperture";
import VoiceSubtitles from "./VoiceSubtitles";
import DigitalTwinCard from "./DigitalTwinCard";
import AuroraBackground from "./AuroraBackground";
import PermissionRequest from "./PermissionRequest";
import TutorialOverlay from "./TutorialOverlay";
import { useToast } from "@/hooks/use-toast";
import { Mic, Brain, Volume2, Leaf, PawPrint, Sparkles } from "lucide-react";

interface ConversationState {
  userName: string | null;
  dietaryValues: string[];
  allergies: string[];
  beautyProfile: {
    skinType: string | null;
    hairType: string | null;
  } | null;
  household: {
    adults: number;
    kids: number;
    dogs: number;
    cats: number;
    petDetails?: string;
  } | null;
  healthGoals: string[];
  lifestyleGoals: string[];
  isComplete: boolean;
}
interface VoiceOnboardingProps {
  onComplete: (profile: any) => void;
}
type ApertureState = "idle" | "wakeword" | "listening" | "thinking" | "speaking";
const VoiceOnboarding = ({ onComplete }: VoiceOnboardingProps) => {
  const { toast } = useToast();
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("kaeva_tutorial_seen");
  });
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [activeVertical, setActiveVertical] = useState<"food" | "beauty" | "pets" | null>(null);
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>({
    userName: null,
    dietaryValues: [],
    allergies: [],
    beautyProfile: null,
    household: null,
    healthGoals: [],
    lifestyleGoals: [],
    isComplete: false
  });

  // ElevenLabs Conversational AI
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
      
      // Handle user transcripts
      if (message.source === "user") {
        setUserTranscript(message.message || "");
        setShowSubtitles(true);
        setApertureState("thinking");
      }
      
      // Handle assistant responses
      if (message.source === "ai") {
        const text = message.message?.toLowerCase() || "";
        
        // Detect conversation context
        if (text.includes("skin") || text.includes("hair") || text.includes("beauty")) {
          setActiveVertical("beauty");
        } else if (text.includes("pet") || text.includes("dog") || text.includes("cat")) {
          setActiveVertical("pets");
        } else if (text.includes("diet") || text.includes("food") || text.includes("allergy")) {
          setActiveVertical("food");
        }
        
        // Detect specific keywords for icon animation
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
        setConversationState(prev => ({
          ...prev,
          [parameters.field]: parameters.value
        }));
        return "Profile updated";
      },
      completeOnboarding: () => {
        console.log("Completing onboarding");
        setShowSummary(true);
        return "Onboarding complete";
      }
    }
  });

  // Track speaking state
  useEffect(() => {
    if (conversation.isSpeaking) {
      setApertureState("speaking");
    } else if (conversation.status === "connected") {
      setApertureState("listening");
    }
  }, [conversation.isSpeaking, conversation.status]);

  // Fetch permission status from database on mount
  useEffect(() => {
    const fetchPermissionStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('permissions_granted')
        .eq('id', session.user.id)
        .single();

      if (profile?.permissions_granted) {
        console.log("✅ Permissions already granted, skipping request");
        setPermissionsGranted(true);
      }
    };

    fetchPermissionStatus();
  }, []);

  // Initialize ElevenLabs conversation
  useEffect(() => {
    if (!permissionsGranted) return;

    const initConversation = async () => {
      try {
        setApertureState("thinking");
        
        const agentId = "agent_0501kakwnx5rffaby5px9y1pskkb";
        
        console.log("Getting signed URL...");
        const signedUrl = await getSignedUrl(agentId);
        
        console.log("Starting conversation...");
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
      // Cleanup: ensure ElevenLabs is disconnected when component unmounts
      if (conversation.status === "connected") {
        console.log("🧹 Cleanup: Disconnecting ElevenLabs on unmount");
        conversation.endSession();
      }
    };
  }, [permissionsGranted]);
  const handleProfileUpdate = () => {
    setShowSummary(false);
    setConversationState(prev => ({
      ...prev,
      isComplete: false
    }));
    setApertureState("listening");
  };

  const handlePermissionsGranted = async () => {
    setPermissionsGranted(true);
    
    // Save to database
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error } = await supabase
        .from('profiles')
        .update({ permissions_granted: true })
        .eq('id', session.user.id);

      if (error) {
        console.error("Failed to save permissions status:", error);
      } else {
        console.log("✅ Permissions status saved to database");
      }
    }
  };

  const transformProfileData = (state: ConversationState) => {
    // Ensure dietary values is an array
    const dietaryPreferences = Array.isArray(state.dietaryValues) 
      ? state.dietaryValues 
      : [];

    // Ensure allergies is an array  
    const allergies = Array.isArray(state.allergies)
      ? state.allergies
      : [];

    // Ensure health goals is an array
    const healthGoals = Array.isArray(state.healthGoals)
      ? state.healthGoals
      : [];

    // Ensure lifestyle goals is an array
    const lifestyleGoals = Array.isArray(state.lifestyleGoals)
      ? state.lifestyleGoals
      : [];

    // Ensure beauty profile is a proper object
    const beautyProfile = state.beautyProfile || { skinType: null, hairType: null };

    return {
      user_name: state.userName || null,
      dietary_preferences: dietaryPreferences,
      allergies: allergies,
      beauty_profile: beautyProfile,
      health_goals: healthGoals,
      lifestyle_goals: lifestyleGoals,
      household_adults: state.household?.adults || 1,
      household_kids: state.household?.kids || 0,
      onboarding_completed: true
    };
  };

  const handleEnterKaeva = async () => {
    // Forcefully disconnect ElevenLabs before proceeding
    try {
      if (conversation.status === "connected") {
        console.log("🔌 Disconnecting ElevenLabs session...");
        await conversation.endSession();
        console.log("✅ ElevenLabs disconnected successfully");
      }
    } catch (error) {
      console.error("❌ Error disconnecting ElevenLabs:", error);
    }

    // Ensure complete cleanup
    setApertureState("idle");
    setShowSubtitles(false);
    setUserTranscript("");
    setAiTranscript("");

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive"
      });
      return;
    }

    const userId = session.user.id;

    try {
      // Log the raw state for debugging
      console.log("📊 Raw conversationState:", JSON.stringify(conversationState, null, 2));
      
      // Transform data to match database schema
      const transformedData = transformProfileData(conversationState);
      console.log("✅ Transformed data:", JSON.stringify(transformedData, null, 2));

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update(transformedData)
        .eq('id', userId);

      if (profileError) {
        console.error("❌ Profile update error:", profileError);
        toast({
          title: "Error",
          description: `Failed to save profile: ${profileError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log("✅ Profile saved successfully");

      // Save pets if any
      if (conversationState.household?.dogs || conversationState.household?.cats) {
        const pets = [];

        for (let i = 0; i < (conversationState.household.dogs || 0); i++) {
          pets.push({
            user_id: userId,
            species: 'Dog',
            name: conversationState.household.petDetails ? `Dog ${i + 1}` : `Dog ${i + 1}`,
            toxic_flags_enabled: true
          });
        }

        for (let i = 0; i < (conversationState.household.cats || 0); i++) {
          pets.push({
            user_id: userId,
            species: 'Cat',
            name: conversationState.household.petDetails ? `Cat ${i + 1}` : `Cat ${i + 1}`,
            toxic_flags_enabled: true
          });
        }

        if (pets.length > 0) {
          const { error: petsError } = await supabase.from('pets').insert(pets);
          if (petsError) {
            console.error("Pets insert error:", petsError);
          }
        }
      }

      // Build profile object for local state using transformed data
      const profile = {
        id: userId,
        language: "English",
        userName: transformedData.user_name,
        dietaryRestrictions: transformedData.dietary_preferences,
        allergies: transformedData.allergies,
        beautyProfile: transformedData.beauty_profile,
        household: conversationState.household,
        medicalGoals: transformedData.health_goals,
        lifestyleGoals: transformedData.lifestyle_goals,
        enableToxicFoodWarnings: (conversationState.household?.dogs || 0) > 0 || (conversationState.household?.cats || 0) > 0,
        onboarding_completed: true
      };

      console.log("🎉 Calling onComplete with profile");
      onComplete(profile);
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding",
        variant: "destructive"
      });
    }
  };

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("kaeva_tutorial_seen", "true");
  };

  if (showTutorial) {
    return <TutorialOverlay isOpen={showTutorial} onDismiss={handleDismissTutorial} />;
  }

  if (!permissionsGranted) {
    return <PermissionRequest onPermissionsGranted={handlePermissionsGranted} />;
  }

  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} className="fixed inset-0 bg-kaeva-void overflow-hidden">
      <AuroraBackground vertical={activeVertical} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!showSummary ? <motion.div key="conversation" initial={{
          scale: 0.8,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.8,
          opacity: 0
        }} className="flex flex-col items-center">
              <KaevaAperture 
                state={apertureState} 
                size="lg" 
                audioElement={null}
                isDetectingSound={false}
              />

              {/* Keyword Icon Feedback */}
              <AnimatePresence>
                {detectedKeywords.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 flex gap-4"
                  >
                    {detectedKeywords.includes("vegan") && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 0.6 }}
                        className="p-3 rounded-full bg-emerald-400/20 backdrop-blur-sm border border-emerald-400/30"
                      >
                        <Leaf className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                      </motion.div>
                    )}
                    {(detectedKeywords.includes("dog") || detectedKeywords.includes("cat")) && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 0.6 }}
                        className="p-3 rounded-full bg-sky-400/20 backdrop-blur-sm border border-sky-400/30"
                      >
                        <PawPrint className="w-6 h-6 text-sky-400" strokeWidth={1.5} />
                      </motion.div>
                    )}
                    {detectedKeywords.includes("beauty") && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 0.6 }}
                        className="p-3 rounded-full bg-orange-400/20 backdrop-blur-sm border border-orange-400/30"
                      >
                        <Sparkles className="w-6 h-6 text-orange-400" strokeWidth={1.5} />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {apertureState === "listening" && (
                  <motion.div
                    key="listening"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="p-3 rounded-full bg-primary/20"
                    >
                      <Mic className="w-5 h-5 text-primary" />
                    </motion.div>
                    <p className="text-primary text-xs sm:text-sm tracking-widest font-medium">
                      LISTENING
                    </p>
                    <p className="text-muted-foreground text-xs">Speak now...</p>
                  </motion.div>
                )}
                
                {apertureState === "thinking" && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="p-3 rounded-full bg-accent/20"
                    >
                      <Brain className="w-5 h-5 text-accent" />
                    </motion.div>
                    <p className="text-accent text-xs sm:text-sm tracking-widest font-medium">
                      PROCESSING
                    </p>
                    <p className="text-muted-foreground text-xs">Analyzing your response...</p>
                  </motion.div>
                )}
                
                {apertureState === "speaking" && (
                  <motion.div
                    key="speaking"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="p-3 rounded-full bg-secondary/20"
                    >
                      <Volume2 className="w-5 h-5 text-secondary-foreground" />
                    </motion.div>
                    <p className="text-secondary-foreground text-xs sm:text-sm tracking-widest font-medium">
                      SPEAKING
                    </p>
                    <p className="text-muted-foreground text-xs">Kaeva is responding...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div> : <DigitalTwinCard key="summary" profile={conversationState} onUpdate={handleProfileUpdate} onComplete={handleEnterKaeva} />}
        </AnimatePresence>

        {showSubtitles && !showSummary && <VoiceSubtitles userText={userTranscript} aiText={aiTranscript} />}
      </div>
    </motion.div>;
};
export default VoiceOnboarding;