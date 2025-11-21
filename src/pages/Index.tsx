import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Splash from "@/components/Splash";
import DeepOnboarding from "@/components/DeepOnboarding";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import SleepingKaeva from "@/components/SleepingKaeva";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<"splash" | "onboarding" | "sleeping" | "dashboard">("splash");
  const [userProfile, setUserProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  // Always use voice mode with OpenAI Realtime API (works cross-browser)
  const [useVoiceMode] = useState(true);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }

        // Check if profile exists and onboarding is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile?.onboarding_completed) {
          setUserProfile(profile);
          setAppState("dashboard");
        } else {
          setAppState("onboarding");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        navigate('/auth');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isCheckingAuth) {
    return null; // Or a loading spinner
  }

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
