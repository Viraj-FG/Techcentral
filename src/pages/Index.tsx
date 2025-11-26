import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Splash from "@/components/Splash";
import Dashboard from "@/components/Dashboard";
import HouseholdSetup from "@/components/HouseholdSetup";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { OnboardingModuleSheet } from "@/components/onboarding/OnboardingModuleSheet";
import { useModularOnboarding } from "@/hooks/useModularOnboarding";

/**
 * App States:
 * - splash: Initial branded loading (both first-time and returning users)
 * - core-onboarding: First-time user - collect basic profile info
 * - household-setup: First-time user - create/join household
 * - dashboard: Returning user - main app experience
 * 
 * Flow:
 * First-time user: splash → core-onboarding → household-setup → dashboard
 * Returning user: splash (shorter) → dashboard
 */
type AppState = "splash" | "core-onboarding" | "household-setup" | "dashboard";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("splash");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean | null>(null);
  const [coreOnboardingOpen, setCoreOnboardingOpen] = useState(false);
  const { reloadModules } = useModularOnboarding();

  // Enable swipe navigation on dashboard
  const swipeState = useSwipeNavigation({ enabled: appState === "dashboard" });

  // Determine user type on mount
  useEffect(() => {
    const determineUserType = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_modules, current_household_id, created_at')
          .eq('id', session.user.id)
          .single();

        const onboardingModules = profile?.onboarding_modules as any || {};
        const hasCompletedCore = !!onboardingModules.core;
        const hasHousehold = !!profile?.current_household_id;

        // First-time user = hasn't completed core onboarding
        setIsFirstTimeUser(!hasCompletedCore);
        
        // Store profile reference for later
        if (hasCompletedCore && hasHousehold) {
          // Fetch full profile for dashboard
          const { data: fullProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUserProfile(fullProfile);
        }
      } catch (error) {
        console.error("Error determining user type:", error);
        setIsFirstTimeUser(true); // Fail-safe to onboarding
      }
    };

    determineUserType();
  }, []);

  // Handle splash completion
  const handleSplashComplete = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      await reloadModules();

      const onboardingModules = profile?.onboarding_modules as any || {};
      const hasCompletedCore = !!onboardingModules.core;
      const hasHousehold = !!profile?.current_household_id;

      if (!hasCompletedCore) {
        // FIRST-TIME USER: Start core onboarding
        setAppState("core-onboarding");
        setCoreOnboardingOpen(true);
      } else if (!hasHousehold) {
        // PARTIALLY COMPLETE: Needs household
        setUserProfile(profile);
        setAppState("household-setup");
      } else {
        // RETURNING USER: Go to dashboard
        setUserProfile(profile);
        setAppState("dashboard");
      }
    } catch (error) {
      console.error("Error after splash:", error);
      // Fail-safe: start onboarding
      setAppState("core-onboarding");
      setCoreOnboardingOpen(true);
    }
  }, [reloadModules]);

  // Handle core onboarding completion
  const handleCoreComplete = useCallback(async () => {
    setCoreOnboardingOpen(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile?.current_household_id) {
        setUserProfile(profile);
        setAppState("household-setup");
      } else {
        setUserProfile(profile);
        setAppState("dashboard");
      }
    } catch (error) {
      console.error("Error after core onboarding:", error);
    }
  }, []);

  // Handle household setup completion
  const handleHouseholdComplete = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setUserProfile(profile);
      setAppState("dashboard");
    } catch (error) {
      console.error("Error after household setup:", error);
    }
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {appState === "splash" && (
          <Splash 
            key="splash" 
            onComplete={handleSplashComplete}
            // Shorter splash for returning users
            duration={isFirstTimeUser === false ? 1500 : 2500}
          />
        )}

        {appState === "core-onboarding" && (
          <div key="core-onboarding" className="fixed inset-0 bg-background" />
        )}
        
        {appState === "household-setup" && (
          <HouseholdSetup
            key="household-setup"
            onComplete={handleHouseholdComplete}
          />
        )}

        {appState === "dashboard" && userProfile && (
          <PageTransition 
            key="dashboard"
            swipeProgress={swipeState.progress}
            swipeDirection={swipeState.direction}
          >
            <Dashboard profile={userProfile} />
          </PageTransition>
        )}
      </AnimatePresence>

      {/* Core onboarding sheet - controlled externally */}
      <OnboardingModuleSheet
        open={coreOnboardingOpen}
        module="core"
        onClose={() => {}} // Prevent closing without completing
        onComplete={handleCoreComplete}
      />
    </>
  );
};

export default Index;
