import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Splash from "@/components/Splash";
import DeepOnboarding from "@/components/DeepOnboarding";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [appState, setAppState] = useState<"splash" | "onboarding" | "dashboard">("splash");
  const [userProfile, setUserProfile] = useState(null);
  const [useVoiceMode, setUseVoiceMode] = useState(() => {
    // Check localStorage for user preference, otherwise check browser support
    const savedPreference = localStorage.getItem("kaeva_voice_mode");
    if (savedPreference !== null) {
      return savedPreference === "true";
    }
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  });

  const toggleVoiceMode = () => {
    setUseVoiceMode(prev => {
      const newValue = !prev;
      localStorage.setItem("kaeva_voice_mode", String(newValue));
      return newValue;
    });
  };

  useEffect(() => {
    const completed = localStorage.getItem("kaeva_onboarding_complete");
    const savedProfile = localStorage.getItem("kaeva_user_profile");
    
    if (completed && savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setAppState("dashboard");
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      {appState === "splash" && (
        <Splash key="splash" onComplete={() => setAppState("onboarding")} />
      )}
      
      {appState === "onboarding" && (
        useVoiceMode ? (
          <VoiceOnboarding 
            key="voice-onboarding"
            onComplete={(profile) => {
              setUserProfile(profile);
              setAppState("dashboard");
            }}
            onToggleMode={toggleVoiceMode}
          />
        ) : (
          <DeepOnboarding 
            key="onboarding"
            onComplete={(profile) => {
              setUserProfile(profile);
              setAppState("dashboard");
            }}
            onToggleMode={toggleVoiceMode}
          />
        )
      )}
      
      {appState === "dashboard" && userProfile && (
        <Dashboard key="dashboard" profile={userProfile} />
      )}
    </AnimatePresence>
  );
};

export default Index;
