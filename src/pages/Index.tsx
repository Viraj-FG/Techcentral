import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Splash from "@/components/Splash";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";
import HouseholdSetup from "@/components/HouseholdSetup";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { PageTransition } from "@/components/layout/PageTransition";

const Index = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<"splash" | "onboarding" | "household-setup" | "dashboard" | null>(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Enable swipe navigation on dashboard and get swipe state
  const swipeState = useSwipeNavigation({ enabled: appState === "dashboard" });

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
          // Check if user has a household
          if (!profile.current_household_id) {
            setUserProfile(profile);
            setAppState("household-setup"); // Missing household → Setup
          } else {
            setUserProfile(profile);
            setAppState("dashboard"); // Returning user → Dashboard
          }
        } else {
          setAppState("onboarding"); // New user → Onboarding
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
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-secondary text-lg animate-pulse">Loading Kaeva...</div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {appState === "onboarding" && (
        <VoiceOnboarding 
          key="voice-onboarding"
          onComplete={(profile) => {
            setUserProfile(profile);
            setAppState("dashboard");
          }}
          onExit={async () => {
            // For admin testing: mark onboarding as complete to prevent loop
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              // Update profile to mark onboarding as complete
              await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', session.user.id);
              
              // Fetch updated profile
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              setUserProfile(profile);
            }
            setAppState("dashboard");
          }}
        />
      )}
      
      {appState === "household-setup" && (
        <HouseholdSetup
          key="household-setup"
          onComplete={async (householdId) => {
            // Fetch updated profile with household_id
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              setUserProfile(profile);
            }
            setAppState("dashboard");
          }}
        />
      )}

      {appState === "dashboard" && userProfile && (
        <PageTransition 
          swipeProgress={swipeState.progress}
          swipeDirection={swipeState.direction}
        >
          <Dashboard key="dashboard" profile={userProfile} />
        </PageTransition>
      )}
    </AnimatePresence>
  );
};

export default Index;
