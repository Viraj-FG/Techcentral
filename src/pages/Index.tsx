import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Splash from "@/components/Splash";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import SleepingKaeva from "@/components/SleepingKaeva";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<"splash" | "onboarding" | "sleeping" | "dashboard" | null>(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
          setAppState("dashboard"); // Returning user → Dashboard directly
        } else {
          setAppState("splash"); // New user → Splash → Wake Word → Onboarding
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

  if (isCheckingAuth || appState === null) {
    return (
      <div className="fixed inset-0 bg-kaeva-void flex items-center justify-center">
        <div className="text-kaeva-sage text-lg animate-pulse">Loading Kaeva...</div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {appState === "splash" && (
        <Splash key="splash" onComplete={() => setAppState("sleeping")} />
      )}
      
      {appState === "sleeping" && (
        <SleepingKaeva 
          key="sleeping" 
          onWake={() => setAppState("onboarding")} 
        />
      )}
      
      {appState === "onboarding" && (
        <VoiceOnboarding 
          key="voice-onboarding"
          onComplete={(profile) => {
            setUserProfile(profile);
            setAppState("dashboard");
          }}
          onExit={() => setAppState("dashboard")} 
        />
      )}
      
      {appState === "dashboard" && userProfile && (
        <Dashboard key="dashboard" profile={userProfile} />
      )}
    </AnimatePresence>
  );
};

export default Index;
