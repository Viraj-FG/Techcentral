import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import KaevaAperture from "./KaevaAperture";
import DigitalTwinCard from "./DigitalTwinCard";
import AuroraBackground from "./AuroraBackground";
import PermissionRequest from "./PermissionRequest";
import TutorialOverlay from "./TutorialOverlay";
import HouseholdMemberCard from "./HouseholdMemberCard";
import OnboardingStatus from "./voice/OnboardingStatus";
import KeywordFeedback from "./voice/KeywordFeedback";
import { ConceptCard } from "./voice/ConceptCard";
import { SmartChips } from "./voice/SmartChips";
import { useOnboardingVoice } from "@/hooks/useOnboardingVoice";
import { supabase } from "@/integrations/supabase/client";
import { saveOnboardingData } from "@/lib/onboardingSave";
import { transformProfileData, ConversationState } from "@/lib/onboardingTransforms";

interface VoiceOnboardingProps {
  onComplete: (profile: any) => void;
  onExit?: () => void;
}

type ApertureState = "idle" | "wakeword" | "listening" | "thinking" | "speaking" | "acknowledged";

const VoiceOnboarding = ({ onComplete, onExit }: VoiceOnboardingProps) => {
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("kaeva_tutorial_seen");
  });
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [activeVertical, setActiveVertical] = useState<"food" | "beauty" | "pets" | null>(null);
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  const [smartChips, setSmartChips] = useState<string[]>(["Yes", "No", "Tell me more"]);
  const [conceptCards, setConceptCards] = useState<Array<{icon: string; label: string; value: string}>>([]);
  const [conversationState, setConversationState] = useState<ConversationState>({
    userName: null,
    userBiometrics: null,
    dietaryValues: [],
    allergies: [],
    householdMembers: [],
    beautyProfile: null,
    household: null,
    healthGoals: [],
    lifestyleGoals: [],
    isComplete: false
  });

  const stateRef = useRef(conversationState);

  useEffect(() => {
    stateRef.current = conversationState;
  }, [conversationState]);

  const {
    apertureState: voiceApertureState,
    audioAmplitude: voiceAudioAmplitude,
    userTranscript: voiceUserTranscript,
    aiTranscript: voiceAiTranscript,
    showConversation: voiceShowConversation,
    status,
    startConversation,
    endConversation,
    sendContextualUpdate
  } = useOnboardingVoice({
    onProfileUpdate: (profile) => {
      console.log("Profile updated:", profile);
    },
    onComplete: () => {
      console.log("Onboarding complete");
      setShowSummary(true);
    }
  });

  // Sync voice state to local state
  useEffect(() => {
    setApertureState(voiceApertureState);
    setUserTranscript(voiceUserTranscript);
    setAiTranscript(voiceAiTranscript);
  }, [voiceApertureState, voiceUserTranscript, voiceAiTranscript]);

  // Auto-start conversation when permissions granted
  useEffect(() => {
    if (permissionsGranted && status === 'disconnected') {
      console.log("🎬 Auto-starting onboarding conversation");
      startConversation();
    }
  }, [permissionsGranted, status]);

  useEffect(() => {
    const fetchPermissionStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: adminData } = await supabase.functions.invoke("check-admin", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (adminData?.isAdmin) {
        setIsAdmin(true);
      }

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

  const handleProfileUpdate = () => {
    setShowSummary(false);
    setConversationState(prev => ({
      ...prev,
      isComplete: false
    }));
    setApertureState("listening");
  };

  const handlePermissionsGranted = async () => {
    console.log('📋 handlePermissionsGranted called');
    
    try {
      setPermissionsGranted(true);
      console.log('✅ permissionsGranted state set to true');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('👤 User session found, saving to database...');
        const { error } = await supabase
          .from('profiles')
          .update({ permissions_granted: true })
          .eq('id', session.user.id);

        if (error) {
          console.error("❌ Failed to save permissions:", error);
        } else {
          console.log("✅ Permissions saved to database");
        }
      } else {
        console.warn('⚠️ No session found, skipping database save');
      }
      
      console.log('🎬 Transition to voice onboarding should happen now');
    } catch (err) {
      console.error('❌ handlePermissionsGranted error:', err);
      setPermissionsGranted(true);
    }
  };

  const handleEnterKaeva = async () => {
    // Data already saved by completeConversation tool, just navigate
    console.log("🎉 Entering Kaeva dashboard");
    
    const currentState = stateRef.current;
    const transformedData = transformProfileData(currentState);
    const { data: { session } } = await supabase.auth.getSession();
    
    const profile = {
      id: session?.user?.id,
      language: "English",
      userName: transformedData.user_name,
      dietaryRestrictions: transformedData.dietary_preferences,
      allergies: transformedData.allergies,
      beautyProfile: transformedData.beauty_profile,
      household: currentState.household,
      medicalGoals: transformedData.health_goals,
      lifestyleGoals: transformedData.lifestyle_goals,
      enableToxicFoodWarnings: (currentState.household?.dogs || 0) > 0 || 
                               (currentState.household?.cats || 0) > 0,
      onboarding_completed: true
    };
    
    onComplete(profile);
  };

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("kaeva_tutorial_seen", "true");
  };

  const handleChipClick = (chip: string) => {
    if (sendContextualUpdate) {
      sendContextualUpdate(`User selected quick reply: "${chip}"`);
    }
  };

  const handleDismissConceptCard = (index: number) => {
    setConceptCards(prev => prev.filter((_, i) => i !== index));
  };

  if (showTutorial) {
    return <TutorialOverlay isOpen={showTutorial} onDismiss={handleDismissTutorial} />;
  }

  if (!permissionsGranted) {
    return <PermissionRequest onPermissionsGranted={handlePermissionsGranted} onSkip={onExit} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background overflow-hidden"
    >
      {onExit && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            if (status === "connected") {
              console.log("🔌 Skipping onboarding: Disconnecting ElevenLabs");
              endConversation();
            }
            onExit?.();
          }}
          className="absolute top-4 right-4 z-50 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline backdrop-blur-sm"
        >
          Skip to Dashboard →
        </motion.button>
      )}

      <AuroraBackground vertical={activeVertical} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!showSummary ? (
            <motion.div
              key="conversation"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <KaevaAperture 
                state={apertureState} 
                size="lg" 
                audioElement={null}
                isDetectingSound={false}
                audioAmplitude={voiceAudioAmplitude}
              />

              <AnimatePresence>
                {conversationState.householdMembers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-8 max-w-2xl w-full space-y-3 px-4"
                  >
                    <div className="text-center text-sm text-secondary/70 mb-4">
                      Your Household Roster
                    </div>
                    {conversationState.householdMembers.map((member, idx) => (
                      <HouseholdMemberCard key={idx} member={member} index={idx} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <KeywordFeedback detectedKeywords={detectedKeywords} />
              <OnboardingStatus apertureState={apertureState} />
              
              {/* Concept Cards */}
              <AnimatePresence>
                {conceptCards.map((card, index) => (
                  <ConceptCard
                    key={`${card.label}-${index}`}
                    icon={card.icon}
                    label={card.label}
                    value={card.value}
                    onDismiss={() => handleDismissConceptCard(index)}
                  />
                ))}
              </AnimatePresence>
              
              {/* Smart Chips (Quick Reply Buttons) */}
              <AnimatePresence>
                {status === 'connected' && smartChips.length > 0 && (
                  <SmartChips chips={smartChips} onChipClick={handleChipClick} />
                )}
              </AnimatePresence>
              
              {/* Edit Last Answer Button */}
              <AnimatePresence>
                {status === 'connected' && voiceUserTranscript && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={() => {
                      if (sendContextualUpdate) {
                        sendContextualUpdate("The user wants to edit or add to their previous answer. Please ask them what they'd like to change or add.");
                      }
                    }}
                    className="mt-6 px-6 py-2 text-sm text-primary/80 hover:text-primary border border-primary/30 hover:border-primary/60 rounded-full transition-colors backdrop-blur-sm bg-background/30"
                  >
                    ✏️ Edit Last Answer
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <DigitalTwinCard
              key="summary"
              profile={conversationState}
              onUpdate={handleProfileUpdate}
              onComplete={handleEnterKaeva}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default VoiceOnboarding;
