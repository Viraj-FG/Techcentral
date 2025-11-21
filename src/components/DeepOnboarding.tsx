import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import KaevaAperture from "./KaevaAperture";
import ClusterLanguage from "./ClusterLanguage";
import ClusterSafety from "./ClusterSafety";
import ClusterHousehold from "./ClusterHousehold";
import ClusterMission from "./ClusterMission";
import DigitalTwinSummary from "./DigitalTwinSummary";
import AuroraBackground from "./AuroraBackground";
import PermissionRequest from "./PermissionRequest";

interface UserProfile {
  language: string;
  dietaryRestrictions: {
    values: string[];
    allergies: string[];
  };
  household: {
    adults: number;
    kids: number;
    dogs: number;
    cats: number;
  };
  missions: {
    medical: string[];
    lifestyle: string[];
  };
  internalFlags: {
    enableToxicFoodWarnings: boolean;
  };
}

interface DeepOnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

type ClusterType = "language" | "safety" | "household" | "mission" | "summary";
type ApertureState = "idle" | "thinking" | "speaking";

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

const getFallbackMessage = (cluster: ClusterType): string => {
  const fallbacks: Record<ClusterType, string> = {
    language: "Hello. I am Kaeva. What is your preferred language?",
    safety: "Understood. Now, let's set your safety parameters. Select all that apply.",
    household: "Noted. Who are we nourishing? This defines portions and budget.",
    mission: "Final calibration. What is our primary mission?",
    summary: "Profile generated. All systems calibrated. Ready to begin."
  };
  return fallbacks[cluster];
};

const DeepOnboarding = ({ onComplete }: DeepOnboardingProps) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    language: "",
    dietaryRestrictions: {
      values: [],
      allergies: []
    },
    household: {
      adults: 1,
      kids: 0,
      dogs: 0,
      cats: 0
    },
    missions: {
      medical: [],
      lifestyle: []
    },
    internalFlags: {
      enableToxicFoodWarnings: false
    }
  });

  const [currentCluster, setCurrentCluster] = useState<ClusterType>("language");
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [aiMessage, setAiMessage] = useState("");
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>
  >([]);

  // Typewriter effect
  useEffect(() => {
    if (!aiMessage) {
      setDisplayedMessage("");
      return;
    }
    
    let index = 0;
    setDisplayedMessage("");
    
    const interval = setInterval(() => {
      if (index < aiMessage.length) {
        setDisplayedMessage(aiMessage.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [aiMessage]);

  // Initial AI greeting - only run after permissions are granted
  useEffect(() => {
    if (!permissionsGranted) return;

    const fetchInitialGreeting = async () => {
      setApertureState("thinking");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      try {
        const { data, error } = await supabase.functions.invoke('interview-ai', {
          body: {
            cluster: 'language',
            userProfile: {},
            conversationHistory: []
          }
        });

        if (error) throw error;
        
        // Store AI's first message in history
        setConversationHistory([
          { role: "model", parts: [{ text: data.message }] }
        ]);
        
        setApertureState("speaking");
        setAiMessage(data.message || getFallbackMessage("language"));
        await new Promise(resolve => setTimeout(resolve, 600));
        setApertureState("idle");
      } catch (error) {
        console.error("Initial greeting error:", error);
        setAiMessage(getFallbackMessage("language"));
        setApertureState("idle");
      }
    };

    fetchInitialGreeting();
  }, [permissionsGranted]);

  const getNextCluster = (current: ClusterType): ClusterType => {
    const flow: ClusterType[] = ["language", "safety", "household", "mission", "summary"];
    const currentIndex = flow.indexOf(current);
    return flow[currentIndex + 1] || "summary";
  };

  const formatUserInput = (clusterData: any): string => {
    if (clusterData.language) {
      return `I prefer ${clusterData.language}`;
    }
    if (clusterData.dietaryRestrictions) {
      const { values, allergies } = clusterData.dietaryRestrictions;
      let text = "";
      if (values.length > 0) text += `My dietary preferences: ${values.join(", ")}. `;
      if (allergies.length > 0) text += `My allergies: ${allergies.join(", ")}.`;
      return text || "No dietary restrictions";
    }
    if (clusterData.household) {
      const { adults, kids, dogs, cats } = clusterData.household;
      return `My household has ${adults} adults, ${kids} kids, ${dogs} dogs, and ${cats} cats.`;
    }
    if (clusterData.missions) {
      const { medical, lifestyle } = clusterData.missions;
      let text = "";
      if (medical.length > 0) text += `Medical goals: ${medical.join(", ")}. `;
      if (lifestyle.length > 0) text += `Lifestyle goals: ${lifestyle.join(", ")}.`;
      return text || "No specific goals";
    }
    return JSON.stringify(clusterData);
  };

  const handleClusterSubmit = async (clusterData: any) => {
    const updatedProfile = { ...userProfile, ...clusterData };
    
    // Auto-enable toxic food warnings if dogs > 0
    if (clusterData.household?.dogs > 0) {
      updatedProfile.internalFlags.enableToxicFoodWarnings = true;
    }
    
    setUserProfile(updatedProfile);
    setApertureState("thinking");
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1200));

    const nextCluster = getNextCluster(currentCluster);
    
    // Add user's selection to conversation history
    const userMessage = {
      role: "user" as const,
      parts: [{ text: formatUserInput(clusterData) }]
    };
    
    const updatedHistory = [...conversationHistory, userMessage];
    
    try {
      const { data, error } = await supabase.functions.invoke('interview-ai', {
        body: {
          cluster: nextCluster,
          userProfile: updatedProfile,
          conversationHistory: updatedHistory
        }
      });

      if (error) throw error;

      // Add AI's response to conversation history
      const aiResponse = {
        role: "model" as const,
        parts: [{ text: data.message }]
      };
      
      setConversationHistory([...updatedHistory, aiResponse]);

      setApertureState("speaking");
      setAiMessage(data.message || getFallbackMessage(nextCluster));
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentCluster(nextCluster);
      setApertureState("idle");
    } catch (error) {
      console.error("AI Error:", error);
      setAiMessage(getFallbackMessage(nextCluster));
      setCurrentCluster(nextCluster);
      setApertureState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageSelect = (language: string) => {
    handleClusterSubmit({ language });
  };

  const handleSafetySubmit = (data: { values: string[]; allergies: string[] }) => {
    handleClusterSubmit({ dietaryRestrictions: data });
  };

  const handleHouseholdSubmit = (data: { adults: number; kids: number; dogs: number; cats: number }) => {
    handleClusterSubmit({ household: data });
  };

  const handleMissionSubmit = (data: { medical: string[]; lifestyle: string[] }) => {
    handleClusterSubmit({ missions: data });
  };

  const handleSummaryComplete = () => {
    onComplete(userProfile);
  };

  const renderCluster = () => {
    switch (currentCluster) {
      case "language":
        return <ClusterLanguage onSelect={handleLanguageSelect} selectedLanguage={userProfile.language} />;
      case "safety":
        return <ClusterSafety onSubmit={handleSafetySubmit} />;
      case "household":
        return <ClusterHousehold onSubmit={handleHouseholdSubmit} />;
      case "mission":
        return <ClusterMission onSubmit={handleMissionSubmit} />;
      case "summary":
        return <DigitalTwinSummary profile={userProfile} onComplete={handleSummaryComplete} />;
      default:
        return null;
    }
  };

  // Show permission request first
  if (!permissionsGranted) {
    return <PermissionRequest onPermissionsGranted={() => setPermissionsGranted(true)} />;
  }

  return (
    <div className="min-h-screen bg-kaeva-void relative flex items-center justify-center p-4 sm:p-8">
      <AuroraBackground />
      
      <div className="relative z-10 w-full max-w-4xl space-y-8">
        {/* Kaeva Aperture */}
        <div className="flex flex-col items-center space-y-6">
          <KaevaAperture state={apertureState} size="lg" />
          
          {/* AI Message */}
          {displayedMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl"
            >
              <p className="text-lg sm:text-xl md:text-2xl text-kaeva-slate-200 tracking-wide">
                {displayedMessage}
              </p>
            </motion.div>
          )}
        </div>

        {/* Cluster Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCluster}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={springTransition}
            className="w-full"
          >
            {renderCluster()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeepOnboarding;
