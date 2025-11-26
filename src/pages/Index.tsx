import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Splash from "@/components/Splash";
import Dashboard from "@/components/Dashboard";
import HouseholdSetup from "@/components/HouseholdSetup";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { OnboardingModuleSheet } from "@/components/onboarding/OnboardingModuleSheet";
import { useModularOnboarding } from "@/hooks/useModularOnboarding";

const Index = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<"splash" | "core-onboarding" | "household-setup" | "dashboard" | null>(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [coreOnboardingOpen, setCoreOnboardingOpen] = useState(false);
  const { modules, completeModule, reloadModules } = useModularOnboarding();

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

        // Store session for use after splash
        setSession(session);
        
        // Always show splash first for authenticated users
        setAppState("splash");
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

  const handleSplashComplete = async () => {
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    
    try {
      // Check profile after splash animation completes
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      await reloadModules();

      // Check if core module is complete (new modular onboarding)
      const onboardingModules = profile?.onboarding_modules as any || {};
      
      if (!onboardingModules.core) {
        // Core module not complete - show core onboarding
        setAppState("core-onboarding");
        setCoreOnboardingOpen(true);
      } else if (!profile.current_household_id) {
        // Core complete but no household - show household setup
        setUserProfile(profile);
        setAppState("household-setup");
      } else {
        // Everything complete - show dashboard
        setUserProfile(profile);
        setAppState("dashboard");
      }
    } catch (error) {
      console.error("Error loading profile after splash:", error);
      setAppState("core-onboarding");
      setCoreOnboardingOpen(true);
    }
  };

  const handleCoreComplete = async () => {
    setCoreOnboardingOpen(false);
    await handleSplashComplete(); // Re-check state after core completion
  };

  if (isCheckingAuth || appState === null) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-secondary text-lg animate-pulse">Loading Kaeva...</div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {appState === "splash" && (
          <Splash key="splash" onComplete={handleSplashComplete} />
      )}

      {appState === "core-onboarding" && (
        <div key="core-onboarding" />
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

      {/* Core onboarding sheet */}
      <OnboardingModuleSheet
        open={coreOnboardingOpen}
        module="core"
        onClose={() => {}}
        onComplete={handleCoreComplete}
      />
    </>
  );
};

export default Index;
