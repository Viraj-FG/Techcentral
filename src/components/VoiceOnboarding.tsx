import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RealtimeChat } from "@/lib/realtimeAudio";
import KaevaAperture from "./KaevaAperture";
import VoiceSubtitles from "./VoiceSubtitles";
import DigitalTwinCard from "./DigitalTwinCard";
import AuroraBackground from "./AuroraBackground";
import PermissionRequest from "./PermissionRequest";
import TutorialOverlay from "./TutorialOverlay";
import { useToast } from "@/hooks/use-toast";
interface ConversationState {
  userName: string | null;
  dietaryValues: string[];
  allergies: string[];
  household: {
    adults: number;
    kids: number;
    dogs: number;
    cats: number;
  } | null;
  healthGoals: string[];
  lifestyleGoals: string[];
  isComplete: boolean;
}
interface VoiceOnboardingProps {
  onComplete: (profile: any) => void;
}
type ApertureState = "idle" | "wakeword" | "listening" | "thinking" | "speaking";
const VoiceOnboarding = ({
  onComplete
}: VoiceOnboardingProps) => {
  const {
    toast
  } = useToast();
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("kaeva_tutorial_seen");
  });
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    userName: null,
    dietaryValues: [],
    allergies: [],
    household: null,
    healthGoals: [],
    lifestyleGoals: [],
    isComplete: false
  });
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  const currentUserTranscriptRef = useRef("");
  const currentAiTranscriptRef = useRef("");

  // Initialize OpenAI Realtime API
  useEffect(() => {
    if (!permissionsGranted) return;

    const initializeRealtime = async () => {
      try {
        setApertureState("thinking");
        
        const chat = new RealtimeChat(
          handleRealtimeMessage,
          (speaking) => {
            if (speaking) {
              setApertureState("speaking");
            } else {
              setApertureState("listening");
            }
          }
        );

        await chat.init();
        realtimeChatRef.current = chat;
        
        setApertureState("listening");
        toast({
          title: "Connected",
          description: "Voice interface ready",
        });
      } catch (error) {
        console.error("Error initializing realtime:", error);
        toast({
          title: "Connection Error",
          description: "Failed to start voice conversation. Please try again.",
          variant: "destructive"
        });
      }
    };

    initializeRealtime();

    return () => {
      realtimeChatRef.current?.disconnect();
    };
  }, [permissionsGranted, toast]);

  const handleRealtimeMessage = (event: any) => {
    console.log('Realtime event:', event.type);

    switch (event.type) {
      case 'conversation.item.input_audio_transcription.completed':
        const userText = event.transcript;
        currentUserTranscriptRef.current = userText;
        setUserTranscript(userText);
        setShowSubtitles(true);
        setApertureState("thinking");
        break;

      case 'response.audio_transcript.delta':
        currentAiTranscriptRef.current += event.delta;
        setAiTranscript(currentAiTranscriptRef.current);
        setShowSubtitles(true);
        break;

      case 'response.audio_transcript.done':
        const fullTranscript = event.transcript;
        setAiTranscript(fullTranscript);
        currentAiTranscriptRef.current = "";
        break;

      case 'response.done':
        setShowSubtitles(false);
        currentUserTranscriptRef.current = "";
        // Check if conversation is complete
        // For now, user can manually end via summary
        break;

      case 'error':
        console.error('Realtime error:', event.error);
        toast({
          title: "Error",
          description: event.error.message || "An error occurred",
          variant: "destructive"
        });
        break;
    }
  };
  const handleProfileUpdate = () => {
    setShowSummary(false);
    setConversationState(prev => ({
      ...prev,
      isComplete: false
    }));
    setApertureState("listening");
  };
  const handleEnterKaeva = () => {
    // Disconnect realtime
    realtimeChatRef.current?.disconnect();

    // Build final profile
    const profile = {
      language: "English",
      // Default to English for voice mode
      userName: conversationState.userName,
      dietaryRestrictions: conversationState.dietaryValues,
      allergies: conversationState.allergies,
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
      <AuroraBackground />

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

              <motion.p initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.3
          }} className="mt-6 sm:mt-8 text-kaeva-sage text-xs sm:text-sm tracking-widest">
                {apertureState === "listening" && "LISTENING"}
                {apertureState === "thinking" && "PROCESSING"}
                {apertureState === "speaking" && "SPEAKING"}
              </motion.p>
            </motion.div> : <DigitalTwinCard key="summary" profile={conversationState} onUpdate={handleProfileUpdate} onComplete={handleEnterKaeva} />}
        </AnimatePresence>

        {showSubtitles && !showSummary && <VoiceSubtitles userText={userTranscript} aiText={aiTranscript} />}
      </div>
    </motion.div>;
};
export default VoiceOnboarding;