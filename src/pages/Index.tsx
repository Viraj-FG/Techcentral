import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Splash from "@/components/Splash";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";
import LoadingState from "@/components/LoadingState";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, profile, isLoading: authLoading, refreshProfile, user } = useAuth();
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
  }, [authLoading, isAuthenticated, appState, profile, navigate]);

  const ensureHousehold = async () => {
    if (!user || !profile) return;

    if (profile.current_household_id) {
      console.log('✅ User already has household:', profile.current_household_id);
      return;
    }

    try {
      // Check if user already owns a household
      const { data: existingHouseholds } = await supabase
        .from('households')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (existingHouseholds && existingHouseholds.length > 0) {
        // Link existing household
        console.log('✅ Found existing household, linking:', existingHouseholds[0].id);
        await supabase
          .from('profiles')
          .update({ current_household_id: existingHouseholds[0].id })
          .eq('id', user.id);
        
        await refreshProfile();
      } else {
        // Create new household
        const { data: household, error } = await supabase
          .from('households')
          .insert({
            name: `${profile.user_name || 'User'}'s Household`,
            owner_id: user.id
          })
          .select()
          .single();

        if (error) throw error;

        // Update profile with new household
        await supabase
          .from('profiles')
          .update({ current_household_id: household.id })
          .eq('id', user.id);

        await refreshProfile();
        console.log('✅ Auto-created household:', household.id);
      }
    } catch (error) {
      console.error('Failed to ensure household:', error);
      toast({
        title: "Setup Error",
        description: "Failed to set up household. Redirecting...",
        variant: "destructive",
      });
      navigate('/household');
    }
  };

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
    if (!user) return;

    try {
      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      // Ensure household exists
      await ensureHousehold();
      // Refresh profile from backend
      await refreshProfile();
      setAppState("dashboard");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to skip onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (authLoading || appState === null) {
    return (
      <div className="fixed inset-0 bg-kaeva-void flex items-center justify-center">
        <LoadingState
          message="Loading Kaeva..."
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
