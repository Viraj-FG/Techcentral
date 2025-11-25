import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdInit } from "@/hooks/useHouseholdInit";
import Splash from "@/components/Splash";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";
import LoadingState from "@/components/LoadingState";
import { useToast } from "@/hooks/use-toast";

import { checkSupabaseConnection } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, profile, isLoading: authLoading, refreshProfile, user } = useAuth();
  const { ensureHousehold, completeOnboarding, isInitializing: isHouseholdInitializing } = useHouseholdInit();
  const [appState, setAppState] = useState<"splash" | "onboarding" | "dashboard" | null>(null);
  const [userProfile, setUserProfile] = useState(profile);

  // Sync profile from auth context
  useEffect(() => {
    if (profile) {
      setUserProfile(profile);
    }
  }, [profile]);

  // Handle authentication and routing
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Show splash first
    if (!appState) {
      setAppState("splash");
      return;
    }

    // After splash, check onboarding status and household
    if (appState === "splash" && profile) {
      if (profile.onboarding_completed) {
        // Check if household exists
        ensureHousehold().then(() => {
          setAppState("dashboard");
        });
      } else {
        setAppState("onboarding");
      }
    }
  }, [authLoading, isAuthenticated, appState, profile, navigate, ensureHousehold]);

  const handleOnboardingComplete = async (completedProfile?: any) => {
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
    console.log("⏭️ Skipping onboarding requested");
    if (!user) {
      console.error("❌ Cannot skip onboarding: No user found");
      return;
    }

    try {
      console.log("⏳ Calling completeOnboarding...");
      await completeOnboarding();
      console.log("✅ Onboarding skipped, setting dashboard state");
      setAppState("dashboard");
    } catch (error: any) {
      console.error("❌ Error skipping onboarding:", error);
      
      const isTimeout = error.message?.includes('timed out') || error.message?.includes('timeout');
      
      if (isTimeout) {
        // Check connection to be sure
        const isConnected = await checkSupabaseConnection();
        if (!isConnected) {
          // Force dashboard anyway if we are in dev mode or if user insists
          console.log("⚠️ Connection lost but forcing dashboard for debugging/offline access");
          setAppState("dashboard");
          toast({
            title: "Offline Mode",
            description: "Connection lost. Entering offline mode.",
            duration: 4000,
          });
          return;
        }
      }

      const title = isTimeout ? "Server Timeout" : "Setup Failed";
      const description = isTimeout 
        ? "The server is taking too long to respond. Please try again." 
        : "Failed to skip onboarding. Please try again.";

      toast({
        title,
        description,
        variant: "destructive",
        duration: 6000,
      });
    }
  };

  // Loading state
  if (authLoading || appState === null || isHouseholdInitializing) {
    return (
      <div className="fixed inset-0 bg-kaeva-void flex items-center justify-center">
        <LoadingState
          message={isHouseholdInitializing ? "Setting up your space..." : "Loading Kaeva..."}
          timeout={30000}
          onTimeout={() => {
            console.warn("⏱️ Loading timeout - redirecting to login");
            toast({
              title: "Loading Timeout",
              description: "Redirecting to login...",
              variant: "destructive",
            });
            navigate("/auth");
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

      {appState === "dashboard" && userProfile && (
        <Dashboard 
          key="dashboard"
          profile={userProfile}
        />
      )}
    </AnimatePresence>
  );
};

export default Index;
