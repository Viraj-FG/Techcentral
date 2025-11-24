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
import { useOnboardingConversation } from "@/hooks/useOnboardingConversation";
import { supabase } from "@/integrations/supabase/client";
import { saveOnboardingData } from "@/lib/onboardingSave";
import { transformProfileData, ConversationState } from "@/lib/onboardingTransforms";
import { Check, Circle } from "lucide-react";

interface VoiceOnboardingProps {
  onComplete: (profile: any) => void;
  onExit?: () => void;
}

type ApertureState = "idle" | "wakeword" | "listening" | "thinking" | "speaking";

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

  const { conversation } = useOnboardingConversation({
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
  });

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
    console.log("🎉 Entering Kaeva dashboard - fetching complete profile");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.error("No session found");
        return;
      }
      
      // Fetch the complete profile with current_household_id from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error("Failed to fetch profile:", error);
        return;
      }
      
      if (!profile) {
        console.error("Profile not found");
        return;
      }
      
      console.log("✅ Profile loaded with household_id:", profile.current_household_id);
      onComplete(profile);
    } catch (error) {
      console.error("Error in handleEnterKaeva:", error);
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
    return <PermissionRequest onPermissionsGranted={handlePermissionsGranted} onSkip={onExit} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-kaeva-void overflow-hidden"
    >
      {onExit && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            if (conversation.status === "connected") {
              console.log("🔌 Skipping onboarding: Disconnecting ElevenLabs");
              conversation.endSession();
            }
            onExit();
          }}
          className="absolute top-4 right-4 z-50 px-4 py-2 text-sm text-kaeva-slate-400 hover:text-kaeva-mint transition-colors underline-offset-4 hover:underline backdrop-blur-sm"
        >
          Skip to Dashboard →
        </motion.button>
      )}

      <AuroraBackground vertical={activeVertical} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        {/* Onboarding Progress Indicator */}
        {!showSummary && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-kaeva-void/80 backdrop-blur-sm px-6 py-3 rounded-full border border-kaeva-sage/20"
          >
            <div className="flex items-center gap-2">
              {permissionsGranted ? (
                <Check className="h-4 w-4 text-kaeva-mint" />
              ) : (
                <Circle className="h-4 w-4 text-kaeva-slate-400" />
              )}
              <span className="text-xs text-white/70">Permissions</span>
            </div>
            <div className="h-4 w-px bg-kaeva-sage/20" />
            <div className="flex items-center gap-2">
              {conversationState.userName ? (
                <Check className="h-4 w-4 text-kaeva-mint" />
              ) : (
                <Circle className="h-4 w-4 text-kaeva-slate-400" />
              )}
              <span className="text-xs text-white/70">Profile</span>
            </div>
            <div className="h-4 w-px bg-kaeva-sage/20" />
            <div className="flex items-center gap-2">
              {conversationState.householdMembers.length > 0 ? (
                <Check className="h-4 w-4 text-kaeva-mint" />
              ) : (
                <Circle className="h-4 w-4 text-kaeva-slate-400" />
              )}
              <span className="text-xs text-white/70">Household</span>
            </div>
          </motion.div>
        )}

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
              />

              <AnimatePresence>
                {conversationState.householdMembers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-8 max-w-2xl w-full space-y-3 px-4"
                  >
                    <div className="text-center text-sm text-kaeva-sage/70 mb-4">
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
