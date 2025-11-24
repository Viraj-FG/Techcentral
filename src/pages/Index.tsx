import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Splash from "@/components/Splash";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<"splash" | "onboarding" | "dashboard" | null>(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const validateOnboardingComplete = async (userId: string, householdId: string | null): Promise<boolean> => {
      // Check 1: Has household assigned
      if (!householdId) return false;
      
      // Check 2: Household exists in database
      const { data: household } = await supabase
        .from('households')
        .select('id')
        .eq('id', householdId)
        .single();
      if (!household) return false;
      
      // Check 3: Has at least basic profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_name, language')
        .eq('id', userId)
        .single();
      if (!profile?.user_name) return false;
      
      return true; // All checks passed
    };

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
          // Validate that onboarding is truly complete
          const isValid = await validateOnboardingComplete(session.user.id, profile.current_household_id);
          
          if (!isValid) {
            console.warn('❌ Incomplete onboarding detected - resetting to restart');
            // Reset onboarding_completed flag
            await supabase
              .from('profiles')
              .update({ onboarding_completed: false })
              .eq('id', session.user.id);
            
            setAppState("onboarding");
            return;
          }

          // Onboarding is valid, proceed to dashboard
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

  if (isCheckingAuth || appState === null) {
    return (
      <div className="fixed inset-0 bg-kaeva-void flex items-center justify-center">
        <div className="text-kaeva-sage text-lg animate-pulse">Loading Kaeva...</div>
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
            // Skip to dashboard WITHOUT marking onboarding complete
            // This allows users to come back and finish later
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profile) {
                setUserProfile(profile);
              }
            }
            setAppState("dashboard");
          }}
        />
      )}
      
      {appState === "dashboard" && userProfile && (
        <Dashboard key="dashboard" profile={userProfile} />
      )}
    </AnimatePresence>
  );
};

export default Index;
