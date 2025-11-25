import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import KaevaAperture from "./KaevaAperture";
import DigitalTwinCard from "./DigitalTwinCard";
import AuroraBackground from "./AuroraBackground";
import PermissionRequest from "./PermissionRequest";
import TutorialOverlay from "./TutorialOverlay";
import HouseholdMemberCard from "./HouseholdMemberCard";
import OnboardingStatus from "./voice/OnboardingStatus";
import KeywordFeedback from "./voice/KeywordFeedback";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { supabase } from "@/integrations/supabase/client";
import { saveOnboardingData } from "@/lib/onboardingSave";
import { transformProfileData, ConversationState } from "@/lib/onboardingTransforms";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/errorHandler";
import { consoleRecorder } from "@/lib/consoleRecorder";

interface VoiceOnboardingProps {
  onComplete: (profile: any) => void;
  onExit?: () => void;
}

type ApertureState = "idle" | "wakeword" | "listening" | "thinking" | "speaking";

const VoiceOnboarding = ({ onComplete, onExit }: VoiceOnboardingProps) => {
  const { toast } = useToast();
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("kaeva_tutorial_seen");
  });
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [activeVertical, setActiveVertical] = useState<"food" | "beauty" | "pets" | null>(null);
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);
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

  const { conversation, startConversation, endConversation: endVoiceConversation, apertureState } = useVoiceConversation({
    mode: "onboarding",
    onComplete,
    onProfileUpdate: (profile) => {
      console.log("Profile updated:", profile);
    }
  });

  // Start conversation when permissions granted
  useEffect(() => {
    if (permissionsGranted && conversation.status === "disconnected") {
      startConversation();
    }
  }, [permissionsGranted, conversation.status, startConversation]);

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
  };

  const handlePermissionsGranted = async () => {
    console.log('📋 handlePermissionsGranted called');
    
    // Update UI immediately
    setPermissionsGranted(true);
    console.log('✅ permissionsGranted state set to true');

    // Perform DB update in background
    const updateDb = async () => {
      try {
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
      } catch (err) {
        console.error('❌ Background permission save error:', err);
      }
    };

    // Fire and forget
    updateDb();
    
    console.log('🎬 Transition to voice onboarding initiated');
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
    console.log("🎓 Tutorial dismissed");
    setShowTutorial(false);
    localStorage.setItem("kaeva_tutorial_seen", "true");
    console.log("➡️ Should now show permission request. permissionsGranted:", permissionsGranted);
  };

  console.log("🔍 VoiceOnboarding render - showTutorial:", showTutorial, "permissionsGranted:", permissionsGranted);

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
            console.log('⏭️ Skip to Dashboard clicked in VoiceOnboarding');
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

      {/* Debug Button */}
      <button
        onClick={() => consoleRecorder.downloadLogs()}
        className="absolute bottom-4 left-4 z-50 text-xs text-white/10 hover:text-white/40 transition-colors"
      >
        Debug Logs
      </button>

      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        {voiceError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 left-1/2 transform -translate-x-1/2 max-w-md"
          >
            <div className="glass-card p-6 border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-2">Voice Connection Issue</h3>
                  <p className="text-white/70 text-sm mb-4">{voiceError}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.location.reload()}
                      className="text-white/80"
                    >
                      Retry
                    </Button>
                    {onExit && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={onExit}
                      >
                        Skip to Dashboard
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
