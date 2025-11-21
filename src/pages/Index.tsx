import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Splash from "@/components/Splash";
import DeepOnboarding from "@/components/DeepOnboarding";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import SleepingKaeva from "@/components/SleepingKaeva";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [appState, setAppState] = useState<"splash" | "onboarding" | "sleeping" | "dashboard">("splash");
  const [userProfile, setUserProfile] = useState(null);
  // Always use voice mode with OpenAI Realtime API (works cross-browser)
  const [useVoiceMode] = useState(true);

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
          />
        ) : (
          <DeepOnboarding 
            key="onboarding"
            onComplete={(profile) => {
              setUserProfile(profile);
              setAppState("dashboard");
            }} 
          />
        )
      )}
      
      {appState === "sleeping" && (
        <SleepingKaeva 
          key="sleeping" 
          onWake={() => setAppState("dashboard")} 
        />
      )}
      
      {appState === "dashboard" && userProfile && (
        <Dashboard key="dashboard" profile={userProfile} />
      )}
    </AnimatePresence>
  );
};

export default Index;
