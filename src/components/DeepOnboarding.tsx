import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import KaevaAperture from "./KaevaAperture";
import ClusterLanguage from "./ClusterLanguage";
import ClusterSafety from "./ClusterSafety";
import ClusterBeauty from "./ClusterBeauty";
import ClusterHousehold from "./ClusterHousehold";
import ClusterMission from "./ClusterMission";
import DigitalTwinSummary from "./DigitalTwinSummary";
import AuroraBackground from "./AuroraBackground";
import PermissionRequest from "./PermissionRequest";
import VolumeControl from "./VolumeControl";
import { convertPCMtoWAV, playAudio } from "@/lib/audioEngine";

interface UserProfile {
  language: string;
  dietaryRestrictions: {
    values: string[];
    allergies: string[];
  };
  skinProfile: string[];
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

type ClusterType = "language" | "safety" | "beauty" | "household" | "mission" | "summary";
type ApertureState = "idle" | "thinking" | "speaking";

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

const clusterColors: Record<ClusterType, string> = {
  language: "#70E098",
  safety: "#70E098",
  beauty: "#D97757",
  household: "#E2E8F0",
  mission: "#2DD4BF",
  summary: "#70E098"
};

const getFallbackMessage = (cluster: ClusterType): string => {
  const fallbacks: Record<ClusterType, string> = {
    language: "Hello. I am Kaeva. How do we speak?",
    safety: "Protecting your body. Any dietary boundaries?",
    beauty: "Optimizing your routine. Tell me about your skin.",
    household: "Who enters your kitchen?",
    mission: "Final calibration. What is our primary mission?",
    summary: "Profile generated. Systems calibrated."
  };
  return fallbacks[cluster];
};

const DeepOnboarding = ({ onComplete }: DeepOnboardingProps) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    language: "",
    dietaryRestrictions: { values: [], allergies: [] },
    skinProfile: [],
    household: { adults: 1, kids: 0, dogs: 0, cats: 0 },
    missions: { medical: [], lifestyle: [] },
    internalFlags: { enableToxicFoodWarnings: false }
  });

  const [currentCluster, setCurrentCluster] = useState<ClusterType>("language");
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [aiMessage, setAiMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState<number>(() => {
    const savedVolume = localStorage.getItem('kaeva_volume');
    return savedVolume ? parseFloat(savedVolume) : 0.7;
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Save volume to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kaeva_volume', volume.toString());
    // Update current audio element volume if playing
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Initial AI greeting with TTS
  useEffect(() => {
    if (!permissionsGranted) return;

    const fetchInitialGreeting = async () => {
      setApertureState("thinking");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      try {
        const { data, error } = await supabase.functions.invoke('kaeva-tts', {
          body: {
            text: "Hello. I am Kaeva. Let's calibrate your Life OS. First, how do we speak?"
          }
        });

        if (error) throw error;
        
        const message = data.text || getFallbackMessage("language");
        setAiMessage(message);

        // Play audio if available
        if (data.audioData) {
          console.log('🎤 Received PCM audio data, length:', data.audioData.length);
          console.log('🎤 MimeType:', data.mimeType);
          setApertureState("speaking");
          try {
            const audioBlob = convertPCMtoWAV(data.audioData, data.mimeType);
            console.log('🎤 Converted to WAV blob, size:', audioBlob.size);
            const audio = await playAudio(audioBlob, volume);
            audioRef.current = audio;
            console.log('🎤 Audio playback completed');
          } catch (audioError) {
            console.error('🎤 Audio playback failed:', audioError);
          }
          setApertureState("idle");
        } else {
          console.log('🎤 No audio data received');
          setApertureState("idle");
        }
      } catch (error) {
        console.error("Initial greeting error:", error);
        setAiMessage(getFallbackMessage("language"));
        setApertureState("idle");
      }
    };

    fetchInitialGreeting();
  }, [permissionsGranted]);

  const getNextCluster = (current: ClusterType): ClusterType => {
    const flow: ClusterType[] = ["language", "safety", "beauty", "household", "mission", "summary"];
    const currentIndex = flow.indexOf(current);
    return flow[currentIndex + 1] || "summary";
  };

  const formatUserInput = (clusterData: any): string => {
    if (clusterData.language) return `I prefer ${clusterData.language}`;
    if (clusterData.dietaryRestrictions) {
      const { values, allergies } = clusterData.dietaryRestrictions;
      let text = "";
      if (values.length > 0) text += `My dietary preferences: ${values.join(", ")}. `;
      if (allergies.length > 0) text += `My allergies: ${allergies.join(", ")}.`;
      return text || "No dietary restrictions";
    }
    if (clusterData.skinProfile) {
      return clusterData.skinProfile.length > 0 
        ? `My skin profile: ${clusterData.skinProfile.join(", ")}`
        : "No specific skin concerns";
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
    
    if (clusterData.household?.dogs > 0) {
      updatedProfile.internalFlags.enableToxicFoodWarnings = true;
    }
    
    setUserProfile(updatedProfile);
    setApertureState("thinking");
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const nextCluster = getNextCluster(currentCluster);
    
    try {
      const { data, error } = await supabase.functions.invoke('kaeva-tts', {
        body: {
          text: getFallbackMessage(nextCluster)
        }
      });

      if (error) throw error;

      const message = data.text || getFallbackMessage(nextCluster);
      setAiMessage(message);

      // Play audio if available
      if (data.audioData) {
        setApertureState("speaking");
        const audioBlob = convertPCMtoWAV(data.audioData, data.mimeType);
        const audio = await playAudio(audioBlob, volume);
        audioRef.current = audio;
      }
      
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

  const handleBeautySubmit = (data: { skinProfile: string[] }) => {
    handleClusterSubmit({ skinProfile: data.skinProfile });
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
      case "beauty":
        return <ClusterBeauty onSubmit={handleBeautySubmit} />;
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

  if (!permissionsGranted) {
    return <PermissionRequest onPermissionsGranted={() => setPermissionsGranted(true)} />;
  }

  return (
    <div className="min-h-screen bg-kaeva-void relative flex items-center justify-center p-4 sm:p-8">
      <AuroraBackground atmosphereColor={clusterColors[currentCluster]} />
      
      <div className="relative z-10 w-full max-w-4xl space-y-8">
        <div className="flex flex-col items-center space-y-6">
          <KaevaAperture state={apertureState} size="lg" audioElement={audioRef.current} />
          
          {aiMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl"
            >
              <p className="text-lg sm:text-xl md:text-2xl text-kaeva-slate-400 tracking-wide">
                {aiMessage}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <VolumeControl volume={volume} onVolumeChange={setVolume} />
          </motion.div>
        </div>

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
