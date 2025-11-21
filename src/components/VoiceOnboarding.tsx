import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConversation } from "@11labs/react";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
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
        console.log("Updating profile:", parameters);
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

    // Build final profile
    const profile = {
      language: "English",
      userName: conversationState.userName,
      dietaryRestrictions: conversationState.dietaryValues,
      allergies: conversationState.allergies,
      beautyProfile: conversationState.beautyProfile,
      household: conversationState.household,
      medicalGoals: conversationState.healthGoals,
      lifestyleGoals: conversationState.lifestyleGoals,
      enableToxicFoodWarnings: (conversationState.household?.dogs || 0) > 0 || (conversationState.household?.cats || 0) > 0
    };

    // Save to localStorage
    localStorage.setItem("kaeva_user_profile", JSON.stringify(profile));
    localStorage.setItem("kaeva_onboarding_complete", "true");
    onComplete(profile);
  };

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("kaeva_tutorial_seen", "true");
  };

  if (showTutorial) {
    return <TutorialOverlay isOpen={showTutorial} onDismiss={handleDismissTutorial} />;
  }

  if (!permissionsGranted) {
    return <PermissionRequest onPermissionsGranted={() => setPermissionsGranted(true)} />;
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