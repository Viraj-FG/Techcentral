import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useHouseholdInit } from "@/hooks/useHouseholdInit";
import Splash from "@/components/Splash";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";
import LoadingState from "@/components/LoadingState";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { profile, isLoading: profileLoading, refreshProfile } = useProfile();
  const { ensureHousehold, completeOnboarding, isInitializing: isHouseholdInitializing } = useHouseholdInit();
  const [appState, setAppState] = useState<"splash" | "onboarding" | "dashboard" | null>(null);

  console.log('📍 Index state:', {
    authLoading,
    isAuthenticated,
    profileLoading,
    hasProfile: !!profile,
    profileId: profile?.id,
    onboardingCompleted: profile?.onboarding_completed,
    appState
  });

  // Determine app state once profile is loaded
  useEffect(() => {
    // Still loading auth or profile
    if (authLoading || profileLoading) {
      console.log('📍 Still loading auth or profile');
      return;
    }

    // Not authenticated (ProtectedRoute should handle this, but just in case)
    if (!isAuthenticated || !user) {
      console.log('📍 Not authenticated');
      return;
    }

    // No profile found
    if (!profile) {
      console.log('📍 No profile found');
      return;
    }

    // Show splash first (only once)
    if (!appState) {
      console.log('📍 Setting splash state');
      setAppState("splash");
      return;
    }

    // After splash, check onboarding status
    if (appState === "splash") {
      if (profile.onboarding_completed) {
        console.log('📍 Onboarding complete, ensuring household and showing dashboard');
        ensureHousehold().then(() => {
          setAppState("dashboard");
        }).catch((error) => {
          console.error('📍 Failed to ensure household:', error);
          // Continue to dashboard anyway
          setAppState("dashboard");
        });
      } else {
        console.log('📍 Onboarding not complete, showing onboarding');
        setAppState("onboarding");
      }
    }
  }, [authLoading, profileLoading, isAuthenticated, user, profile, appState, ensureHousehold]);

  const handleOnboardingComplete = async () => {
    console.log("🎉 Onboarding complete");
    
    try {
      // Ensure household is created
      await ensureHousehold();
      
      // Refresh profile from database
      await refreshProfile();
      
      setAppState("dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOnboardingSkip = async () => {
    console.log("⏭️ Skipping onboarding");
    if (!user) return;

    try {
      await completeOnboarding();
      await refreshProfile();
      setAppState("dashboard");
    } catch (error: any) {
      console.error("❌ Error skipping onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to skip onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (authLoading || profileLoading || isHouseholdInitializing) {
    return (
      <div className="fixed inset-0 bg-kaeva-void flex items-center justify-center">
        <LoadingState
          message={
            isHouseholdInitializing 
              ? "Setting up your space..." 
              : profileLoading 
              ? "Loading your profile..." 
              : "Loading Kaeva..."
          }
          timeout={10000}
          onTimeout={() => {
            console.warn("⏱️ Loading is taking longer than expected");
            toast({
              title: "Still loading...",
              description: "This is taking longer than usual. Please wait.",
            });
          }}
        />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {appState === "splash" && (
        <Splash
          key="splash"
          onComplete={() => {
            if (profile?.onboarding_completed) {
              ensureHousehold().then(() => setAppState("dashboard"));
            } else {
              setAppState("onboarding");
            }
          }}
          autoAdvance={!!profile?.onboarding_completed}
        />
      )}

      {appState === "onboarding" && (
        <VoiceOnboarding 
          key="voice-onboarding"
          onComplete={handleOnboardingComplete}
          onExit={handleOnboardingSkip}
        />
      )}

      {appState === "dashboard" && profile && (
        <Dashboard 
          key="dashboard"
          profile={profile}
        />
      )}
    </AnimatePresence>
  );
};

export default Index;
