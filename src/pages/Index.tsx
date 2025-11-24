import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const Index = () => {
  const { user, profile, isReady, isAuthenticated, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [isReady, isAuthenticated, navigate]);

  // Determine view based on onboarding status
  useEffect(() => {
    if (isReady && isAuthenticated && profile) {
      if (profile.onboarding_completed) {
        setShowOnboarding(false);
      } else {
        setShowOnboarding(true);
      }
    }
  }, [isReady, isAuthenticated, profile]);

  const ensureHousehold = async () => {
    if (!user || !profile) return;

    if (profile.current_household_id) {
      console.log('✅ User already has household');
      return;
    }

    try {
      const { data: existingHouseholds } = await supabase
        .from('households')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (existingHouseholds && existingHouseholds.length > 0) {
        await supabase
          .from('profiles')
          .update({ current_household_id: existingHouseholds[0].id })
          .eq('id', user.id);
        
        await refreshProfile();
      } else {
        const { data: household, error } = await supabase
          .from('households')
          .insert({
            name: `${profile.user_name || 'User'}'s Household`,
            owner_id: user.id
          })
          .select()
          .single();

        if (error) throw error;

        await supabase
          .from('profiles')
          .update({ current_household_id: household.id })
          .eq('id', user.id);

        await refreshProfile();
      }
    } catch (error) {
      console.error('Failed to ensure household:', error);
      toast.error("Failed to set up household");
    }
  };

  const handleOnboardingComplete = async () => {
    await ensureHousehold();
    await refreshProfile();
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = async () => {
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
        
        await ensureHousehold();
        await refreshProfile();
        setShowOnboarding(false);
      } catch (error) {
        console.error("Error skipping onboarding:", error);
      }
    }
  };

  if (!isReady || !isAuthenticated) {
    return <LoadingState />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-kaeva-void">
      <AnimatePresence mode="wait">
        {showOnboarding ? (
          <VoiceOnboarding
            key="onboarding"
            onComplete={handleOnboardingComplete}
            onExit={handleOnboardingSkip}
          />
        ) : (
          <Dashboard key="dashboard" profile={profile} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
